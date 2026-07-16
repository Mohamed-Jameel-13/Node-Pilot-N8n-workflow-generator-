# FlowForge Control Plane - Landing Page

A modern, SEO-optimized landing page for the FlowForge Control Plane - a secure n8n workflow orchestration platform with AI-powered management capabilities.

## 🎯 Overview

This landing page is designed based on the AutoFlow design reference with a dark theme, lime accent colors, and a focus on security, automation, and enterprise features.

**Project Name:** FlowForge Control Plane  
**Design Theme:** Dark mode with lime-400 (#a3e635) accents  
**Target Audience:** DevOps engineers, automation specialists, and enterprise teams using self-hosted n8n

## ✨ Key Features

### Design Elements
- **Dark Theme:** Professional black (#0a0a0a) background with zinc accents
- **Vibrant CTAs:** Lime-400 primary buttons for high conversion
- **Monospace Typography:** Technical feel with Geist Mono for code elements
- **Dashboard Preview:** Interactive mock dashboard showing real-time stats
- **Feature Grid:** 6 key features with icons and descriptions
- **Pricing Table:** Transparent 2-tier pricing (Starter free, Pro $29/mo)
- **3-Step Process:** Clear user journey visualization

### SEO Optimization
- **Rich Meta Tags:** Complete Open Graph and Twitter Card implementation
- **Structured Data:** JSON-LD schemas for SoftwareApplication, Organization, and WebSite
- **Semantic HTML:** Proper heading hierarchy and semantic sections
- **Dynamic Sitemap:** Automated XML sitemap generation
- **robots.txt:** Search engine optimization directives
- **Target Keywords:** 12 primary SEO keywords focused on n8n workflow orchestration

### Technical Features
- **Next.js 15:** Server-side rendering for optimal performance
- **Tailwind CSS v4:** Modern utility-first styling
- **Lucide React:** Lightweight, beautiful icons
- **Mobile Responsive:** Fully responsive design across all breakpoints
- **Fast Loading:** Optimized images and minimal JavaScript
- **Accessibility:** WCAG AA compliant with keyboard navigation

## 📁 File Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # Root layout with comprehensive SEO metadata
│   │   ├── page.tsx                    # Main landing page component
│   │   ├── sitemap.ts                  # Dynamic sitemap generator
│   │   └── globals.css                 # Global styles and Tailwind configuration
│   └── components/
│       └── structured-data.tsx         # JSON-LD structured data schemas
├── public/
│   └── robots.txt                      # Search engine crawling directives
└── LANDING_PAGE_DESIGN_SYSTEM.md      # Complete design system documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
npm run build
npm run start
```

## 🎨 Design System

### Color Palette

#### Primary Colors
```css
Background:     #0a0a0a (Deep Black)
Surface:        #18181b (Zinc-900)
Border:         rgba(255, 255, 255, 0.1)
```

#### Accent Colors
```css
Primary:        #a3e635 (Lime-400)
Hover:          #84cc16 (Lime-500)
Text Primary:   #ffffff (White)
Text Secondary: #a1a1aa (Zinc-400)
```

#### Status Colors
```css
Success:        #22c55e (Green-400)
Warning:        #fb923c (Orange-400)
Error:          #ef4444 (Red-400)
Info:           #60a5fa (Blue-400)
```

### Typography

**Fonts:**
- Sans-serif: Geist Sans (body text)
- Monospace: Geist Mono (technical elements)

**Sizes:**
- Hero: 3.75rem - 4.5rem (60px - 72px)
- Section: 3rem (48px)
- Subsection: 1.5rem (24px)
- Body: 1rem (16px)

### Components

#### Primary Button
```tsx
<Link 
  href="/auth/signup" 
  className="px-8 py-4 bg-lime-400 hover:bg-lime-500 text-black rounded-md font-semibold"
>
  Start for free
</Link>
```

#### Secondary Button
```tsx
<Link 
  href="/demo" 
  className="px-8 py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-md border border-white/10"
>
  View Dashboard
</Link>
```

#### Feature Card
```tsx
<div className="border border-white/10 rounded-xl p-8 bg-zinc-900/30 hover:border-lime-400/30">
  <div className="w-12 h-12 rounded-lg bg-lime-400/10 flex items-center justify-center mb-6">
    <Icon className="w-6 h-6 text-lime-400" />
  </div>
  <h3 className="text-2xl font-bold mb-4">Feature Title</h3>
  <p className="text-zinc-400">Feature description...</p>
</div>
```

## 🔍 SEO Implementation

### Meta Tags

The landing page includes comprehensive meta tags for optimal search engine visibility:

```typescript
title: "FlowForge Control Plane - Secure n8n Workflow Orchestration Platform"
description: "Manage and orchestrate your self-hosted n8n workflows with AI-powered natural language control. Secure BYOK encryption, full audit trails, and one-click rollbacks."
keywords: [
  "n8n control plane",
  "workflow orchestration",
  "n8n management",
  // ... 12 total keywords
]
```

### Structured Data

Three JSON-LD schemas are implemented:

1. **SoftwareApplication**: Product details, pricing, features, ratings
2. **Organization**: Company information, social links, contact details
3. **WebSite**: Site structure and search functionality

### Sitemap

Dynamic sitemap includes 14 pages with proper priority and change frequency:
- Homepage (priority: 1.0)
- Pricing (priority: 0.9)
- Features (priority: 0.8)
- Documentation (priority: 0.7)
- Blog (priority: 0.7)

## 📊 Sections Breakdown

### 1. Navigation Bar
- Logo with Zap icon
- Navigation links: Home, Features, Pricing
- Login CTA button

### 2. Hero Section
- Large headline: "Orchestrate your workflows without the headache"
- Subtitle with value proposition
- Two CTAs: "Start for free" + "View Dashboard"

### 3. Dashboard Preview
- Browser chrome mockup
- 4-column stats grid (automations, enabled, runs, failed)
- Recent activity list
- Gradient background

### 4. Features Section (6 features)
1. **Unified Dashboard** - Monitor all automations
2. **One-Click Runs** - Instant workflow triggers
3. **AI-Powered Editor** - Natural language workflow building
4. **Audit Trail & Rollback** - Version history and restoration
5. **BYOK Encryption** - Data sovereignty
6. **Enterprise Security** - AES-256 and compliance

### 5. How It Works (3 Steps)
1. **Connect** - Link automation tools
2. **Configure** - Set triggers and schedules
3. **Control** - Monitor and optimize

### 6. Pricing Section
- **Starter Plan**: $0/month
  - 5 automations
  - 1,000 runs/month
  - Community support
  
- **Pro Plan**: $29/month (Most Popular)
  - Unlimited automations
  - 100K runs/month
  - Priority support
  - All advanced features

### 7. Final CTA
- Gradient bordered card
- "Ready to simplify your workflows?"
- Two CTAs: Sign up + Contact sales

### 8. Footer
- 4-column layout (Product, Resources, Company, Legal)
- Logo and copyright
- Social links

## 🎯 Target Keywords

Primary SEO keywords targeted:
1. n8n control plane
2. workflow orchestration
3. n8n management
4. workflow automation platform
5. BYOK encryption
6. self-hosted n8n
7. AI workflow editor
8. workflow audit trail
9. automation dashboard
10. n8n SaaS
11. workflow rollback
12. secure automation platform

## 📱 Responsive Design

### Breakpoints
```css
sm:  640px   /* Small tablets */
md:  768px   /* Tablets */
lg:  1024px  /* Laptops */
xl:  1280px  /* Desktops */
2xl: 1536px  /* Large screens */
```

### Mobile Optimizations
- Single column layouts on mobile
- Stacked buttons for better tap targets
- Reduced font sizes for readability
- Collapsed navigation (hamburger menu recommended)
- Touch-friendly spacing (min 44px tap targets)

## ⚡ Performance

### Optimization Techniques
- Next.js Image component for automatic optimization
- Server-side rendering for fast initial load
- Minimal client-side JavaScript
- Optimized font loading with Geist
- Efficient Tailwind CSS purging

### Target Metrics
- Lighthouse Score: 95+
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s
- Cumulative Layout Shift: < 0.1

## 🔧 Customization

### Changing Colors

Edit the Tailwind configuration in `globals.css`:

```css
/* Change primary accent color */
.dark {
  --color-primary: oklch(...); /* Replace with your color */
}
```

### Adding New Sections

Follow the existing pattern:

```tsx
<section className="max-w-7xl mx-auto px-6 py-32">
  <h2 className="text-5xl font-bold text-center mb-16">
    Section Title
  </h2>
  {/* Section content */}
</section>
```

### Updating Content

Key areas to customize:
1. **Hero headline** - Line 17-22 in page.tsx
2. **Features** - Lines 80-140 in page.tsx
3. **Pricing** - Lines 180-280 in page.tsx
4. **Footer links** - Lines 320-370 in page.tsx

## 📈 Analytics & Tracking

### Recommended Setup

1. **Google Analytics 4**
   - Page view tracking
   - CTA click events
   - Scroll depth tracking

2. **Google Search Console**
   - Submit sitemap.xml
   - Monitor indexing status
   - Track keyword rankings

3. **Conversion Tracking**
   - "Start for free" clicks
   - "View Dashboard" clicks
   - Pricing plan selections

4. **Heatmaps** (Optional)
   - Hotjar or Microsoft Clarity
   - Track user interaction patterns

## 🚀 Deployment

### Cloudflare Pages (Recommended)

1. Connect your GitHub repository
2. Build settings:
   - Build command: `npm run build`
   - Output directory: `.next`
   - Root directory: `frontend`

3. Environment variables:
   ```
   NODE_ENV=production
   NEXT_PUBLIC_APP_URL=https://flowforge.app
   ```

### Vercel (Alternative)

```bash
npm install -g vercel
vercel --prod
```

### Custom Server

```bash
npm run build
npm run start
```

## ✅ Pre-Launch Checklist

- [ ] All meta tags populated with real data
- [ ] Structured data validated (Google Rich Results Test)
- [ ] Sitemap accessible at /sitemap.xml
- [ ] robots.txt accessible at /robots.txt
- [ ] All links functional
- [ ] Mobile responsiveness tested (all breakpoints)
- [ ] Cross-browser compatibility (Chrome, Firefox, Safari, Edge)
- [ ] Performance audit (Lighthouse 95+)
- [ ] Accessibility audit (WCAG AA)
- [ ] Social media cards tested (Open Graph, Twitter)
- [ ] Forms working (if added later)
- [ ] Analytics tracking configured
- [ ] SSL certificate installed
- [ ] CDN caching configured
- [ ] Error pages styled (404, 500)

## 🐛 Troubleshooting

### Common Issues

**Fonts not loading:**
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

**Tailwind classes not applying:**
- Check that globals.css is imported in layout.tsx
- Verify Tailwind config includes all content paths

**Sitemap not generating:**
- Ensure sitemap.ts is in the app directory
- Check Next.js version is 13.3+

**Icons not showing:**
```bash
npm install lucide-react
```

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Lucide Icons](https://lucide.dev/)
- [SEO Best Practices](https://developers.google.com/search/docs)
- [Complete Design System](./LANDING_PAGE_DESIGN_SYSTEM.md)

## 🤝 Contributing

To maintain consistency:
1. Follow the established color palette
2. Use the spacing system (no arbitrary values)
3. Maintain typography hierarchy
4. Test on all breakpoints
5. Ensure accessibility standards

## 📄 License

Copyright © 2026 FlowForge. All rights reserved.

---

**Need help?** Contact the FlowForge team at hello@flowforge.app
