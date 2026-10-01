#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import subprocess
import sys
from pathlib import Path

VENV_DIR = Path(__file__).resolve().parent / '.venv'
VENV_PYTHON = VENV_DIR / ('Scripts/python.exe' if os.name == 'nt' else 'bin/python')


def relaunch_in_venv():
    """Re-run this command with the project's .venv Python when started from a global Python."""
    if Path(sys.prefix).resolve() == VENV_DIR.resolve() or not VENV_PYTHON.exists():
        return
    print('Using the project virtual environment (.venv). '
          'Starting Django - the first start can take a minute, please wait...', flush=True)
    try:
        sys.exit(subprocess.call([str(VENV_PYTHON), *sys.argv]))
    except KeyboardInterrupt:
        sys.exit(130)


def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    if sys.argv[1:2] == ['runserver']:
        print('Loading Django...', flush=True)
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        relaunch_in_venv()
        raise ImportError(
            "Couldn't import Django. Create the virtual environment first: "
            "python -m venv .venv && .venv\\Scripts\\pip install -r requirements.txt"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
