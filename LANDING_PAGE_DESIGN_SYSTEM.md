# FlowForge Control Plane - Landing Page Design System

## 📋 Project Overview

**Project Name:** FlowForge Control Plane  
**Tagline:** Secure n8n Workflow Orchestration Platform  
**Description:** A secure, cloud-hosted control plane for self-hosted n8n instances with AI-powered workflow management, BYOK encryption, and enterprise-grade audit trails.

---

## 🎨 Design Requirements

### Color Palette

Based on the AutoFlow design reference, the landing page uses a dark theme with vibrant accent colors:

#### Primary Colors
- **Background:** `#0a0a0a` (Deep black)
- **Surface:** `#18181b` (Zinc-900)
- **Border:** `rgba(255, 255, 255, 0.1)` (White with 10% opacity)

#### Accent Colors
- **Primary Accent:** `#a3e635` (Lime-400) - Used for CTAs, highlights, and active states
- **Hover State:** `#84cc16` (Lime-500)
- **Text Primary:** `#ffffff` (White)
- **Text Secondary:** `#a1a1aa` (Zinc-400)
- **Text Muted:** `#71717a` (Zinc-500)

#### Status Colors
- **Success:** `#22c55e` (Green-400)
- **Warning:** `#fb923c` (Orange-400)
- **Error:** `#ef4444` (Red-400)
- **Info:** `#60a5fa` (Blue-400)

### Typography

#### Font Families
- **Sans-serif:** Geist Sans (primary body text)
- **Monospace:** Geist Mono (code, technical elements)
- **Display:** Geist Sans Bold (headings)

#### Font Sizes & Hierarchy
```css
Hero Heading: 3.75rem (60px) - 4.5rem (72px) on desktop
Section Heading: 3rem (48px)
Subsection Heading: 1.5rem (24px)
Body Large: 1.25rem (20px)
Body: 1rem (16px)
Caption: 0.875rem (14px)
Small: 0.75rem (12px)
```

#### Font Weights
- Regular: 400
- Medium: 500
- Semibold: 600
- Bold: 700

### Spacing System

Based on Tailwind's spacing scale:
```
xs: 0.5rem (8px)
sm: 0.75rem (12px)
md: 1rem (16px)
lg: 1.5rem (24px)
xl: 2rem (32px)
2xl: 3rem (48px)
3xl: 4rem (64px)
4xl: 6rem (96px)
5xl: 8rem (128px)
```

### Border Radius
- **Small:** 0.375rem (6px)
- **Medium:** 0.5rem (8px)
- **Large:** 0.75rem (12px)
- **XL:** 1rem (16px)
- **2XL:** 1.5rem (24px)

### Components

#### Buttons
1. **Primary Button** (CTA)
   - Background: Lime-400 (#a3e635)
   - Text: Black
   - Hover: Lime-500 (#84cc16)
   - Padding: 1rem 2rem
   - Border Radius: 0.5rem

2. **Secondary Button**
   - Background: Zinc-800
   - Text: White
   - Hover: Zinc-700
   - Border: 1px solid white/10%
   - Padding: 1rem 2rem
   - Border Radius: 0.5rem

#### Cards
- Background: Zinc-900/30%
- Border: 1px solid white/10%
- Border Radius: 1rem
- Padding: 2rem
- Hover: Border changes to lime-400/30%

#### Navigation
- Background: Black with border-bottom
- Height: 64px
- Logo with icon + text
- Navigation links in zinc-400, hover to white
- Login button: Primary style

#### Icons
- Using Lucide React icon library
- Size: 1.5rem (24px) for feature icons
- Size: 1rem (16px) for inline icons
- Color: Lime-400 for primary icons

---

## 📐 Layout Sections

### 1. Navigation Bar
- Fixed top position
- Logo (Zap icon + "FlowForge" text)
- Nav links: Home, Features, Pricing
- Login button (Primary style)

### 2. Hero Section
```
- Large heading with monospace accent
- Subtitle paragraph (max-width: 48rem)
- Two CTA buttons: "Start for free" + "View Dashboard"
- Vertical spacing: py-32 (8rem)
```

### 3. Dashboard Preview
```
- Browser chrome mockup (macOS style)
- Gradient background (zinc-900 to zinc-800)
- 4-column stats grid with colored borders
- Activity list with status indicators
- Border: white/10% with rounded corners
```

### 4. Features Grid
```
- 2-column grid on desktop, 1-column mobile
- Each card: Icon + Title + Description
- Icons in lime-400/10% background circles
- Hover effect: Border color changes
- Gap: 2rem between cards
```

Features Highlighted:
1. Unified Dashboard (Globe icon)
2. One-Click Runs (Zap icon)
3. AI-Powered Workflow Editor (Code icon)
4. Audit Trail & Rollback (Database icon)
5. BYOK Encryption (Lock icon)
6. Enterprise Security (Shield icon)

### 5. How It Works (3 Steps)
```
- Single bordered card container
- 3-column grid
- Large step numbers (01, 02, 03) in zinc-700
- Step title + description
- Horizontal layout on desktop
```

Steps:
1. **Connect** - Link automation tools
2. **Configure** - Set triggers and schedules
3. **Control** - Monitor and optimize

### 6. Pricing Section
```
- 2-column grid (max-width: 80rem)
- Starter Plan: Standard card styling
- Pro Plan: Lime-400 border with "Most Popular" badge
- Feature list with checkmark icons
- CTA button at bottom of each card
```

Pricing Tiers:
- **Starter**: $0/month - 5 automations, 1K runs
- **Pro**: $29/month - Unlimited automations, 100K runs

### 7. Final CTA Section
```
- Gradient border card (lime-400/5%)
- Large heading + subheading
- Two buttons: "Start for free" + "Contact Sales"
- Center-aligned content
```

### 8. Footer
```
- 4-column grid on desktop
- Sections: Product, Resources, Company, Legal
- Logo + Copyright at bottom
- Links in zinc-400, hover to white
- Border-top separator
```

---

## 🔍 SEO Implementation

### Meta Tags (layout.tsx)

```typescript
- Title: "FlowForge Control Plane - Secure n8n Workflow Orchestration Platform"
- Description: ~155 characters, keyword-rich
- Keywords: 12 relevant terms
- Open Graph tags for social sharing
- Twitter Card tags
- Canonical URL
- Robots: index, follow
```

### Target Keywords
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

### Structured Data (JSON-LD)

Three schema types implemented:

1. **SoftwareApplication Schema**
   - Application details
   - Pricing information
   - Feature list
   - Aggregate ratings

2. **Organization Schema**
   - Company information
   - Contact details
   - Social media links
   - Logo reference

3. **WebSite Schema**
   - Site navigation
   - Search functionality
   - Breadcrumbs

### SEO Best Practices Applied

✅ **Semantic HTML**
- Proper heading hierarchy (h1 → h2 → h3)
- Semantic sections and articles
- Descriptive link text

✅ **Performance Optimization**
- Next.js Image optimization
- Font optimization with Geist
- Minimal client-side JavaScript
- Server-side rendering

✅ **Mobile Optimization**
- Responsive grid layouts
- Touch-friendly buttons (min 44px)
- Readable font sizes on mobile
- Proper viewport meta tag

✅ **Accessibility**
- ARIA labels where needed
- Keyboard navigation support
- Color contrast ratios (WCAG AA)
- Focus indicators

✅ **Content Strategy**
- Clear value proposition
- Feature-benefit focused copy
- Action-oriented CTAs
- Scannable content structure

### robots.txt Configuration
```
- Allow all bots on public pages
- Disallow /api/, /admin/, /dashboard/, /auth/
- Sitemap reference
- Crawl-delay: 1 second
```

### Sitemap (sitemap.ts)
- Dynamic XML sitemap generation
- 14 pages indexed
- Priority and change frequency set
- Automated lastModified dates

---

## 🚀 Technical Implementation

### Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS v4
- **UI Components:** shadcn/ui
- **Icons:** Lucide React
- **Fonts:** Geist Sans & Geist Mono
- **Hosting:** Cloudflare Pages

### File Structure
```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with SEO metadata
│   │   ├── page.tsx            # Landing page component
│   │   ├── sitemap.ts          # Dynamic sitemap generation
│   │   └── globals.css         # Global styles
│   └── components/
│       └── structured-data.tsx # JSON-LD schemas
└── public/
    └── robots.txt              # Search engine directives
```

### Responsive Breakpoints
```css
sm: 640px   /* Small tablets */
md: 768px   /* Tablets */
lg: 1024px  /* Small laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large desktops */
```

### Animation & Transitions
- Hover transitions: 200ms ease
- Button scale on hover: subtle
- Border color transitions: 300ms
- No excessive animations (performance)

---

## 📊 Performance Targets

- **Lighthouse Score:** 95+ on all metrics
- **First Contentful Paint:** < 1.5s
- **Time to Interactive:** < 3.5s
- **Cumulative Layout Shift:** < 0.1
- **Total Bundle Size:** < 200KB (gzipped)

---

## 🎯 Conversion Optimization

### Primary CTAs
1. **Hero Section:** "Start for free" (above fold)
2. **Pricing Section:** Plan selection buttons
3. **Final CTA:** "Start for free" + "Contact Sales"

### Trust Signals
- Feature badges (Security, Audit Trail, BYOK)
- Transparent pricing with free tier
- Clear feature comparison
- Enterprise-grade messaging

### User Journey
```
Landing → Features → Pricing → Signup
         ↓
    Dashboard Preview (Social Proof)
```

---

## 🔧 Maintenance & Updates

### Regular Updates Needed
- Blog posts for SEO content freshness
- Customer testimonials
- Updated screenshots/demos
- Version changelog
- Security compliance badges

### A/B Testing Opportunities
- Hero headline variations
- CTA button colors/text
- Pricing tier positioning
- Feature highlighting order

---

## 📝 Content Guidelines

### Voice & Tone
- **Professional** but approachable
- **Technical** but jargon-light
- **Confident** in capabilities
- **Security-focused** messaging

### Key Messages
1. Data sovereignty with BYOK
2. Enterprise security & compliance
3. AI-powered simplicity
4. Complete audit trail
5. Free tier availability

### Call-to-Action Copy
- "Start for free" (primary)
- "View Dashboard" (secondary)
- "Contact Sales" (enterprise)
- "Start Free Trial" (pro plan)

---

## 🎨 Design Assets Needed

For full production deployment:

1. **Logo Files**
   - logo.svg (scalable)
   - logo.png (1024x1024)
   - favicon.ico (32x32)
   - apple-touch-icon.png (180x180)

2. **Social Media Images**
   - og-image.png (1200x630) - Open Graph
   - twitter-image.png (1200x600) - Twitter Card

3. **Screenshots**
   - dashboard-screenshot.png (1920x1080)
   - workflow-editor.png (1920x1080)
   - audit-trail.png (1920x1080)

4. **Demo Video** (optional)
   - Product demo (30-60 seconds)
   - Hosted on YouTube/Vimeo
   - Embedded on landing page

---

## ✅ Launch Checklist

- [ ] All meta tags verified
- [ ] Structured data validated (Google Rich Results Test)
- [ ] robots.txt accessible at /robots.txt
- [ ] Sitemap accessible at /sitemap.xml
- [ ] Mobile responsiveness tested
- [ ] Cross-browser compatibility checked
- [ ] Performance metrics meet targets
- [ ] All links functional
- [ ] Forms working (if applicable)
- [ ] Analytics tracking configured
- [ ] Error pages styled (404, 500)
- [ ] SSL certificate installed
- [ ] DNS properly configured
- [ ] CDN caching optimized

---

## 📈 Post-Launch Monitoring

### Analytics to Track
- Page views and unique visitors
- Bounce rate on landing page
- Time on page
- Scroll depth
- CTA click-through rates
- Signup conversion rate
- Traffic sources

### SEO Monitoring
- Google Search Console setup
- Index coverage monitoring
- Core Web Vitals tracking
- Keyword ranking positions
- Backlink profile
- Organic traffic growth

---

## 🤝 Contributing

To maintain design consistency:

1. Follow the color palette strictly
2. Use spacing system (don't add arbitrary values)
3. Maintain typography hierarchy
4. Test responsiveness on all breakpoints
5. Ensure accessibility standards
6. Update this document with changes

---

**Last Updated:** July 15, 2026  
**Version:** 1.0  
**Maintainer:** FlowForge Team
