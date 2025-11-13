# Absensi PPM – Face Recognition Attendance

Monorepo containing a Django REST backend and a Vite/React frontend for face-recognition-based attendance and permit validation.

## Project Structure

- `backend/`: Django project and app code
- `frontend/`: Vite + React frontend
- `deploy/`: Nginx and systemd service examples

## Requirements

- Python 3.11+
- Node.js 18+
- (Optional) virtualenv

## Backend Setup

1. Create and activate virtual environment
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
```
2. Install dependencies
```bash
pip install -r requirements.txt
```
3. Environment variables
Create a `.env` in `backend/` (see keys below):
```
DJANGO_SECRET_KEY=change-me
DEBUG=True
ALLOWED_HOSTS=*
DATABASE_URL=sqlite:///db.sqlite3
CORS_ALLOWED_ORIGINS=http://localhost:5173
FACE_TOLERANCE=0.45
USE_JWT=true
```

4. Apply migrations and run server
```bash
python manage.py migrate
python manage.py runserver
```

5. API Docs
- Swagger UI: `/api/docs/`
- OpenAPI schema: `/api/schema/`

## Frontend Setup

```bash
cd frontend
npm ci
npm run dev
```

Environment variable (create `frontend/.env`):
```
VITE_API_BASE=http://127.0.0.1:8000/api
```

Build for production:
```bash
npm run build
```

## Architecture

- Backend (Django + DRF)
  - Pagination, filtering, and ordering enabled globally
  - TokenAuth/JWT ready; Swagger docs via drf-spectacular
  - Reports service for XLSX export
- Frontend (React + Vite + Tailwind)
  - Axios HTTP client with token injection
  - `AuthContext` for auth state management

## Deployment (Docker + Nginx)

1. Build and run with docker-compose
```bash
docker compose up -d --build
```
2. Services
- Backend (Gunicorn) on `backend:8000`
- Frontend (Nginx static)
- Nginx reverse proxy on host port 80 (`deploy/nginx/nginx.conf`)

3. Systemd example
- `deploy/systemd/absensi-backend.service`

## Scripts

- `backend/scripts/load_encoding.py`: utilities related to face encodings.

## Contributing

- Keep logic unchanged when cleaning code or formatting.
- Avoid committing large media, build artifacts, and environment folders (covered by `.gitignore`).

## License

Proprietary – internal use.
