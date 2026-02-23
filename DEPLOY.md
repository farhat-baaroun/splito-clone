# Deployment Guide: Netlify + Convex

This guide covers deploying the Splito app to Netlify (staging and production) with Convex backend.

## Prerequisites

- Netlify account
- Convex account (dashboard at [dashboard.convex.dev](https://dashboard.convex.dev))
- Git repository (GitHub, GitLab, or Bitbucket)

---

## 1. Convex Setup

### Production deployment

Your existing Convex project (`descriptive-stingray-771`) is your **development** deployment. For production:

1. Go to [Convex Dashboard](https://dashboard.convex.dev) → your project → **Settings**
2. Under **Deploy Keys**, click **Generate** for **Production**
3. Copy the deploy key (starts with `prod:`)

### Staging deployment (optional)

For a permanent staging environment:

1. In Convex Dashboard, create a **new project** (e.g. "splito-staging")
2. In that project → **Settings** → **Deploy Keys** → **Generate** for Production
3. Copy the staging deploy key

---

## 2. Netlify Setup

### Link your repository

1. Go to [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import an existing project**
2. Connect your Git provider and select the `splito-clone` repository
3. Netlify will detect the build settings from `netlify.toml`

### Environment variables

In Netlify: **Site configuration** → **Environment variables** → **Add a variable** or **Import from .env**

| Variable | Value | Context |
|----------|-------|---------|
| `CONVEX_DEPLOY_KEY` | Your Convex production deploy key | Production |
| `CONVEX_DEPLOY_KEY` | Your Convex staging deploy key | Branch deploys (staging) |

**To set different keys per branch:**

1. Add `CONVEX_DEPLOY_KEY`
2. Click **Edit** → **Different values for each deploy context**
3. Set **Production** = production deploy key
4. Set **Deploy Previews** or **Branch deploys** = staging deploy key (if using staging project)

---

## 3. Branch configuration (staging)

### Option A: Branch deploys

1. **Site configuration** → **Build & deploy** → **Continuous deployment**
2. Under **Branch deploys**, add `staging` (or your staging branch name)
3. Set `CONVEX_DEPLOY_KEY` for the `staging` context to your staging Convex deploy key

### Option B: Deploy previews (PRs)

1. Use **Deploy Previews** for pull requests
2. Set `CONVEX_DEPLOY_KEY` for **Deploy Previews** to a preview deploy key (Convex Pro plan) or staging key
3. Each PR gets its own Netlify preview; Convex will create a preview deployment per branch

---

## 4. Build process

The build command in `netlify.toml`:

```bash
npx convex deploy --cmd 'npm run build' --cmd-url-env-var-name VITE_CONVEX_URL
```

This:

1. Reads `CONVEX_DEPLOY_KEY` from the environment
2. Deploys Convex functions to the deployment linked to that key
3. Sets `VITE_CONVEX_URL` to the deployment URL
4. Runs `npm run build` (Vite picks up `VITE_CONVEX_URL` for the client)
5. Netlify publishes `dist/client` and serverless functions

---

## 5. Deploy

### Automatic deploys

- **Production**: Push to `main` → deploys to production
- **Staging**: Push to `staging` → deploys to staging (if branch deploys are configured)

### Manual deploy

```bash
# Deploy Convex to production
CONVEX_DEPLOY_KEY=prod:xxx npx convex deploy

# Deploy Convex + build frontend (same as Netlify)
CONVEX_DEPLOY_KEY=prod:xxx npx convex deploy --cmd 'npm run build' --cmd-url-env-var-name VITE_CONVEX_URL
```

---

## 6. Checklist

- [ ] Convex production deploy key generated
- [ ] Convex staging deploy key generated (if using staging)
- [ ] Netlify site linked to repository
- [ ] `CONVEX_DEPLOY_KEY` set in Netlify (Production context)
- [ ] `CONVEX_DEPLOY_KEY` set for staging/branch deploys (if applicable)
- [ ] First deploy triggered (push to `main` or manual deploy)

---

## Troubleshooting

**Build fails with "CONVEX_DEPLOY_KEY not set"**  
→ Add the variable in Netlify and ensure the deploy context (Production / Branch / Deploy preview) matches.

**App loads but Convex calls fail**  
→ Verify `VITE_CONVEX_URL` is set during build. The Convex deploy step injects it; if the build is cached or skipped, it may be missing.

**Staging uses production data**  
→ Use a separate Convex project for staging and its own deploy key. Convex deployments do not share data.
