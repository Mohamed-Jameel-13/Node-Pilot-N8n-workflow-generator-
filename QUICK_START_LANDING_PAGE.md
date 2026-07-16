# 🚀 Quick Start - FlowForge Landing Page

Get your landing page up and running in 5 minutes!

---

## ⚡ Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Code editor (VS Code recommended)

---

## 📥 Step 1: Navigate to Frontend

```bash
cd frontend
```

---

## 📦 Step 2: Install Dependencies

```bash
npm install
```

This will install:
- Next.js 15
- Tailwind CSS v4
- Lucide React icons
- All required dependencies

---

## 🎨 Step 3: Run Development Server

```bash
npm run dev
```

The site will be available at: **http://localhost:3000**

---

## 👀 Step 4: View the Landing Page

Open your browser and go to:
```
http://localhost:3000
```

You should see the complete landing page with:
- ✅ Navigation bar
- ✅ Hero section
- ✅ Dashboard preview
- ✅ Features grid
- ✅ How it works section
- ✅ Pricing tables
- ✅ Final CTA
- ✅ Footer

---

## 🔧 Step 5: Customize Content (Optional)

### Edit Main Landing Page
Open `frontend/src/app/page.tsx` and customize:

**Hero Headline** (Line ~17):
```tsx
<h1 className="text-6xl md:text-7xl font-bold tracking-tight mb-6">
  Orchestrate your workflows
  <br />
  <span className="font-mono">without the headache</span>
</h1>
```

**Company Name** (Line ~13):
```tsx
<span className="text-xl font-bold">FlowForge</span>
```

**Pricing** (Line ~180+):
```tsx
<span className="text-5xl font-bold">$0</span>
<span className="text-5xl font-bold">$29</span>
```

### Edit SEO Metadata
Open `frontend/src/app/layout.tsx` and update:

**Title** (Line ~17):
```tsx
title: "FlowForge Control Plane - Secure n8n Workflow Orchestration Platform"
```

**Description** (Line ~18):
```tsx
description: "Your custom description here..."
```

---

## 🌐 Step 6: Update Environment Variables

Edit `frontend/.env.local`:

```env
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

---

## 🏗️ Step 7: Build for Production

When ready to deploy:

```bash
npm run build
```

This will:
- ✅ Optimize all code
- ✅ Generate static pages
- ✅ Create sitemap.xml
- ✅ Minify assets
- ✅ Check TypeScript errors

Expected output:
```
✓ Compiled successfully
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization

Route (app)
┌ ○ /               (Static)
├ ○ /sitemap.xml    (Static)
└ ...
```

---

## 🚢 Step 8: Deploy

### Option A: Cloudflare Pages (Recommended)

1. **Connect GitHub repo** to Cloudflare Pages
2. **Build settings**:
   - Build command: `npm run build`
   - Output directory: `.next`
   - Root directory: `frontend`
3. **Add environment variables** in Cloudflare dashboard
4. **Deploy!**

### Option B: Vercel

```bash
npm install -g vercel
vercel --prod
```

### Option C: Custom Server

```bash
npm run build
npm run start
```

Server runs on port 3000 by default.

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Landing page loads at your domain
- [ ] All sections visible and styled correctly
- [ ] Mobile responsive (test on phone)
- [ ] CTAs clickable (buttons work)
- [ ] Navigation links work
- [ ] Sitemap accessible at `/sitemap.xml`
- [ ] robots.txt accessible at `/robots.txt`
- [ ] Meta tags correct (view page source)
- [ ] Images load (if any added)
- [ ] Lighthouse score 90+ (run audit)

---

## 🔍 Testing

### Test Locally

**Different screen sizes:**
```
Desktop:  1280px+
Tablet:   768px - 1024px
Mobile:   < 640px
```

**Check in browser dev tools:**
1. Open DevTools (F12)
2. Toggle device toolbar
3. Test different screen sizes

### SEO Testing

**Sitemap:**
Visit: `http://localhost:3000/sitemap.xml`

**Meta tags:**
View page source and check `<head>` section

**Structured data:**
Use [Google Rich Results Test](https://search.google.com/test/rich-results)

---

## 📖 Documentation Reference

- **Complete Design System**: `LANDING_PAGE_DESIGN_SYSTEM.md`
- **Visual Guide**: `LANDING_PAGE_VISUAL_GUIDE.md`
- **Full README**: `LANDING_PAGE_README.md`
- **Implementation Summary**: `LANDING_PAGE_IMPLEMENTATION_SUMMARY.md`

---

## 🛠️ Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint

# Troubleshooting
rm -rf .next            # Clear Next.js cache
npm ci                  # Clean install dependencies
npm run build           # Rebuild
```

---

## 🐛 Troubleshooting

### Port 3000 already in use
```bash
# Kill process on port 3000
npx kill-port 3000

# Or use different port
npm run dev -- -p 3001
```

### Tailwind classes not applying
```bash
# Clear cache and restart
rm -rf .next
npm run dev
```

### Build errors
```bash
# Check TypeScript errors
npm run build

# Fix common issues
npm ci                  # Clean install
rm -rf node_modules     # Remove modules
npm install             # Reinstall
```

### Icons not showing
```bash
# Ensure lucide-react is installed
npm install lucide-react
```

---

## 🎨 Quick Customizations

### Change Primary Color

Edit `frontend/src/app/page.tsx`:

Find all instances of:
```tsx
bg-lime-400
text-lime-400
border-lime-400
```

Replace with your color, e.g.:
```tsx
bg-blue-500
text-blue-500
border-blue-500
```

### Change Logo

Replace the Zap icon (Line ~13):
```tsx
import { Zap } from "lucide-react";
// Change to:
import { YourIcon } from "lucide-react";

// Then use:
<YourIcon className="w-6 h-6 text-lime-400" />
```

### Update Pricing

Edit pricing section (Line ~180+):
```tsx
<span className="text-5xl font-bold">$X</span>
```

Update features list:
```tsx
<li className="flex items-center gap-3">
  <CheckCircle2 className="w-5 h-5 text-lime-400 flex-shrink-0" />
  <span>Your feature here</span>
</li>
```

---

## 📞 Need Help?

**Documentation:**
- Read `LANDING_PAGE_README.md` for detailed guide
- Check `LANDING_PAGE_DESIGN_SYSTEM.md` for design specs
- View `LANDING_PAGE_VISUAL_GUIDE.md` for layout reference

**Common Issues:**
- Build errors → Check TypeScript types
- Styling issues → Clear `.next` cache
- Icons missing → Install `lucide-react`

**Resources:**
- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind Docs](https://tailwindcss.com/docs)
- [Lucide Icons](https://lucide.dev/)

---

## 🎉 You're Done!

Your landing page is now running and ready to customize. Happy coding! 🚀

**Next steps:**
1. Customize content to match your brand
2. Add real images and logos
3. Connect to your backend API
4. Deploy to production
5. Submit to Google Search Console

---

**Total setup time: ~5 minutes** ⚡

