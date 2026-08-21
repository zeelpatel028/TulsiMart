# 🚀 Tulsi Mart - Vercel Deployment Guide

This guide will walk you through deploying **Tulsi Mart** (React + Vite Frontend & Django REST API Backend) to Vercel.

---

## 📁 Pre-Configured Files

We have already configured all required files for Vercel deployment:
1. `vercel.json` - Configured for static frontend + Python serverless backend WSGI routing.
2. `.vercelignore` - Optimized file upload rules.
3. `backend/requirements.txt` - Python dependencies for Vercel serverless environment.
4. `backend/tulsimart_backend/settings.py` - Configured with `WhiteNoise` for static asset serving.
5. `frontend/src/api/axios.js` - Auto-detects local dev (`http://127.0.0.1:8000/api`) vs production Vercel (`/api`).

---

## 🛠️ Method 1: Deploy via Vercel Dashboard (GitHub / GitLab / Bitbucket)

1. Push your repository to GitHub / GitLab.
2. Log into [Vercel Dashboard](https://vercel.com/dashboard).
3. Click **Add New...** -> **Project**.
4. Import your **Tulsi Mart** repository.
5. In **Framework Preset**, choose **Vite** or leave as **Other**.
6. Expand **Environment Variables** and add the following keys if needed:
   - `DJANGO_SECRET_KEY` = `your-super-secret-key`
   - `DEBUG` = `False`
   - `EMAIL_HOST` = `smtp.gmail.com`
   - `EMAIL_PORT` = `587`
   - `EMAIL_HOST_USER` = `your-email@gmail.com`
   - `EMAIL_HOST_PASSWORD` = `your-app-password`
7. Click **Deploy**. Vercel will build and launch your live site!

---

## 💻 Method 2: Deploy via Vercel CLI (Command Line)

1. Install Vercel CLI globally (if not already installed):
   ```bash
   npm install -g vercel
   ```
2. Open terminal in the project root directory (`d:\Tulsi Mart`).
3. Run:
   ```bash
   vercel
   ```
4. Follow the prompt instructions (Select project scope, accept default settings).
5. For production release, run:
   ```bash
   vercel --prod
   ```

---

## ⚡ Post-Deployment Verification
- Frontend will load cleanly on your `https://<your-project>.vercel.app` domain.
- API endpoints (`/api/core/...`, `/api/inventory/...`, etc.) will automatically route to the Django serverless functions.
