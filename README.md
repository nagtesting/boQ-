# multicalci-test — Hybrid Steam Calculator 🧪

## ⚠️ Answer to Your Question — YES Vercel Needs Setup for API!

Vercel does NOT auto-activate API functions. You must follow these steps:

---

## 🚀 Complete Setup Steps

### Step 1 — Create Test GitHub Account
1. Open incognito browser window
2. Go to github.com → Sign Up
3. Use different email, username like `MulticalciTest`

### Step 2 — Create New Repo
1. Click New Repository
2. Name: `multicalci-test`
3. Set to **Public**
4. Click Create repository

### Step 3 — Upload These Files to GitHub
Upload maintaining EXACT folder structure:
```
multicalci-test/          ← repo root
├── index.html
├── vercel.json           ← ⚠️ CRITICAL — tells Vercel about API
├── api/
│   └── steam.js          ← 🔐 API file
└── steam-properties-calculator/
    └── index.html
```

### Step 4 — Create Test Vercel Account
1. Go to vercel.com → Sign Up
2. Choose **"Continue with GitHub"**
3. Select your **TEST GitHub account**
4. Click Authorize

### Step 5 — Deploy on Vercel
1. Click **"Add New Project"**
2. Import `multicalci-test` repo
3. **IMPORTANT** — In Framework Preset: select **"Other"**
4. Root Directory: leave as `./`
5. Click **Deploy**

### Step 6 — Verify API is Active ✅
After deploy, go to your Vercel dashboard:
1. Click your project
2. Click **"Functions"** tab in top menu
3. You should see `/api/steam` listed there
4. If you see it → API is active! ✅
5. If empty → Check vercel.json was uploaded correctly

---

## 🔍 How to Test API is Working

1. Open: `multicalci-test.vercel.app/steam-properties-calculator/`
2. Press **F12** → click **Network** tab
3. Enter temperature & pressure → Click Calculate
4. You will see TWO things happen:
   - ⚡ Result appears instantly (client-side)
   - 🔐 POST request to `/api/steam` in Network tab

If you see the POST request → Hybrid is working! 🎉

---

## ❌ Common Issues & Fixes

| Problem | Fix |
|---|---|
| API 404 error | Check `api/steam.js` is in repo root `/api/` folder |
| Functions tab empty | Re-check `vercel.json` was uploaded |
| Results not updating | Check browser console for CORS errors |
| All functions broken | Make sure you uploaded the correct `index.html` |

---

## 📊 What Changed vs Original

Only ONE function was changed in the HTML:
- `doCalcClick()` → now async with API verification
- `_verifyWithAPI()` → new background API caller

Everything else is 100% identical to your original!
