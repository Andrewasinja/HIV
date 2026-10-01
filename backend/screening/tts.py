"""Luganda text-to-speech through Sunbird AI's unified speech endpoint, with a permanent file cache.

Audio is requested in 'stream' mode (raw bytes). If Sunbird instead returns JSON with a
short-lived signed URL, the audio is downloaded immediately. Report sections repeat across
users, so most requests are served from cache without spending API quota.
"""
import base64
import hashlib

import requests
from django.conf import settings
from django.core.cache import caches

TIMEOUT_S = 90
MAX_CHARS = 1500


class TTSUnavailable(Exception):
    """No API token configured."""


class TTSError(Exception):
    """Sunbird failed or returned something unusable."""


def is_enabled():
    return bool(settings.SUNBIRD_API_TOKEN)


def _cache_key(text):
    voice = settings.SUNBIRD_TTS_VOICE or settings.SUNBIRD_TTS_LANGUAGE
    digest = hashlib.sha256(text.encode('utf-8')).hexdigest()
    return f'tts:{voice}:{digest}'


def _content_type(resp, url=''):
    content_type = resp.headers.get('Content-Type', '').split(';')[0].strip()
    if content_type.startswith('audio/'):
        return content_type
    return 'audio/mpeg' if url.split('?')[0].endswith('.mp3') else 'audio/wav'


def _audio_from_json(payload):
    data = payload.get('output', payload) if isinstance(payload, dict) else {}
    if not isinstance(data, dict):
        raise TTSError('Unexpected Sunbird response format')

    for key in ('audio_base64', 'audio_content'):
        if isinstance(data.get(key), str):
            return base64.b64decode(data[key]), data.get('content_type', 'audio/wav')

    url = data.get('audio_url')
    if not url:
        raise TTSError('Sunbird response has no audio')
    resp = requests.get(url, timeout=TIMEOUT_S)
    if resp.status_code != 200 or not resp.content:
        raise TTSError(f'Audio download failed ({resp.status_code})')
    return resp.content, _content_type(resp, url)


def synthesize(text):
    """Return (audio_bytes, content_type) for Luganda text."""
    if not is_enabled():
        raise TTSUnavailable()

    cache = caches['tts']
    key = _cache_key(text)
    cached = cache.get(key)
    if cached:
        return cached

    body = {'text': text, 'language': settings.SUNBIRD_TTS_LANGUAGE, 'response_mode': 'stream'}
    if settings.SUNBIRD_TTS_VOICE:
        body['voice'] = settings.SUNBIRD_TTS_VOICE

    try:
        resp = requests.post(
            settings.SUNBIRD_TTS_URL,
            json=body,
            headers={'Authorization': f'Bearer {settings.SUNBIRD_API_TOKEN}'},
            timeout=TIMEOUT_S,
        )
        if resp.status_code != 200:
            raise TTSError(f'Sunbird returned {resp.status_code}: {resp.text[:300]}')

        if resp.headers.get('Content-Type', '').startswith('audio/'):
            if not resp.content:
                raise TTSError('Sunbird returned empty audio')
            result = (resp.content, _content_type(resp))
        else:
            try:
                payload = resp.json()
            except ValueError as exc:
                raise TTSError('Sunbird returned an unreadable response') from exc
            result = _audio_from_json(payload)
    except requests.RequestException as exc:
        raise TTSError(f'Sunbird request failed: {exc}') from exc

    cache.set(key, result)
    return result
