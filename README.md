# multicalci-test — Hybrid API 🧪⚡🔐

## How the Hybrid Works

```
User clicks Calculate
        ↓
⚡ INSTANT — Client-side result shows immediately (same speed as before!)
        ↓ (silently in background)
🔐 SECURE — API call to /api/steam on Vercel server
        ↓
✨ SMOOTH UPDATE — Values refresh with green flash (no flicker)
```

## Speed vs Security

| | Speed | Security |
|---|---|---|
| Old (client only) | ⚡ Instant | ❌ Exposed |
| API only | 🟡 100-200ms | ✅ Secure |
| **Hybrid (this)** | **⚡ Instant** | **✅ Secure** |

## Files

```
multicalci-test/
├── index.html                         ← Test homepage
├── vercel.json                        ← Vercel config
├── sitemap.xml                        ← Sitemap
├── robots.txt                         ← Robots
├── api/
│   └── steam.js                       ← 🔐 Server calculations
└── steam-properties-calculator/
    └── index.html                     ← ⚡🔐 Hybrid calculator
```

## Upload Steps

1. Create test GitHub account + repo named `multicalci-test`
2. Upload ALL files maintaining folder structure
3. Create test Vercel account → connect GitHub → Deploy
4. Test at: `multicalci-test.vercel.app/steam-properties-calculator/`

## Verify It's Working

1. Open calculator → Press **F12** → **Network** tab
2. Enter values → Click Calculate
3. You'll see TWO things:
   - Instant result appears ⚡
   - POST request to `/api/steam` in Network tab 🔐
   - Values do a brief green flash when server confirms ✨
