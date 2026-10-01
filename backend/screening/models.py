from django.db import models


class Screening(models.Model):
    """One anonymous screening.

    Exact age, sexual orientation and any identifiers are deliberately not stored;
    orientation is legally sensitive and is only used transiently for prediction.
    """

    RISK_LEVELS = [('low', 'Low'), ('medium', 'Medium'), ('high', 'High')]
    AGE_BANDS = [
        ('12-17', '12-17'), ('18-24', '18-24'), ('25-34', '25-34'),
        ('35-49', '35-49'), ('50-64', '50-64'), ('65+', '65+'),
    ]

    age_band = models.CharField(max_length=8, choices=AGE_BANDS)
    marital = models.CharField(max_length=16)
    education = models.CharField(max_length=16)
    std = models.CharField(max_length=3)
    tested_past_year = models.CharField(max_length=3)
    aids_education = models.CharField(max_length=3)
    place = models.CharField(max_length=16)
    drugs = models.CharField(max_length=3)
    score = models.FloatField()
    risk_level = models.CharField(max_length=8, choices=RISK_LEVELS)
    language = models.CharField(max_length=5, default='en')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.created_at:%Y-%m-%d %H:%M} {self.risk_level}'

    @staticmethod
    def band_for_age(age):
        for upper, band in ((17, '12-17'), (24, '18-24'), (34, '25-34'), (49, '35-49'), (64, '50-64')):
            if age <= upper:
                return band
        return '65+'
