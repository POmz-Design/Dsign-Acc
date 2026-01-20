# Dsign Accounting - Vercel Deployment Guide

## Step 1: Add Your Logo

Before deploying, add your logo file:

1. Save your logo file as `logo.png` in the project root directory
2. Make sure it's a PNG with transparent background (recommended)
3. Optimal size: 200-300px width

OR if you prefer to keep using SVG, you can keep the current `logo.svg` file.

## Step 2: Deploy to Vercel

### Method A: Deploy via Vercel CLI (Command Line)

If you have Vercel CLI installed:

```bash
# Login to Vercel
vercel login

# Deploy the project
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Select your account
# - Link to existing project? No
# - What's your project's name? dsign-accounting
# - In which directory is your code located? ./
# - Want to override the settings? No

# For production deployment:
vercel --prod
```

### Method B: Deploy via Vercel Dashboard (Recommended - Easiest)

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Login with your account

2. **Import Project**
   - Click "Add New..." → "Project"
   - Select "Import Git Repository"

3. **Connect to GitHub**
   - If your code is on GitHub, connect the repository
   - OR upload files directly via Vercel CLI

4. **Configure Project**
   - Project Name: `dsign-accounting`
   - Framework Preset: `Other` (static site)
   - Root Directory: `./`
   - Build Command: (leave empty)
   - Output Directory: `./`

5. **Deploy**
   - Click "Deploy"
   - Wait 1-2 minutes for deployment to complete

6. **Your site will be live at:**
   - `https://dsign-accounting.vercel.app`
   - OR your custom domain once configured

## Step 3: Connect Custom Domain (dsign-accounting.com)

### Option A: Point Squarespace Domain to Vercel

1. **In Vercel Dashboard:**
   - Go to your project → Settings → Domains
   - Click "Add Domain"
   - Enter: `dsign-accounting.com`
   - Also add: `www.dsign-accounting.com`
   - Vercel will show DNS records you need to add

2. **In Squarespace:**
   - Go to Settings → Domains
   - Click on `dsign-accounting.com`
   - Go to DNS Settings
   - Add the DNS records Vercel provided:
     - **A Record**: Point `@` to Vercel's IP (76.76.21.21)
     - **CNAME Record**: Point `www` to `cname.vercel-dns.com`

3. **Wait for DNS propagation** (5 minutes - 48 hours, usually ~1 hour)

4. **SSL Certificate**
   - Vercel automatically provisions free SSL certificate
   - Your site will be available at `https://dsign-accounting.com`

### Option B: Transfer Domain from Squarespace to Vercel

If you want to manage everything in Vercel:
1. Unlock domain in Squarespace
2. Get authorization code
3. Transfer to Vercel Domains

## Step 4: Verify Deployment

1. Visit your site at the Vercel URL
2. Test all sections:
   - ✅ Navigation works
   - ✅ Mobile menu works
   - ✅ FAQ accordion works
   - ✅ Contact form opens email client
   - ✅ All links work
   - ✅ Responsive design on mobile

## Quick Deploy via GitHub (Alternative)

If you want continuous deployment:

1. **Push to GitHub**
   ```bash
   git push origin claude/dsign-accounting-website-TOAJV
   ```

2. **Import in Vercel**
   - Connect your GitHub account to Vercel
   - Import the repository
   - Vercel will auto-deploy on every push

## Troubleshooting

### Logo Not Showing
- Make sure `logo.png` is in the root directory
- OR update `index.html` line 20 to match your logo filename

### Email Not Working
- The contact form uses `mailto:` protocol
- Requires user's email client to be configured
- Email: dsign.acct@gmail.com

### Domain Not Connecting
- Check DNS propagation: https://dnschecker.org
- Verify DNS records in Squarespace match Vercel's requirements
- Wait 24-48 hours for full propagation

### Custom 404 Page (Optional Enhancement)
Create `404.html` if you want a custom error page.

## Environment Variables (If Needed Later)

If you add backend features later:
- Go to Vercel Dashboard → Settings → Environment Variables
- Add any API keys or secrets there

## Support

- Vercel Documentation: https://vercel.com/docs
- Domain Configuration: https://vercel.com/docs/concepts/projects/domains

---

**Current Configuration:**
- Email: dsign.acct@gmail.com
- Phone: 086-980-7222 (Tanapat P.)
- Domain: dsign-accounting.com
- Platform: Vercel
