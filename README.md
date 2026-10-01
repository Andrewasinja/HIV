# Know Your Risk - HIV Vulnerability Screening

A simple, anonymous web app that estimates a person's HIV vulnerability (Low / Medium / High) from 9 survey questions, shows the answers raising their risk, and gives practical next steps. Available in English and Luganda.

> This is a screening tool, not a diagnosis. Only an HIV test can confirm someone's status.

## Features

- One question per screen, big tap targets, progress bar, works on phones
- Clear Low / Medium / High result with the top factors raising the risk and a tip for each
- "What if" simulator: change habits (where partners are met, STI, testing, HIV education) and see the level update live (not saved)
- Print / Save as PDF from the result page
- English / Luganda toggle
- No login. Screenings are stored anonymously (age band only; sexual orientation is never stored)

## Project layout

```
best_svm_model.pkl   trained SVM (sklearn 1.6.1)
HIV_dataset.csv      training data (used by backend tests)
backend/             Django + Django REST Framework API
frontend/            React (Vite) app
```

## Run locally

### Easiest: double-click

- `start_app.bat` opens the backend and frontend in two windows, then the browser at http://localhost:5173.
- `start_backend.bat` and `start_frontend.bat` start each part on its own. On first run they create the Python virtual environment and run `npm install` automatically.

> Django lives in `backend\.venv`. `python manage.py ...` automatically switches to it. The first start can take a minute; wait for `Watching for file changes`.

### Backend (port 8000)

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
copy .env.example .env      # then set DEBUG=True and, for the Luganda voice, SUNBIRD_API_TOKEN
.\.venv\Scripts\python manage.py migrate
.\.venv\Scripts\python manage.py runserver 8000
```

Optional: run `.\.venv\Scripts\python manage.py createsuperuser`, then open http://127.0.0.1:8000/admin/ to review anonymous screenings.

Run the tests with `.\.venv\Scripts\python manage.py test screening`.

### Frontend (port 5173)

```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. To point at a different API, set `VITE_API_URL` (default `http://127.0.0.1:8000/api`).

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/form-options/` | Valid answer codes |
| POST | `/api/predict/` | Predict and save anonymously |
| POST | `/api/simulate/` | Predict without saving (what-if) |
| POST | `/api/tts/` | Luganda speech audio for `{"text": "...", "lang": "lg"}` (Sunbird AI, cached) |

Example body:

```json
{"age": 22, "marital": "unmarried", "education": "college", "std": "yes",
 "tested_past_year": "no", "aids_education": "no", "place": "internet",
 "orientation": "heterosexual", "drugs": "no", "language": "en"}
```

## How the model is used

The pickle is a bare `SVC` (no pipeline), so `backend/screening/ml.py` reproduces the training preprocessing:

- one-hot encoding with the first category dropped
- Age standardized with mean 40.02 and std 18.14

Tests confirm this reproduces the model's accuracy on the dataset. The SVM has no probabilities, so the decision score is mapped to risk bands in `RISK_THRESHOLDS` (`backend/config/settings.py`):

- Low: below -0.5
- Medium: -0.5 to 0.5
- High: above 0.5

Top factors are found by changing one answer at a time to its lowest-risk option and measuring the score drop.

## Known limitations

- The dataset is small (698 rows) and may not represent every community.
- In the data, drug use is linked to *lower* risk, which contradicts health research. The app therefore never gives advice based on drug use, and drug use is excluded from the what-if simulator.
- **Luganda text was machine-drafted and must be reviewed by a native speaker** (ideally a health worker) before public use.

## Luganda voice (Sunbird AI)

When Luganda is selected, "Listen to your result" plays real Luganda speech from [Sunbird AI](https://api.sunbird.ai).

- The backend calls Sunbird's `/tasks/audio/speech` endpoint (`language: lug`), so the token never reaches the browser.
- Generated audio is cached on disk. Identical report sentences are only generated once.
- If Sunbird is not configured, slow or failing, the app automatically falls back to the browser voice (Swahili, then English).
- Your Sunbird account email must be verified, or Sunbird answers `403 AUTHORIZATION_ERROR`.

## Deploy: backend on Render, frontend on Vercel

### 1. Push to GitHub

Create an empty GitHub repository, then run this from the project folder:

```powershell
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

### 2. Backend on Render

1. In Render, choose **New > Blueprint**, pick the repo, and Render reads `render.yaml`. This uses root `backend`, build `bash build.sh`, and start `gunicorn config.wsgi:application`.
2. Fill in the environment variables below, then deploy.
3. Check https://YOUR-APP.onrender.com/api/form-options/. It should return JSON with `"luganda_voice": true`.

| Variable | Value | Required |
|---|---|---|
| `SUNBIRD_API_TOKEN` | Your Sunbird token | For the Luganda voice |
| `SECRET_KEY` | Long random string (auto-generated by the blueprint) | Yes |
| `DEBUG` | `False` | Yes |
| `CORS_ALLOWED_ORIGINS` | `https://hiv-kab.vercel.app` (set by the blueprint; comma-separate several, no trailing slash) | Yes |
| `CSRF_TRUSTED_ORIGINS` | `https://hiv-kab.vercel.app` (set by the blueprint; Render's own URL is added automatically) | Yes |
| `ALLOWED_HOSTS` | Extra custom domains only (Render's own hostname is added automatically) | No |
| `PYTHON_VERSION` | `3.13` (set by the blueprint) | Yes |
| `DATABASE_URL` | Neon Postgres connection string (`postgresql://...neon.tech/neondb?sslmode=require&channel_binding=require`). Empty = SQLite, which is **wiped on every redeploy** | Yes |
| `DJANGO_SUPERUSER_USERNAME`, `DJANGO_SUPERUSER_EMAIL`, `DJANGO_SUPERUSER_PASSWORD` | Creates an admin login during build | No |

### 3. Frontend on Vercel

1. **Add New > Project**, import the repo, and set **Root Directory** to `frontend`. Vite is detected; `vercel.json` handles page refreshes on `/check`, `/result` and `/about`.
2. Add the environment variable below, then deploy.
3. The frontend lives at https://hiv-kab.vercel.app. If that URL changes, update Render's `CORS_ALLOWED_ORIGINS` and redeploy the backend.

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://hiv-adyk.onrender.com/api` (also the built-in production default) |

> `VITE_` variables are baked in at build time. After changing one, redeploy the frontend.

### Notes

- Render's free plan sleeps after 15 minutes idle. The first request afterwards can take 30-60 seconds.
- The file-based voice cache also resets on redeploy; it simply refills.
