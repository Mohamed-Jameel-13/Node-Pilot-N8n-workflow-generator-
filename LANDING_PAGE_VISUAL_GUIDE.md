# FlowForge Control Plane - Visual Landing Page Guide

This document provides a visual walkthrough of the landing page design and layout.

---

## 🎨 Color Theme Overview

```
┌─────────────────────────────────────────────────────┐
│ Background:    #0a0a0a (Deep Black)                 │
│ Surface:       #18181b (Zinc-900)                   │
│ Accent:        #a3e635 (Lime-400) ⚡                │
│ Border:        rgba(255,255,255,0.1)                │
│ Text:          #ffffff (White)                      │
│ Text Muted:    #a1a1aa (Zinc-400)                   │
└─────────────────────────────────────────────────────┘
```

---

## 📱 Section-by-Section Breakdown

### 1. Navigation Bar
```
┌──────────────────────────────────────────────────────────────────┐
│  ⚡ FlowForge    Home   Features   Pricing          [Login] ✓   │
└──────────────────────────────────────────────────────────────────┘
```
- **Height**: 64px
- **Background**: Black with bottom border
- **Logo**: Zap icon + "FlowForge" text in white
- **Links**: Zinc-400, hover to white
- **Login Button**: Lime-400 background, black text

---

### 2. Hero Section
```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│                                                                  │
│              Orchestrate your workflows                          │
│              without the headache                                │
│                                                                  │
│     Connect n8n, manage workflows with AI, and control          │
│     everything from one unified dashboard. Secure,              │
│     auditable, and built for teams who value their             │
│     data sovereignty.                                           │
│                                                                  │
│        [Start for free] ✓    [View Dashboard]                   │
│                                                                  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```
- **Headline**: 60-72px, bold, with monospace accent
- **Subtitle**: 20px, zinc-400, max-width 48rem
- **Primary CTA**: Lime-400 button
- **Secondary CTA**: Zinc-800 with border
- **Spacing**: 8rem vertical padding

---

### 3. Dashboard Preview
```
┌──────────────────────────────────────────────────────────────────┐
│  ● ● ●   flowforge.app/dashboard                                │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐                       │
│  │ ⚡12 │  │ ✓ 9  │  │ ⟲ 847│  │ ✗ 3  │                       │
│  │Total │  │Enable│  │24h   │  │Fail  │                       │
│  └──────┘  └──────┘  └──────┘  └──────┘                       │
│                                                                  │
│  Recent Activity                            View all →          │
│  ─────────────────────────────────────────────────              │
│  ● WhatsApp Customer Support          Success                   │
│  ● Slack Notification Bot              Failed                   │
│  ● Database Backup Scheduler           Success                  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```
- **Browser Chrome**: macOS style with red/yellow/green dots
- **Stats Cards**: 4-column grid with colored borders
- **Activity List**: Green/red status indicators
- **Background**: Gradient from zinc-900 to zinc-800

---

### 4. Features Section
```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│                    Everything you need                           │
│            From one-off scripts to complex                       │
│                  multi-step workflows.                           │
│                                                                  │
│  ┌─────────────────────────┐  ┌─────────────────────────┐     │
│  │  🌐                     │  │  ⚡                     │     │
│  │  Unified Dashboard      │  │  One-Click Runs        │     │
│  │  Monitor all your       │  │  Trigger any workflow  │     │
│  │  automations — n8n,     │  │  instantly. Schedule,  │     │
│  │  WhatsApp, cron —       │  │  test, and run auto-   │     │
│  │  from a single panel.   │  │  mations without       │     │
│  │                         │  │  touching a terminal.  │     │
│  └─────────────────────────┘  └─────────────────────────┘     │
│                                                                  │
│  ┌─────────────────────────┐  ┌─────────────────────────┐     │
│  │  </> AI-Powered         │  │  🗄️ Audit Trail &      │     │
│  │  Workflow Editor        │  │  Rollback              │     │
│  │  Build and modify       │  │  Every change is       │     │
│  │  workflows using        │  │  logged with full      │     │
│  │  natural language.      │  │  version history.      │     │
│  └─────────────────────────┘  └─────────────────────────┘     │
│                                                                  │
│  ┌─────────────────────────┐  ┌─────────────────────────┐     │
│  │  🔒 BYOK Encryption     │  │  🛡️ Enterprise         │     │
│  │  Your API keys stay     │  │  Security              │     │
│  │  encrypted with your    │  │  AES-256 encryption,   │     │
│  │  own master key.        │  │  row-level security.   │     │
│  └─────────────────────────┘  └─────────────────────────┘     │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```
- **Grid**: 2 columns on desktop, 1 on mobile
- **Icons**: Lime-400 in circular backgrounds
- **Cards**: Zinc-900/30% background with borders
- **Hover Effect**: Border changes to lime-400/30%

---

### 5. How It Works
```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│                    Three easy steps                              │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                                                            │ │
│  │   01               02               03                    │ │
│  │   Connect          Configure        Control               │ │
│  │                                                            │ │
│  │   Link your        Set triggers,    Monitor, debug,       │ │
│  │   automation       schedules, and   and optimize —        │ │
│  │   tools. n8n,      conditions       all from your         │ │
│  │   WhatsApp         from a clean     dashboard.            │ │
│  │   Business, or     visual                                 │ │
│  │   custom cron      interface.                             │ │
│  │   jobs.                                                    │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```
- **Single Card**: Bordered container
- **3 Columns**: Horizontal layout on desktop
- **Step Numbers**: Large, bold, zinc-700
- **Typography**: Title + description per step

---

### 6. Pricing Section
```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│                  Transparent pricing                             │
│              No surprises. Cancel anytime.                       │
│                                                                  │
│  ┌─────────────────────┐    ┌─────────────────────┐            │
│  │ STARTER             │    │ PRO [Most Popular]  │            │
│  │                     │    │                     │            │
│  │ $0 /month          │    │ $29 /month         │            │
│  │                     │    │                     │            │
│  │ For individuals     │    │ For teams running   │            │
│  │ and small projects. │    │ production auto...  │            │
│  │                     │    │                     │            │
│  │ ✓ Up to 5 auto...  │    │ ✓ Unlimited auto... │            │
│  │ ✓ 1,000 runs/month │    │ ✓ 100K runs/month  │            │
│  │ ✓ Community support│    │ ✓ Priority support │            │
│  │ ✓ Basic logs       │    │ ✓ Deep logs        │            │
│  │ ✓ 7-day audit...   │    │ ✓ 12-month audit..│            │
│  │                     │    │ ✓ AI workflow...   │            │
│  │                     │    │ ✓ Team collab...   │            │
│  │                     │    │ ✓ BYOK encryption  │            │
│  │                     │    │                     │            │
│  │ [Get Started]      │    │ [Start Free Trial]│            │
│  │                     │    │                     │            │
│  └─────────────────────┘    └─────────────────────┘            │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```
- **Grid**: 2 columns, max-width 80rem
- **Starter**: Standard border (white/10%)
- **Pro**: Lime-400 border with badge
- **Features**: Check icons (lime-400)
- **Buttons**: Plan-specific styling

---

### 7. Final CTA Section
```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                                                            │ │
│  │        Ready to simplify your workflows?                  │ │
│  │                                                            │ │
│  │    Join hundreds of teams managing their n8n instances    │ │
│  │    with FlowForge. Start free, upgrade when you need to.  │ │
│  │                                                            │ │
│  │      [Start for free] ✓    [Contact Sales]               │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```
- **Card**: Gradient border (lime-400/5%)
- **Background**: Subtle gradient fill
- **Centered**: All content center-aligned
- **Two CTAs**: Primary + secondary buttons

---

### 8. Footer
```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Product          Resources        Company         Legal         │
│  ─────────        ─────────        ─────────       ─────────     │
│  Features         Documentation    About           Privacy       │
│  Pricing          API Reference    Blog            Terms         │
│  Demo             Guides           Careers         Security      │
│  Changelog        Support          Contact                       │
│                                                                  │
│  ──────────────────────────────────────────────────────────────  │
│                                                                  │
│  ⚡ FlowForge               © 2026 FlowForge Control Plane.     │
│                             All rights reserved.                │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```
- **Grid**: 4 columns on desktop
- **Links**: Zinc-400, hover to white
- **Bottom**: Logo + copyright
- **Border**: Top separator line

---

## 🎯 Visual Hierarchy

### Primary Elements (Attention Grabbers)
1. **Hero Headline** - Largest text, bold, high contrast
2. **Primary CTAs** - Lime-400 buttons, high visibility
3. **Pricing "Most Popular"** - Badge and border highlight

### Secondary Elements (Supporting)
1. **Section Headlines** - Large but not dominant
2. **Feature Icons** - Lime-400 accent color
3. **Stats Dashboard** - Visual interest with colors

### Tertiary Elements (Informational)
1. **Body Text** - Zinc-400, readable but subtle
2. **Footer Links** - Small, low hierarchy
3. **Borders** - Subtle white/10% separators

---

## 📐 Spacing & Layout

### Vertical Rhythm
```
Navigation:     64px height
Hero:           128px padding top/bottom (py-32)
Sections:       128px padding top/bottom (py-32)
Footer:         48px padding top/bottom (py-12)
```

### Horizontal Spacing
```
Container:      max-w-7xl (1280px)
Padding:        24px left/right (px-6)
Card Padding:   32px all sides (p-8)
Button Padding: 16px top/bottom, 32px left/right (py-4 px-8)
```

### Grid Gaps
```
Feature Cards:  32px (gap-8)
Pricing Cards:  32px (gap-8)
Footer Columns: 32px (gap-8)
```

---

## 🎨 Component States

### Buttons

**Primary (Default)**
```
Background: #a3e635 (Lime-400)
Text: Black
Border Radius: 8px
```

**Primary (Hover)**
```
Background: #84cc16 (Lime-500)
Text: Black
Transition: 200ms
```

**Secondary (Default)**
```
Background: #27272a (Zinc-800)
Text: White
Border: 1px solid rgba(255,255,255,0.1)
```

**Secondary (Hover)**
```
Background: #3f3f46 (Zinc-700)
Text: White
```

### Cards

**Default**
```
Background: rgba(24, 24, 27, 0.3) [Zinc-900/30%]
Border: 1px solid rgba(255,255,255,0.1)
Border Radius: 16px
```

**Hover**
```
Border: 1px solid rgba(163, 230, 53, 0.3) [Lime-400/30%]
Transition: 300ms
```

---

## 📱 Responsive Breakpoints

### Mobile (< 640px)
- Navigation: Hamburger menu (recommended to add)
- Hero: Single column, smaller text (48-56px)
- Features: 1 column grid
- Pricing: 1 column stack
- Footer: 2 columns

### Tablet (640px - 1024px)
- Hero: Slightly smaller text (60px)
- Features: 1 column grid
- Pricing: 1 column or 2 if space allows
- Footer: 2 columns

### Desktop (1024px+)
- Hero: Full size (72px)
- Features: 2 columns
- Pricing: 2 columns
- Footer: 4 columns
- All hover effects active

---

## 🎬 Animation & Transitions

### Hover Transitions
```css
Buttons:        200ms ease-in-out
Cards:          300ms ease-in-out
Links:          150ms ease-in-out
Borders:        300ms ease-in-out
```

### Visual Feedback
- Button hover: Background color change
- Card hover: Border color change
- Link hover: Color change from zinc-400 to white
- Smooth transitions, no abrupt changes

---

## 🔤 Typography Scale

```
Hero Headline:    text-6xl md:text-7xl  (60px - 72px)
Section Heading:  text-5xl              (48px)
Card Title:       text-2xl              (24px)
Body Large:       text-xl               (20px)
Body:             text-base             (16px)
Small:            text-sm               (14px)
Tiny:             text-xs               (12px)
```

### Font Weights
```
Regular:  400  (body text)
Medium:   500  (labels)
Semibold: 600  (card titles)
Bold:     700  (headings)
```

---

## 🖼️ Icon Usage

### Icon Sizes
```
Feature Icons:    w-6 h-6    (24px)
Navigation Icon:  w-6 h-6    (24px)
Checkmarks:       w-5 h-5    (20px)
Status Icons:     w-5 h-5    (20px)
```

### Icon Colors
```
Primary:   text-lime-400
Success:   text-green-400
Warning:   text-orange-400
Error:     text-red-400
Info:      text-blue-400
Muted:     text-zinc-400
```

---

## 🎯 Call-to-Action Placement

### Primary CTAs (3 locations)
1. **Hero Section**: "Start for free" (most prominent)
2. **Pricing Section**: Plan-specific buttons
3. **Final CTA Section**: "Start for free" + "Contact Sales"

### Secondary CTAs
1. **Hero Section**: "View Dashboard"
2. **Navigation**: "Login"
3. **Activity Section**: "View all →"

### CTA Copy Strategy
- **Action-oriented**: "Start", "View", "Contact"
- **Value-focused**: "for free", "Free Trial"
- **Low friction**: No credit card required (implied)

---

## 💡 Visual Design Principles

### Contrast
- High contrast between text and background
- Lime-400 accent stands out against black
- White text on dark backgrounds

### Hierarchy
- Size indicates importance
- Color draws attention (lime = action)
- Spacing creates visual breathing room

### Consistency
- Repeated patterns (card style)
- Consistent spacing system
- Unified color palette

### Balance
- Symmetrical layouts (pricing, features)
- Centered headings
- Equal spacing between elements

### Simplicity
- Minimal color palette (black, white, lime)
- Clean borders, no clutter
- Clear information architecture

---

## 🖥️ Desktop View (1280px+)

```
┌────────────────────────────────────────────────────────────────┐
│ Navigation (fixed)                                             │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│                  Hero Section (centered)                       │
│              Large headline + CTAs                             │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│            Dashboard Preview (full width)                      │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Feature Grid (2 columns × 3 rows)                            │
│  [Card] [Card]                                                │
│  [Card] [Card]                                                │
│  [Card] [Card]                                                │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  How It Works (3 columns)                                     │
│  [Step 1]  [Step 2]  [Step 3]                                │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Pricing (2 columns)                                          │
│  [Starter]  [Pro ⭐]                                          │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Final CTA (centered card)                                    │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Footer (4 columns)                                           │
│  [Product] [Resources] [Company] [Legal]                      │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 📱 Mobile View (< 640px)

```
┌──────────────────────────┐
│ Nav (hamburger)          │
├──────────────────────────┤
│                          │
│    Hero                  │
│    (smaller text)        │
│    [CTA 1]              │
│    [CTA 2]              │
│                          │
├──────────────────────────┤
│  Dashboard Preview       │
│  (stacked stats)         │
├──────────────────────────┤
│  [Feature Card 1]        │
│  [Feature Card 2]        │
│  [Feature Card 3]        │
│  [Feature Card 4]        │
│  [Feature Card 5]        │
│  [Feature Card 6]        │
├──────────────────────────┤
│  [Step 1]                │
│  [Step 2]                │
│  [Step 3]                │
├──────────────────────────┤
│  [Starter Plan]          │
│  [Pro Plan]              │
├──────────────────────────┤
│  Final CTA               │
├──────────────────────────┤
│  Footer                  │
│  (2 columns)             │
└──────────────────────────┘
```

---

## ✅ Visual Checklist

Use this checklist when reviewing the design:

**Colors**
- [ ] Background is deep black (#0a0a0a)
- [ ] Accent color is lime-400 (#a3e635)
- [ ] Text contrast meets WCAG AA
- [ ] Borders are subtle (white/10%)

**Typography**
- [ ] Heading hierarchy is clear (h1 > h2 > h3)
- [ ] Font sizes scale properly on mobile
- [ ] Line height allows readability
- [ ] Monospace used for technical elements

**Layout**
- [ ] Container max-width is 7xl (1280px)
- [ ] Consistent padding (py-32 for sections)
- [ ] Grid gaps are uniform (gap-8)
- [ ] Content is centered

**Components**
- [ ] Buttons have proper hover states
- [ ] Cards have subtle backgrounds
- [ ] Icons are consistent size
- [ ] Borders are uniform thickness

**Responsive**
- [ ] Mobile: 1 column layouts
- [ ] Tablet: Adapted layouts
- [ ] Desktop: Full 2-4 column grids
- [ ] Touch targets are 44px minimum

**Accessibility**
- [ ] Color contrast is sufficient
- [ ] Focus indicators visible
- [ ] Semantic HTML used
- [ ] Alt text for images (when added)

---

**This visual guide helps you understand the complete design structure of the FlowForge landing page!** 🎨

