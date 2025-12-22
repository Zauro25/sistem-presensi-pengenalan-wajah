# Presensi PPM Berbasis Pengenalan Wajah – Face Recognition Attendance

Monorepo containing a Django REST API backend and a Next.js frontend for face-recognition-based attendance, permit validation, and recapitulating.

## Project Structure

- [backend/](backend/): Django project and app code
- [frontend/](frontend/): Next.js 14+ (App Router) frontend
- [deploy/](deploy/): Nginx reverse proxy and systemd service examples
- [docker-compose.yml](docker-compose.yml): Local container orchestration

## Requirements

- Python 3.11+
- Node.js 18+
- Docker 24+ and Docker Compose
- Optional: `venv` for local Python isolation

## Quick Start (Docker)

- Create environment files:
  - Backend: [backend/.env](backend/.env)
  - Frontend: [frontend/.env.local](frontend/.env.local)

- Bring services up:
```bash
docker compose up -d --build
```
- Access:
  - API: http://localhost:8000/api
  - Docs: http://localhost:8000/api/docs/
  - Frontend: http://localhost:3000

## Backend (Django + DRF)

### Setup (local dev)
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Environment (backend/.env)
Use explicit values for local development:
```
DJANGO_SECRET_KEY=change-me
DEBUG=True
ALLOWED_HOSTS=*
DATABASE_URL=sqlite:///db.sqlite3
FACE_TOLERANCE=0.45
```

Notes:
- API docs are available at `/api/docs/` and the OpenAPI schema at `/api/schema/`.
- Authentication uses DRF TokenAuthentication by default.
- Media is served from [backend/media](backend/media); face photos reside under [backend/media/santri_photos](backend/media/santri_photos).

## Frontend (Next.js)

### Setup (local dev)
```bash
cd frontend
npm ci
npm run dev
```

Open http://localhost:3000

### Environment (frontend/.env.local)
Expose the API base to the browser:
```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
```

### Useful Docs
- Project overview: [frontend/README.md](frontend/README.md)
- API reference: [frontend/API_REFERENCE.md](frontend/API_REFERENCE.md)
- Deployment guide: [frontend/DEPLOYMENT.md](frontend/DEPLOYMENT.md)
- Implementation summary: [frontend/IMPLEMENTATION_SUMMARY.md](frontend/IMPLEMENTATION_SUMMARY.md)
- Quick start: [frontend/QUICK_START.md](frontend/QUICK_START.md)

## Deployment

- Nginx reverse proxy config: [deploy/nginx/nginx.conf](deploy/nginx/nginx.conf)
- Systemd service example: [deploy/systemd/absensi-backend.service](deploy/systemd/absensi-backend.service)
- `docker-compose.yml` maps backend port `8000` and Nginx on host `80`; media is mounted read-only into Nginx.

## Coding Standards

- Keep logic stable; focus changes on intended features.
- Use ESLint in the frontend: `npm run lint`.
- Prefer small, focused PRs with clear descriptions.

## Troubleshooting

- Ensure `NEXT_PUBLIC_API_URL` matches the backend base (ends with `/api`).
- When `DEBUG=False`, set `ALLOWED_HOSTS` appropriately.
- For local DB, provide `DATABASE_URL=sqlite:///db.sqlite3`.

## License

Proprietary – internal use.
