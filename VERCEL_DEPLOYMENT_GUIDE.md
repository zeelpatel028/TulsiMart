# 🚀 Tulsi Mart - Vercel & Render Deployment Guide

This repository is configured for:
- **Backend (Django REST Framework)** deployed on **Render**
- **Frontend (React + Vite)** deployed on **Vercel**

Please refer to the comprehensive [DEPLOYMENT_GUIDE.md](file:///d:/Tulsi%20Mart/DEPLOYMENT_GUIDE.md) for step-by-step setup instructions.

---

## 🎨 Quick Frontend Deploy to Vercel

1. Log into [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** -> **Project**.
3. Import your **Tulsi Mart** repository.
4. Set **Root Directory** to `frontend`.
5. Add Environment Variable:
   - `VITE_API_BASE_URL` = `https://your-backend-service.onrender.com/api`
6. Click **Deploy**.
