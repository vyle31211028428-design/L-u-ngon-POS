# Deployment Checklist - Lẩu Ngon POS

## ✅ Pre-Deployment Checklist

### Code Quality
- [x] TypeScript: `npx tsc --noEmit` ✅ 0 errors
- [x] Build test: `npm run build` ✅ Success
- [x] Preview test: `npm run preview` ✅ Works
- [x] All features tested locally
- [x] No console errors or warnings

### Git & GitHub
- [ ] All changes committed
- [ ] Code pushed to GitHub main branch
- [ ] GitHub repository is public/accessible

### Supabase Setup
- [ ] Database migration completed
  - [ ] `username` column added to employees table
  - [ ] Index created on username
  - [ ] All existing employees have usernames
- [ ] RLS policies configured correctly
- [ ] CORS enabled for your domain
- [ ] Project URL and anon key obtained

### Vercel Setup
- [ ] Vercel account created
- [ ] GitHub connected to Vercel
- [ ] Project imported on Vercel
- [ ] Environment variables added:
  - [ ] VITE_SUPABASE_URL
  - [ ] VITE_SUPABASE_ANON_KEY
  - [ ] (Optional) VITE_GEMINI_API_KEY
- [ ] Build settings configured
- [ ] Initial deploy successful

### Testing on Production
- [ ] Vercel URL is accessible
- [ ] Login works (username + PIN)
- [ ] All roles work (Admin, Kitchen, Cashier, Staff, Customer)
- [ ] Database operations work
- [ ] Supabase connection verified
- [ ] Rate limiting works
- [ ] Mobile responsive verified
- [ ] No errors in browser console

### Custom Domain (Optional)
- [ ] Domain registered
- [ ] DNS records updated
- [ ] SSL certificate generated
- [ ] Domain redirects properly
- [ ] HTTPS working

## 🚀 Deployment Steps

### Step 1: Prepare Locally
```bash
cd /Users/nhathuynhngoc/Documents/lẩu-ngon-pos

# Verify build
npm run build

# Check for errors
npx tsc --noEmit

# Verify everything is committed
git status

# Make final commit
git add -A
git commit -m "chore: Prepare for Vercel deployment"
git push origin main
```

### Step 2: Create Vercel Project
1. Go to https://vercel.com/dashboard
2. Click "Add New" → "Project"
3. Select your GitHub repository
4. Click "Import"

### Step 3: Configure Environment
1. On Vercel, go to Settings → Environment Variables
2. Add:
   - `VITE_SUPABASE_URL` = your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
3. Save

### Step 4: Deploy
1. Click "Deploy"
2. Wait for build to complete (2-3 min)
3. Get your deployment URL
4. Click "Visit" to view deployed app

### Step 5: Verify Deployment
- Test login with username + PIN
- Test all features
- Check console for errors
- Verify Supabase connection

### Step 6: Setup Custom Domain (Optional)
1. Vercel Dashboard → Settings → Domains
2. Add your custom domain
3. Update DNS records per Vercel instructions
4. Wait for DNS propagation (can take 24h)

## 📊 Post-Deployment Monitoring

### Daily Checks
- Check Vercel logs for errors
- Monitor Supabase quota usage
- Check error rates

### Weekly Checks
- Review Vercel analytics
- Check performance metrics
- Verify no security issues

## 🔧 Useful Commands

### Local Testing Before Deploy
```bash
# Full build test
npm run build

# Preview production build
npm run preview

# TypeScript check
npx tsc --noEmit

# View dist size
du -sh dist/
```

### Vercel CLI (Optional)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy directly from CLI
vercel

# View logs
vercel logs

# Rollback to previous version
vercel rollback
```

## 📱 Important Environment Variables

| Variable | Required | Source | Example |
|----------|----------|--------|---------|
| VITE_SUPABASE_URL | Yes | Supabase Settings → API | https://xxx.supabase.co |
| VITE_SUPABASE_ANON_KEY | Yes | Supabase Settings → API | eyJ0eXAiOiJ... |
| VITE_GEMINI_API_KEY | No | Google Cloud Console | (optional for AI features) |

## 🔒 Security

### Before Deploying
- [ ] Never commit `.env` files
- [ ] Never commit API keys
- [ ] Use `.env.example` for reference
- [ ] Enable GitHub branch protection
- [ ] Setup 2FA on Vercel
- [ ] Setup 2FA on Supabase

### After Deploying
- [ ] Monitor for unauthorized access
- [ ] Review Supabase RLS policies
- [ ] Setup rate limiting on API
- [ ] Monitor error logs
- [ ] Regular security updates

## 🆘 Troubleshooting

### Build fails on Vercel but works locally
```
Solution: Delete node_modules and package-lock.json locally
npm install
git add package-lock.json
git push
```

### Environment variables not recognized
```
Solution: Restart deployment or re-add env vars
Vercel Dashboard → Deployments → Recent → Redeploy
```

### Supabase connection fails
```
Check:
1. VITE_SUPABASE_URL format correct
2. VITE_SUPABASE_ANON_KEY not expired
3. Supabase project is active
4. Database tables exist
5. RLS policies allow read/write
```

### Slow performance
```
Solutions:
1. Check Supabase query performance
2. Enable caching headers
3. Optimize bundle size (run: npm run build, check dist/)
4. Use Vercel Analytics to find bottlenecks
```

## 📞 Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Vite Docs**: https://vitejs.dev
- **React Docs**: https://react.dev
- **Supabase Docs**: https://supabase.com/docs
- **Vercel Support**: https://vercel.com/support
- **GitHub Issues**: Create issue in your repo

## ✨ Post-Deployment Tasks

### Day 1 After Deploy
- [ ] Monitor error rates
- [ ] Check user feedback
- [ ] Verify all features
- [ ] Check performance metrics

### Week 1 After Deploy
- [ ] Analyze user behavior
- [ ] Optimize slow queries
- [ ] Plan improvements
- [ ] Document issues

### Regular Maintenance
- [ ] Weekly: Check logs and errors
- [ ] Monthly: Review analytics
- [ ] Quarterly: Security audit
- [ ] Annually: Database optimization

---

**Last Updated**: Dec 27, 2025
**Status**: Ready for Production
**Next Review**: After first deployment
