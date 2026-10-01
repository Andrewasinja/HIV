import logging

from django.http import HttpResponse
from rest_framework import status
from rest_framework.decorators import api_view, throttle_classes
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle

from . import ml, tts
from .models import Screening
from .serializers import AnswersSerializer, SpeechSerializer

logger = logging.getLogger(__name__)

NOT_STORED = {'age', 'orientation'}


class SpeechThrottle(AnonRateThrottle):
    scope = 'tts'


@api_view(['GET'])
def form_options(request):
    return Response({**ml.form_options(), 'luganda_voice': tts.is_enabled()})


@api_view(['POST'])
@throttle_classes([SpeechThrottle])
def speech(request):
    serializer = SpeechSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    try:
        audio, content_type = tts.synthesize(serializer.validated_data['text'])
    except tts.TTSUnavailable:
        return Response({'detail': 'Luganda voice is not configured.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    except tts.TTSError as exc:
        logger.warning('Luganda TTS failed: %s', exc)
        return Response({'detail': 'Luganda voice is temporarily unavailable.'}, status=status.HTTP_502_BAD_GATEWAY)
    response = HttpResponse(audio, content_type=content_type)
    response['Cache-Control'] = 'public, max-age=86400'
    return response


def _run(request, save):
    serializer = AnswersSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    answers = dict(serializer.validated_data)
    language = answers.pop('language', 'en')
    result = ml.predict(answers)
    if save:
        Screening.objects.create(
            age_band=Screening.band_for_age(answers['age']),
            **{k: v for k, v in answers.items() if k not in NOT_STORED},
            score=result['score'],
            risk_level=result['risk_level'],
            language=language,
        )
    return Response(result)


@api_view(['POST'])
def predict(request):
    return _run(request, save=True)


@api_view(['POST'])
def simulate(request):
    return _run(request, save=False)
