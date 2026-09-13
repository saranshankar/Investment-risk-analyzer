# TipCheck Deployment Guide 🚀

This guide outlines how to deploy TipCheck seamlessly to production with zero errors.

---

## 1. Unified Cloud Deployment (Recommended)
TipCheck can be deployed as a single unified service (FastAPI serves both the API and the pre-built React frontend SPA). This eliminates all CORS and cross-origin connection issues.

### Option A: Render (Docker or Blueprint)
1. Push your repository to GitHub.
2. In Render Dashboard, click **New +** -> **Web Service**.
3. Select your repository and choose **Docker** as the runtime (Render will automatically pick up [`Dockerfile`](file:///Dockerfile)).
4. Set Environment Variables (optional, defaults are production-ready):
   - `PORT`: `8000`
5. Click **Create Web Service**. Render will build and deploy the app at `https://<your-service-name>.onrender.com`.

*Alternatively:* Use Render Blueprints with [`render.yaml`](file:///render.yaml).

### Option B: Railway
1. Click **New Project** -> **Deploy from GitHub repo**.
2. Railway detects [`Dockerfile`](file:///Dockerfile) automatically.
3. Add a Custom Domain or generate a railway.app domain.

### Option C: Docker (Any VPS / AWS EC2 / DigitalOcean)
```bash
# Build the production image
docker build -t tipcheck:latest .

# Run the container
docker run -d -p 8000:8000 --name tipcheck tipcheck:latest
```
Access at `http://<your-server-ip>:8000`.

---

## 2. Decoupled Deployment (Frontend on Vercel / Netlify, Backend on Render / Railway)

If you prefer hosting the frontend on Vercel or Netlify and the backend on Render:

1. **Deploy Backend (FastAPI)**:
   - Deploy backend using the Dockerfile or python build:
     - Build Command: `pip install -r requirements.txt`
     - Start Command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
   - Note your live backend URL (e.g. `https://tipcheck-api.onrender.com`).

2. **Deploy Frontend (Vercel / Netlify)**:
   - Root directory: `frontend`
   - Build command: `npm run build`
   - Output directory: `dist`
   - **Environment Variable**:
     - `VITE_API_URL`: `https://tipcheck-api.onrender.com` (Your live backend URL)

---

## 3. Local Development (Running Locally)

To run locally without connection errors:

### Quick 1-Command Unified Run:
```bash
python run_local.py
```
This serves both the frontend and backend on `http://127.0.0.1:8000` and automatically opens your default browser.

### Separate Dev Server Run:
**Terminal 1 (Backend):**
```bash
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```
Open `http://localhost:5173`. Vite is configured with an automatic proxy to `127.0.0.1:8000`.
