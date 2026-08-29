---
name: design-digisschool-my-id
description: Clean, minimalist, modern design system based on Plus Jakarta Sans, rounded soft surfaces, OKLCH palette, and subtle elevation for Kasiready POS.
triggers:
  - "Dashboard Siswa"
  - "digisschool-my-id"
  - "design like Dashboard Siswa"
  - "clean premium pos design"
source: https://www.digisschool.my.id/dashboard
tags: ["light", "rounded", "monochrome", "compact", "sans-serif", "pos-clean"]
---

# Clean Minimalist & Premium Design System for Kasiready POS

## 1. Visual Theme & Atmosphere
- **Typography:** `Plus Jakarta Sans` for all headings, labels, prices, and body text.
- **Canvas:** Ultra-clean light background `oklch(98% .005 75)` (`#FAFAFA` / `#F8F9FA`).
- **Cards & Surfaces:** Pure white `oklch(100% 0 0)` with `16px - 20px` border radius and ultra-subtle border `oklch(92% .01 70)`.
- **Accents:** Obsidian slate `--primary` (`oklch(22% .02 60)`) paired with soft Mint/Emerald `--mint` (`oklch(88% .06 70)`).
- **Depth & Elevation:** Multi-layer tinted shadows without heavy dark spreads.

## 2. Core Tokens
```css
:root {
  --font-sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  --background: oklch(98% .005 75);
  --foreground: oklch(15% .01 60);
  --card: oklch(100% 0 0);
  --card-foreground: oklch(15% .01 60);
  --primary: oklch(22% .02 60);
  --primary-foreground: oklch(100% 0 0);
  --secondary: oklch(95% .01 70);
  --secondary-foreground: oklch(42% .04 55);
  --accent: oklch(88% .06 70);
  --accent-foreground: oklch(28% .06 55);
  --mint: oklch(88% .06 70);
  --mint-foreground: oklch(28% .06 55);
  --border: oklch(92% .01 70);
  --radius: 0.75rem;
  --radius-lg: 1.25rem;
}
```
