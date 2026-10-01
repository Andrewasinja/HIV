from rest_framework import serializers

from . import ml, tts


class SpeechSerializer(serializers.Serializer):
    text = serializers.CharField(max_length=tts.MAX_CHARS, trim_whitespace=True)
    lang = serializers.ChoiceField(choices=['lg'])


class AnswersSerializer(serializers.Serializer):
    age = serializers.IntegerField(min_value=ml.AGE_MIN, max_value=ml.AGE_MAX)
    marital = serializers.ChoiceField(choices=list(ml.FIELDS['marital']))
    education = serializers.ChoiceField(choices=list(ml.FIELDS['education']))
    std = serializers.ChoiceField(choices=list(ml.FIELDS['std']))
    tested_past_year = serializers.ChoiceField(choices=list(ml.FIELDS['tested_past_year']))
    aids_education = serializers.ChoiceField(choices=list(ml.FIELDS['aids_education']))
    place = serializers.ChoiceField(choices=list(ml.FIELDS['place']))
    orientation = serializers.ChoiceField(choices=list(ml.FIELDS['orientation']))
    drugs = serializers.ChoiceField(choices=list(ml.FIELDS['drugs']))
    language = serializers.ChoiceField(choices=['en', 'lg'], default='en', required=False)
