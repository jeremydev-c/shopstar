# 🚀 ShopStar Deployment Checklist

## ✅ Pre-Deployment Checklist

### Backend Environment Variables (Railway/Render)
```env
# Required
PORT=5000 (auto-set by platform)
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
FRONTEND_URL=https://your-frontend-domain.vercel.app

# Optional (but recommended)
NODE_ENV=production
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=ShopStar <hello@modenova.co.ke>
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

### Frontend Environment Variables (Vercel)
```env
# Required
NEXT_PUBLIC_API_URL=https://your-backend-domain.railway.app (or render.com)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
```

## 📋 Deployment Steps

### Backend (Railway/Render)
1. ✅ Push code to GitHub
2. ✅ Connect repository to Railway/Render
3. ✅ Set environment variables
4. ✅ Deploy
5. ✅ Verify health endpoint: `/api/health`
6. ✅ Test API endpoints

### Frontend (Vercel)
1. ✅ Push code to GitHub
2. ✅ Connect repository to Vercel
3. ✅ Set environment variables
4. ✅ Deploy
5. ✅ Test frontend connects to backend
6. ✅ Test Stripe checkout flow

## 🔍 Pre-Deployment Verification

- [ ] All environment variables configured
- [ ] MongoDB Atlas connection working
- [ ] Backend health check passes
- [ ] Frontend API connection works
- [ ] Stripe keys configured (test mode is fine)
- [ ] CORS allows frontend domain
- [ ] Error handling in place
- [ ] No console errors in production

## 🎯 Ready to Deploy!

ShopStar appears to be deployment-ready. Just need to:
1. Set up environment variables
2. Deploy backend
3. Deploy frontend
4. Test everything works

