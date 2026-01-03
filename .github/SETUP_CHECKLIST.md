# GitHub Actions & Vercel Deployment Setup Checklist

Use this checklist to ensure your CI/CD pipeline is properly configured.

## ✅ Pre-requisites

- [ ] You have a GitHub repository for betterDays
- [ ] You have a Vercel account
- [ ] You have Node.js and Yarn installed locally

## ✅ Step 1: Link Vercel Project

```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to your Vercel account
vercel login

# Navigate to your project directory
cd /Users/sergioviniciusdesalucena/workspace/betterDays

# Link your project to Vercel (creates .vercel/project.json)
vercel link
```

- [ ] Run `vercel link` and follow the prompts
- [ ] Confirm `.vercel/project.json` was created (check with `cat .vercel/project.json`)

## ✅ Step 2: Get Vercel Credentials

```bash
# View your project configuration
cat .vercel/project.json
```

From the output, note down:
- [ ] `orgId` - This is your **VERCEL_ORG_ID**
- [ ] `projectId` - This is your **VERCEL_PROJECT_ID**

Create a Vercel Token:
- [ ] Go to https://vercel.com/account/tokens
- [ ] Click "Create Token"
- [ ] Name it "GitHub Actions BetterDays"
- [ ] Copy the token - This is your **VERCEL_TOKEN** (save it securely!)

## ✅ Step 3: Add GitHub Secrets

Go to your GitHub repository:
`https://github.com/YOUR_USERNAME/betterdays/settings/secrets/actions`

Add the following secrets:

- [ ] **VERCEL_TOKEN** - The token you created in Step 2
- [ ] **VERCEL_ORG_ID** - The `orgId` from `.vercel/project.json`
- [ ] **VERCEL_PROJECT_ID** - The `projectId` from `.vercel/project.json`

Optional (for code coverage):
- [ ] **CODECOV_TOKEN** - If you want code coverage reports

## ✅ Step 4: Configure Vercel Environment Variables

Go to your Vercel project dashboard:
`https://vercel.com/YOUR_TEAM/betterdays/settings/environment-variables`

Add all required environment variables for **Production**, **Preview**, and **Development**:

### Required for BetterDays:

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (Production & Preview only)
- [ ] `DATABASE_URL` (if using Prisma with external database)

### Recommended Settings:
- Set Production variables to use production Supabase project
- Set Preview variables to use staging/preview Supabase project (or same as production if unavailable)
- Set Development variables for local development

## ✅ Step 5: Push Workflows to GitHub

```bash
# Make sure you're in the betterDays directory
cd /Users/sergioviniciusdesalucena/workspace/betterDays

# Check that the workflow files exist
ls -la .github/workflows/

# Add the files to git
git add .github/
git add vercel.json

# Commit the changes
git commit -m "feat: add GitHub Actions CI/CD pipeline and Vercel deployment"

# Push to GitHub (adjust branch name if needed)
git push origin main
```

- [ ] Workflows are committed to repository
- [ ] Workflows are pushed to GitHub

## ✅ Step 6: Verify Workflows

Go to your GitHub repository:
`https://github.com/YOUR_USERNAME/betterdays/actions`

- [ ] Check that the "CI" workflow ran successfully
- [ ] Check that the "Deploy to Production" workflow ran (if pushed to main)
- [ ] Verify no errors in the workflow logs

## ✅ Step 7: Verify Deployment

Go to your Vercel dashboard:
`https://vercel.com/YOUR_TEAM/betterdays`

- [ ] Check that a new deployment was created
- [ ] Verify the deployment is successful
- [ ] Open the deployment URL and test the application

## ✅ Step 8: Test Pull Request Preview

Create a test PR:

```bash
# Create a new branch
git checkout -b test-pr-preview

# Make a small change
echo "# Test PR" >> README.md

# Commit and push
git add README.md
git commit -m "test: verify PR preview deployment"
git push origin test-pr-preview
```

- [ ] Create a pull request on GitHub
- [ ] Wait for "Deploy Preview" workflow to complete
- [ ] Verify preview URL is commented on the PR
- [ ] Click the preview URL and test the deployment

## 🎉 Setup Complete!

Your CI/CD pipeline is now configured! Here's what happens automatically:

### On every push or PR to `main` or `develop`:
- ✅ Code is linted
- ✅ Tests are run with coverage
- ✅ Application is built to verify no build errors

### On every push to `main`:
- ✅ Automatically deploys to Vercel production

### On every pull request to `main`:
- ✅ Creates a preview deployment
- ✅ Comments the preview URL on the PR

## 🔧 Troubleshooting

If something doesn't work:

1. **Check GitHub Actions logs**: Go to Actions tab and click on the failed workflow
2. **Check Vercel deployment logs**: Go to Vercel dashboard → Deployments → Click on failed deployment
3. **Verify secrets**: Make sure all secrets are correctly set in GitHub
4. **Verify environment variables**: Make sure all env vars are set in Vercel
5. **Check the detailed guide**: See `.github/DEPLOYMENT.md` for more information

## 📚 Next Steps

- [ ] Set up branch protection rules on GitHub
- [ ] Configure automatic PR checks (require CI to pass before merge)
- [ ] Add status badges to your README
- [ ] Set up Codecov for coverage tracking (optional)
- [ ] Consider adding E2E tests to the pipeline

## 🔗 Useful Links

- [Detailed Deployment Guide](.github/DEPLOYMENT.md)
- [Vercel Documentation](https://vercel.com/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

