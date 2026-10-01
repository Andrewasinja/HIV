import csv
from unittest import mock

from django.conf import settings
from django.core.cache import caches
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from . import ml
from .models import Screening

DATASET = settings.BASE_DIR.parent / 'HIV_dataset.csv'

RAW_TO_CODE = {
    'marital': ('Marital Staus', {'cohabiting': 'cohabiting', 'divorced': 'divorced', 'married': 'married',
                                  'unmarried': 'unmarried', 'widowed': 'widowed'}),
    'education': ('Educational Background', {'college degree': 'college', 'college dregree': 'college',
                                             'illiteracy': 'illiteracy', 'primary school': 'primary',
                                             'junior high school': 'junior_high',
                                             'senior high school': 'senior_high'}),
    'std': ('STD', {'yes': 'yes', 'no': 'no'}),
    'tested_past_year': ('HIV TEST IN PAST YEAR', {'yes': 'yes', 'no': 'no'}),
    'aids_education': ('AIDS education', {'yes': 'yes', 'no': 'no'}),
    'place': ('Places of seeking sex partners', {'internet': 'internet', 'public bath': 'public_bath',
                                                 'park': 'park', 'bar': 'bar', 'others': 'others'}),
    'orientation': ('SEXUAL ORIENTATION', {'heterosexual': 'heterosexual', 'hetersexual': 'heterosexual',
                                           'homosexual': 'homosexual', 'bisexual': 'bisexual'}),
    'drugs': ('Drug- taking', {'yes': 'yes', 'no': 'no'}),
}

SAMPLE = {
    'age': 22, 'marital': 'unmarried', 'education': 'college', 'std': 'yes',
    'tested_past_year': 'no', 'aids_education': 'no', 'place': 'internet',
    'orientation': 'heterosexual', 'drugs': 'no',
}


def load_dataset():
    rows, labels = [], []
    with open(DATASET, newline='', encoding='utf-8') as f:
        for raw in csv.DictReader(f):
            if raw['Places of seeking sex partners'].strip().lower() in ('', 'none'):
                continue
            answers = {'age': int(raw['Age'])}
            for field, (col, mapping) in RAW_TO_CODE.items():
                answers[field] = mapping[raw[col].strip().lower()]
            rows.append(answers)
            labels.append(raw['Result'].strip().lower())
    return rows, labels


class EncodingTests(TestCase):
    def test_dataset_accuracy_matches_training(self):
        # Typo rows ("dregree", "hetersexual") are folded into the correct category,
        # so a small drift from the 86.2% seen with raw training encoding is expected.
        rows, labels = load_dataset()
        scores = ml.score_many(rows)
        preds = ['positive' if s > 0 else 'negative' for s in scores]
        accuracy = sum(p == y for p, y in zip(preds, labels)) / len(labels)
        self.assertGreater(accuracy, 0.83)

    def test_baseline_answers_produce_no_category_columns(self):
        answers = {'age': 40, 'marital': 'cohabiting', 'education': 'college', 'std': 'no',
                   'tested_past_year': 'no', 'aids_education': 'no', 'place': 'bar',
                   'orientation': 'bisexual', 'drugs': 'no'}
        row = ml.build_features(answers)
        self.assertEqual(row[1:].sum(), 0)
        self.assertAlmostEqual(row[0], (40 - ml.AGE_MEAN) / ml.AGE_STD)

    def test_typo_columns_never_set(self):
        cols = list(ml.get_model().feature_names_in_)
        row = ml.build_features({**SAMPLE, 'orientation': 'heterosexual'})
        self.assertEqual(row[cols.index('SEXUAL ORIENTATION_hetersexual')], 0)
        self.assertEqual(row[cols.index('Educational Background_college dregree')], 0)

    def test_factors_only_report_risk_raising_answers(self):
        result = ml.predict(SAMPLE)
        for factor in result['top_factors']:
            self.assertGreater(factor['impact'], 0)
            self.assertNotEqual(factor['value'], factor['safer_value'])

    def test_drug_use_never_suggested_as_safer(self):
        result = ml.predict({**SAMPLE, 'drugs': 'no'})
        self.assertNotIn('drugs', [f['field'] for f in result['top_factors']])


class ApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_form_options(self):
        res = self.client.get('/api/form-options/')
        self.assertEqual(res.status_code, 200)
        self.assertIn('internet', res.json()['fields']['place'])

    def test_predict_saves_anonymously(self):
        res = self.client.post('/api/predict/', {**SAMPLE, 'language': 'lg'}, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertIn(res.json()['risk_level'], {'low', 'medium', 'high'})
        saved = Screening.objects.get()
        self.assertEqual(saved.age_band, '18-24')
        self.assertEqual(saved.language, 'lg')
        self.assertFalse(hasattr(saved, 'orientation'))

    def test_simulate_does_not_save(self):
        res = self.client.post('/api/simulate/', SAMPLE, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(Screening.objects.count(), 0)

    def test_invalid_input_rejected(self):
        res = self.client.post('/api/predict/', {**SAMPLE, 'age': 5, 'place': 'moon'}, format='json')
        self.assertEqual(res.status_code, 400)
        self.assertIn('age', res.json())
        self.assertIn('place', res.json())


TEST_CACHES = {
    'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache', 'LOCATION': 'default-test'},
    'tts': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache', 'LOCATION': 'tts-test'},
}


def fake_response(status_code=200, json_data=None, content=b'', headers=None):
    resp = mock.Mock(status_code=status_code, content=content, headers=headers or {}, text=str(json_data))
    resp.json.return_value = json_data
    return resp


@override_settings(SUNBIRD_API_TOKEN='test-token', CACHES=TEST_CACHES)
class SpeechTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        caches['tts'].clear()
        caches['default'].clear()

    @mock.patch('screening.tts.requests.post')
    def test_streamed_audio_returned_and_cached(self, post):
        post.return_value = fake_response(content=b'RIFFdata', headers={'Content-Type': 'audio/wav'})

        for _ in range(2):
            res = self.client.post('/api/tts/', {'text': 'Oli otya?', 'lang': 'lg'}, format='json')
            self.assertEqual(res.status_code, 200)
            self.assertEqual(res['Content-Type'], 'audio/wav')
            self.assertEqual(res.content, b'RIFFdata')

        post.assert_called_once()
        body = post.call_args.kwargs['json']
        self.assertEqual((body['language'], body['response_mode']), ('lug', 'stream'))
        self.assertEqual(post.call_args.kwargs['headers']['Authorization'], 'Bearer test-token')

    @mock.patch('screening.tts.requests.get')
    @mock.patch('screening.tts.requests.post')
    def test_signed_url_response_is_downloaded(self, post, get):
        post.return_value = fake_response(
            json_data={'audio_url': 'https://x/a.mp3?sig=1'}, headers={'Content-Type': 'application/json'},
        )
        get.return_value = fake_response(content=b'ID3data', headers={'Content-Type': 'application/octet-stream'})
        res = self.client.post('/api/tts/', {'text': 'Oli otya?', 'lang': 'lg'}, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res['Content-Type'], 'audio/mpeg')
        self.assertEqual(res.content, b'ID3data')

    @override_settings(SUNBIRD_API_TOKEN='')
    def test_missing_token_returns_503(self):
        res = self.client.post('/api/tts/', {'text': 'Oli otya?', 'lang': 'lg'}, format='json')
        self.assertEqual(res.status_code, 503)
        self.assertFalse(self.client.get('/api/form-options/').json()['luganda_voice'])

    @mock.patch('screening.tts.requests.post')
    def test_sunbird_error_returns_502(self, post):
        post.return_value = fake_response(status_code=500, json_data={'detail': 'boom'})
        res = self.client.post('/api/tts/', {'text': 'Oli otya?', 'lang': 'lg'}, format='json')
        self.assertEqual(res.status_code, 502)

    def test_too_long_or_wrong_language_rejected(self):
        res = self.client.post('/api/tts/', {'text': 'a' * 1501, 'lang': 'lg'}, format='json')
        self.assertEqual(res.status_code, 400)
        res = self.client.post('/api/tts/', {'text': 'Hello', 'lang': 'en'}, format='json')
        self.assertEqual(res.status_code, 400)

    def test_form_options_reports_voice_enabled(self):
        self.assertTrue(self.client.get('/api/form-options/').json()['luganda_voice'])
