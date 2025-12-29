# Quick Start: Deployment Setup

This is a quick reference for deploying SovSeal. For detailed instructions, see the full guides.

## 1. GitHub Repository (5 minutes)

```bash
# Create repository on GitHub (public)
# Then connect and push:

git remote add origin https://github.com/USERNAME/sovseal.git
git branch -M main
git add .
git commit -m "Initial commit: SovSeal app"
git push -u origin main
```

## 2. GitHub Secrets (5 minutes)

Go to: Repository Settings → Secrets and variables → Actions

Add these secrets:

```
VERCEL_TOKEN              # From vercel.com/account/tokens
VERCEL_ORG_ID             # From .vercel/project.json
VERCEL_PROJECT_ID         # From .vercel/project.json
NEXT_PUBLIC_CONTRACT_ADDRESS    # Your contract address
NEXT_PUBLIC_RPC_ENDPOINT        # wss://westend-rpc.polkadot.io
NEXT_PUBLIC_NETWORK             # westend
```

Get Vercel IDs:

```bash
npm i -g vercel
vercel login
vercel link
cat .vercel/project.json
```

## 3. Vercel Deployment (5 minutes)

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure environment variables (same as GitHub secrets)
5. Click "Deploy"

## 4. Verify (2 minutes)

- [ ] GitHub Actions workflow runs successfully
- [ ] Vercel deployment completes
- [ ] Application loads at deployment URL
- [ ] Wallet connection works
- [ ] No console errors

## 5. Enable Branch Protection (2 minutes)

Repository Settings → Branches → Add rule for `main`:

- ✅ Require pull request reviews
- ✅ Require status checks to pass

## Done! 🎉

Your app is now deployed with automated CI/CD.

## Detailed Guides

- **Deployment**: See [DEPLOYMENT.md](../../DEPLOYMENT.md)
- **CI/CD**: See [CI_CD_GUIDE.md](../../CI_CD_GUIDE.md)
- **GitHub**: See [GITHUB_SETUP.md](../../GITHUB_SETUP.md)
- **Checklist**: See [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)

## Troubleshooting

**Build fails**: Run `npm run build` locally first  
**Secrets missing**: Double-check all secrets are added  
**Deployment fails**: Check Vercel logs in dashboard  
**Workflow fails**: Check Actions tab for error logs

## Support

- [Vercel Docs](https://vercel.com/docs)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
