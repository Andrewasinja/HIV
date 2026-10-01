"""Bridge between survey answers and the trained SVM.

The pickle is a bare sklearn SVC (no pipeline), so the training preprocessing is
reproduced here: one-hot encoding with the first category dropped, and Age
standardized with the training mean/std.
"""
import warnings
from functools import lru_cache

import joblib
import numpy as np
from django.conf import settings

AGE_MIN, AGE_MAX = 12, 80
AGE_MEAN = 40.022922636103154
AGE_STD = 18.141896658862166

# Each answer code maps to the one-hot column it switches on.
# None means the category was the dropped baseline (all zeros).
FIELDS = {
    'marital': {
        'unmarried': 'Marital Staus_unmarried',
        'married': 'Marital Staus_married',
        'divorced': 'Marital Staus_divorced',
        'widowed': 'Marital Staus_widowed',
        'cohabiting': None,
    },
    'education': {
        'illiteracy': 'Educational Background_illiteracy',
        'primary': 'Educational Background_primary school',
        'junior_high': 'Educational Background_junior high school',
        'senior_high': 'Educational Background_senior high school',
        'college': None,
    },
    'std': {'yes': 'STD_yes', 'no': None},
    'tested_past_year': {'yes': 'HIV TEST IN PAST YEAR_yes', 'no': None},
    'aids_education': {'yes': 'AIDS education_yes', 'no': None},
    'place': {
        'internet': 'Places of seeking sex partners_internet',
        'public_bath': 'Places of seeking sex partners_public bath',
        'park': 'Places of seeking sex partners_park',
        'others': 'Places of seeking sex partners_others',
        'bar': None,
    },
    'orientation': {
        'heterosexual': 'SEXUAL ORIENTATION_heterosexual',
        'homosexual': 'SEXUAL ORIENTATION_homosexual',
        'bisexual': None,
    },
    'drugs': {'yes': 'Drug- taking_yes', 'no': None},
}

ACTIONABLE_FIELDS = {'std', 'tested_past_year', 'aids_education', 'place'}

# The training data links drug-taking to *lower* risk, an artifact we must never
# present as advice: drug use is never offered as the safer alternative.
NEVER_SAFER = {('drugs', 'yes')}

# Minimum score drop for an answer to count as a risk factor.
FACTOR_MIN_IMPACT = 0.05
MAX_FACTORS = 3


@lru_cache(maxsize=1)
def get_model():
    model = joblib.load(settings.MODEL_PATH)
    expected = {col for choices in FIELDS.values() for col in choices.values() if col}
    missing = expected - set(model.feature_names_in_)
    if missing:
        raise RuntimeError(f'Model is missing expected features: {sorted(missing)}')
    return model


def build_features(answers):
    model = get_model()
    columns = list(model.feature_names_in_)
    row = np.zeros(len(columns))
    row[columns.index('Age')] = (answers['age'] - AGE_MEAN) / AGE_STD
    for field, choices in FIELDS.items():
        col = choices[answers[field]]
        if col:
            row[columns.index(col)] = 1.0
    return row


def score_many(answer_sets):
    model = get_model()
    X = np.vstack([build_features(a) for a in answer_sets])
    with warnings.catch_warnings():
        # Columns are already in feature_names_in_ order; sklearn just can't tell from a bare array.
        warnings.filterwarnings('ignore', message='X does not have valid feature names')
        return model.decision_function(X)


def risk_level(score):
    t = settings.RISK_THRESHOLDS
    if score < t['low']:
        return 'low'
    if score > t['high']:
        return 'high'
    return 'medium'


def top_factors(answers, base_score):
    """Rank answers by how much the score would drop if changed to the lowest-risk option."""
    factors = []
    for field, choices in FIELDS.items():
        alternatives = [c for c in choices if c != answers[field] and (field, c) not in NEVER_SAFER]
        if not alternatives:
            continue
        scores = score_many([{**answers, field: alt} for alt in alternatives])
        best = int(np.argmin(scores))
        impact = float(base_score - scores[best])
        if impact >= FACTOR_MIN_IMPACT:
            factors.append({
                'field': field,
                'value': answers[field],
                'safer_value': alternatives[best],
                'impact': round(impact, 3),
                'actionable': field in ACTIONABLE_FIELDS,
            })
    factors.sort(key=lambda f: f['impact'], reverse=True)
    return factors[:MAX_FACTORS]


def predict(answers):
    score = float(score_many([answers])[0])
    return {
        'score': round(score, 3),
        'risk_level': risk_level(score),
        'top_factors': top_factors(answers, score),
    }


def form_options():
    return {
        'age': {'min': AGE_MIN, 'max': AGE_MAX},
        'fields': {field: list(choices) for field, choices in FIELDS.items()},
        'actionable': sorted(ACTIONABLE_FIELDS),
    }
