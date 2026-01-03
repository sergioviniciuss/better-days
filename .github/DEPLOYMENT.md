# GitHub Actions CI/CD Pipeline & Vercel Deployment

This document explains how to set up the GitHub Actions pipeline for continuous integration and deployment to Vercel.

## Overview

The pipeline consists of three workflows:

1. **CI Pipeline** (`ci.yml`) - Runs on push and pull requests to `main` and `develop` branches
2. **Production Deployment** (`deploy-production.yml`) - Deploys to production on push to `main`
3. **Preview Deployment** (`deploy-preview.yml`) - Creates preview deployments for pull requests

## Required GitHub Secrets

You need to configure the following secrets in your GitHub repository:

### 1. Vercel Deployment Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret

Add the following secrets:

#### `VERCEL_TOKEN`
- Go to [Vercel Account Settings → Tokens](https://vercel.com/account/tokens)
- Click "Create Token"
- Give it a name (e.g., "GitHub Actions")
- Copy the token and add it as a GitHub secret

#### `VERCEL_ORG_ID`
- Install the Vercel CLI: `npm i -g vercel`
- Run `vercel login` in your terminal
- Navigate to your project directory
- Run `vercel link` to link your project
- Open `.vercel/project.json` (created after linking)
- Copy the `orgId` value

Alternatively, you can find it in your Vercel dashboard URL:
- URL format: `https://vercel.com/[team-name]/[project-name]`
- Go to Settings → General → scroll to "Project ID" section

#### `VERCEL_PROJECT_ID`
- Same as above, get it from `.vercel/project.json` as `projectId`
- Or from Vercel dashboard → Project Settings → General → Project ID

### 2. Optional: Code Coverage Secret

#### `CODECOV_TOKEN` (Optional)
- Go to [Codecov.io](https://codecov.io/)
- Sign in with your GitHub account
- Add your repository
- Copy the token from repository settings
- Add it as a GitHub secret

If you don't want to use Codecov, you can remove the "Upload coverage to Codecov" step from `ci.yml`.

## Environment Variables

Make sure to configure all required environment variables in your Vercel project:

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add all environment variables needed for your application:
   - Database connection strings (if using external database)
   - Supabase keys (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, etc.)
   - Any other API keys or secrets

### Supabase Environment Variables

For the betterDays app, you'll need at least:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Workflow Details

### CI Workflow
- Runs tests with coverage
- Lints the code
- Generates Prisma client
- Builds the application
- Uploads coverage reports (optional)

### Production Deployment
- Automatically deploys to Vercel production when code is pushed to `main` branch
- Uses production environment variables from Vercel

### Preview Deployment
- Creates a preview deployment for each pull request
- Posts the preview URL as a comment on the PR
- Uses preview environment variables from Vercel

## Getting Started

1. **Set up Vercel Project**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login to Vercel
   vercel login
   
   # Link your project (run from project directory)
   cd /path/to/betterDays
   vercel link
   ```

2. **Get Your Vercel IDs**
   ```bash
   # After running vercel link, check the generated file
   cat .vercel/project.json
   ```

3. **Add GitHub Secrets**
   - Go to GitHub repository → Settings → Secrets and variables → Actions
   - Add `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID`

4. **Configure Vercel Environment Variables**
   - Go to Vercel dashboard → Your Project → Settings → Environment Variables
   - Add all required environment variables for Production, Preview, and Development

5. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Add GitHub Actions workflows"
   git push
   ```

6. **Monitor Workflows**
   - Go to your GitHub repository → Actions tab
   - You should see the workflows running

## Troubleshooting

### Build Fails Due to Environment Variables
- Make sure all required environment variables are set in Vercel
- Use `SKIP_ENV_VALIDATION=true` if you have env validation that shouldn't run during build

### Deployment Fails
- Check that your Vercel tokens and IDs are correct
- Make sure your Vercel account has sufficient permissions
- Check Vercel deployment logs for detailed error messages

### Tests Fail in CI
- Ensure all test dependencies are in `package.json`
- Check that Prisma schema is up to date
- Review test logs in GitHub Actions

## Customization

### Changing Branch Names
If you use different branch names, update the `branches` in each workflow file:

```yaml
on:
  push:
    branches: [your-main-branch, your-dev-branch]
```

### Changing Node Version
Update the `node-version` in `ci.yml`:

```yaml
strategy:
  matrix:
    node-version: [20.x]  # Change this
```

### Adding More Checks
You can add additional steps to `ci.yml`, such as:
- Type checking: `- run: yarn tsc --noEmit`
- E2E tests: `- run: yarn test:e2e`
- Security audits: `- run: yarn audit`

## Additional Resources

- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel GitHub Integration](https://vercel.com/docs/concepts/git/vercel-for-github)

