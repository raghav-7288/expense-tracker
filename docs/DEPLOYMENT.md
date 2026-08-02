# Deployment Guide

## Vercel (Recommended)

ExpenseTracker is pre-configured for Vercel deployment via `vercel.json`.

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### Step 2: Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import Git Repository**
3. Select your `expense-tracker` repository
4. Vercel auto-detects the framework (Vite)

### Step 3: Configure Environment Variables

In the Vercel project settings, add:

| Variable | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://your-project-id.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |

> These are set in **Settings → Environment Variables** and apply to all deployments.

### Step 4: Deploy

Click **Deploy**. Vercel will:

1. Run `yarn install --no-lockfile`
2. Run `yarn run build` (which executes `tsc -b && vite build`)
3. Serve the `dist/` directory
4. Apply SPA rewrites from `vercel.json`

### Automatic Deployments

Every push to `main` triggers a production deployment. Pull requests get preview deployments.

---

## Supabase Configuration for Production

### Authentication Redirect URLs

In your Supabase Dashboard → **Authentication → URL Configuration**:

| Setting | Value |
|---|---|
| **Site URL** | `https://your-app.vercel.app` |
| **Redirect URLs** | `https://your-app.vercel.app/dashboard` |
|  | `https://your-app.vercel.app/reset-password` |

### Google OAuth (Optional)

If using Google Sign-In, update the authorized redirect URI in Google Cloud Console:

```
https://your-project-id.supabase.co/auth/v1/callback
```

### Email Templates

Customize email templates in Supabase Dashboard → **Authentication → Email Templates**:

- **Confirm signup** — Update the redirect URL
- **Reset password** — Update the redirect URL to `https://your-app.vercel.app/reset-password`

---

## Build Configuration

The `vercel.json` file configures the build:

```json
{
  "installCommand": "yarn install --no-lockfile",
  "buildCommand": "yarn run build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

> ⚠️ **Do not modify `vercel.json`** — it must use `yarn` commands as configured.

### SPA Routing

The `rewrites` rule ensures all routes serve `index.html`, enabling client-side routing with React Router.

---

## Security Headers

Production security headers are configured in `public/_headers`:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-XSS-Protection: 1; mode=block`

Static assets (`/assets/*`) are cached with `max-age=31536000, immutable` for optimal performance.

---

## Performance

The production build includes:

- **Code splitting** — All 9 pages are lazy-loaded via `React.lazy()`
- **Tree shaking** — Unused code is eliminated by Vite/Rolldown
- **Asset hashing** — Filenames include content hashes for cache busting
- **Gzip compression** — Vercel compresses responses automatically

### Bundle Sizes (gzipped)

| Chunk | Size |
|---|---|
| Core runtime | ~143 KB |
| Recharts (charts) | ~112 KB |
| Supabase client | ~104 KB |
| Analytics page | ~27 KB |
| Transactions page | ~10 KB |
| Other pages | < 5 KB each |

---

## Monitoring

### Vercel Analytics

Enable Vercel Analytics in your project dashboard for:

- Web Vitals (LCP, FID, CLS)
- Page views and visitor metrics
- Deployment performance

### Error Tracking

Consider adding an error tracking service like [Sentry](https://sentry.io) for production error monitoring. The app's `ErrorBoundary` component catches React rendering errors.

---

## Alternative Deployment Platforms

While Vercel is recommended, the app can be deployed to any static hosting platform:

### Netlify

1. Build command: `npm run build`
2. Publish directory: `dist`
3. Add a `_redirects` file (already exists in `public/`):
   ```
   /*    /index.html   200
   ```

### Cloudflare Pages

1. Build command: `npm run build`
2. Build output: `dist`
3. Add environment variables in the dashboard

### Docker

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

