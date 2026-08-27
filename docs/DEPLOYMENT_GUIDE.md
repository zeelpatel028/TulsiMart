# 🚀 Tulsi Mart Deployment Guide

This guide provides step-by-step instructions for deploying **Tulsi Mart**:
- **Backend (Django REST API)** deployed on **Render**
- **Frontend (React + Vite)** deployed on **Vercel**

---

## 🛠️ Step 1: Deploy Backend to Render

### Option A: Deploy via Render Blueprint (Recommended - 1-Click)
1. Push your latest code to GitHub / GitLab.
2. Log in to [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** -> **Blueprint**.
4. Connect your **Tulsi Mart** repository.
5. Render will automatically detect `render.yaml` and pre-configure:
   - **Service Name**: `tulsi-mart-backend`
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate`
   - **Start Command**: `gunicorn tulsimart_backend.wsgi:application`
6. Click **Apply**.

### Option B: Deploy via Render Web Service (Manual Setup)
1. Go to [Render Dashboard](https://dashboard.render.com/) -> **New +** -> **Web Service**.
2. Connect your GitHub repository.
3. Configure the following fields:
   - **Name**: `tulsi-mart-backend`
   - **Environment**: `Python 3`
   - **Region**: Choose closest to target users (e.g., Singapore / Frankfurt / US).
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Build Command**:
     ```bash
     pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate
     ```
   - **Start Command**:
     ```bash
     gunicorn tulsimart_backend.wsgi:application
     ```
4. Add **Environment Variables** under the **Environment** tab:
   - `DJANGO_SECRET_KEY`: `your-super-secret-django-key`
   - `DEBUG`: `False`
   - `CORS_ALLOW_ALL_ORIGINS`: `True`
   - *(Optional)* `MONGODB_URI`: Your MongoDB Atlas connection string.
   - *(Optional)* `EMAIL_HOST_USER` & `EMAIL_HOST_PASSWORD`: For email notifications.
5. Click **Create Web Service**.
6. Once deployed, copy your backend live URL (e.g. `https://tulsi-mart-backend.onrender.com`).

---

## 🎨 Step 2: Deploy Frontend to Vercel

1. Log in to [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** -> **Project**.
3. Import your **Tulsi Mart** repository.
4. Configure Project Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Select `frontend` (Click Edit next to Root Directory and pick `frontend`).
5. Expand **Environment Variables** and add:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://tulsi-mart-backend.onrender.com/api` *(replace with your actual Render backend URL)*
6. Click **Deploy**.

Vercel will build and publish your frontend SPA at `https://<your-project>.vercel.app`.

---

## ⚡ Step 3: Verification & Test

1. Open your Vercel frontend URL in browser (`https://<your-project>.vercel.app`).
2. Log in (e.g. `admin` / `admin123` or your configured credentials).
3. Verify API requests:
   - Billing, Inventory, Orders, Customers, and Suppliers will communicate directly with your Render Django backend.
   - Check browser developer tools (F12 Network tab) to confirm all `/api/...` calls resolve to `https://<your-render-app>.onrender.com/api/...` with HTTP 200 responses.

---

## 📝 Summary of Key Configuration Files

| File | Purpose |
| :--- | :--- |
| `render.yaml` | Render Blueprint deployment blueprint file |
| `backend/requirements.txt` | Backend Python dependencies including `gunicorn` |
| `backend/tulsimart_backend/settings.py` | CORS, ALLOWED_HOSTS & WhiteNoise setup |
| `frontend/src/api/axios.js` | Dynamic API URL selector (`VITE_API_BASE_URL`) |
| `vercel.json` & `frontend/vercel.json` | Vercel static SPA rewrite rules |
| `backend/.env.example` | Backend environment variables template |
| `frontend/.env.example` | Frontend environment variables template |
