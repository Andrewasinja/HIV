#!/usr/bin/env bash
# Render build step for the Django API.
set -o errexit

pip install --upgrade pip
pip install -r requirements.txt

python manage.py collectstatic --noinput
python manage.py migrate --noinput

# Optional admin account: set DJANGO_SUPERUSER_USERNAME / _EMAIL / _PASSWORD on Render.
if [ -n "${DJANGO_SUPERUSER_USERNAME:-}" ] && [ -n "${DJANGO_SUPERUSER_PASSWORD:-}" ]; then
  python manage.py createsuperuser --noinput || echo "Superuser already exists, skipping."
fi
