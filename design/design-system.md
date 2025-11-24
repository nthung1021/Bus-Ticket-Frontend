# Bus Ticket System - Design System Documentation

## Overview
This document outlines the complete design system for the Bus Ticket Booking Platform, including color tokens, typography scale, spacing guidelines, and component specifications.

## Color Palette & Design Tokens

### Primary Color System
```css
/* Light Theme */
--background: oklch(0.98 0 0);           /* #FEFEFE - Main background */
--foreground: oklch(0.16 0 0);           /* #292929 - Primary text */
--card: oklch(1 0 0);                    /* #FFFFFF - Card backgrounds */
--card-foreground: oklch(0.16 0 0);      /* #292929 - Card text */
--primary: oklch(0.55 0.25 260);         /* #5B5FFF - Brand primary */
--primary-foreground: oklch(1 0 0);      /* #FFFFFF - Primary text */
--secondary: oklch(0.93 0.02 260);       /* #F1F2FF - Secondary backgrounds */
--muted: oklch(0.92 0 0);                /* #EBEBEB - Muted elements */
--muted-foreground: oklch(0.45 0 0);     /* #737373 - Muted text */
--accent: oklch(0.6 0.25 120);           /* #4ADE80 - Success/accent color */
--destructive: oklch(0.63 0.25 30);      /* #EF4444 - Error/danger color */
--border: oklch(0.92 0 0);               /* #EBEBEB - Border color */
--input: oklch(0.92 0 0);                /* #EBEBEB - Input backgrounds */

/* Dark Theme */
--background: oklch(0.145 0 0);          /* #252525 - Main background */
--foreground: oklch(0.985 0 0);          /* #FBFBFB - Primary text */
--card: oklch(0.2 0 0);                  /* #333333 - Card backgrounds */
--card-foreground: oklch(0.985 0 0);     /* #FBFBFB - Card text */
--primary: oklch(0.6 0.25 260);          /* #6366F1 - Brand primary (adjusted) */
--muted: oklch(0.3 0 0);                 /* #4D4D4D - Muted elements */
--muted-foreground: oklch(0.7 0 0);      /* #B3B3B3 - Muted text */
--accent: oklch(0.6 0.25 120);           /* #4ADE80 - Success/accent color */
--border: oklch(0.3 0 0);                /* #4D4D4D - Border color */
--input: oklch(0.3 0 0);                 /* #4D4D4D - Input backgrounds */
```

### Chart Color Tokens
```css
--chart-1: oklch(0.55 0.25 260);         /* #5B5FFF - Primary chart color */
--chart-2: oklch(0.6 0.25 120);          /* #4ADE80 - Secondary chart color */
--chart-3: oklch(0.5 0.2 30);            /* #F97316 - Tertiary chart color */
--chart-4: oklch(0.65 0.2 200);          /* #3B82F6 - Quaternary chart color */
--chart-5: oklch(0.7 0.15 50);           /* #EAB308 - Quinary chart color */
--chart-grid: oklch(0.9 0 0);            /* Light theme grid */
/* Dark theme: oklch(0.35 0 0) */        /* Dark theme grid */
```

### Sidebar Color System
```css
--sidebar: oklch(22.532% 0.05799 254.304);      /* #1A1A2E - Sidebar background */
--sidebar-foreground: oklch(1 0 0);              /* #FFFFFF - Sidebar text */
--sidebar-primary: oklch(0.55 0.25 260);         /* #5B5FFF - Sidebar highlights */
--sidebar-accent: oklch(0.93 0.02 260);          /* #F1F2FF - Sidebar accent */
--sidebar-border: oklch(0.25 0 0);               /* #404040 - Sidebar borders */
```

## Typography System

### Font Configuration
```css
--font-sans: "Geist", "Geist Fallback";
--font-mono: "Geist Mono", "Geist Mono Fallback";
```

### Typography Scale & Classes
```css
/* Typography Tokens */
--fs-h1: 2rem;        /* 32px */
--fs-h2: 1.75rem;     /* 28px */
--fs-h3: 1.5rem;      /* 24px */
--fs-h4: 1.25rem;     /* 20px */
--fs-h5: 1.125rem;    /* 18px */
--fs-h6: 1rem;        /* 16px */
--fs-body: 1rem;      /* 16px */
--fs-caption: 0.875rem; /* 14px */
```

### Typography Classes
```css
.text-h1 { font-size: 2rem; font-weight: 700; line-height: 1.2; }
.text-h2 { font-size: 1.75rem; font-weight: 700; line-height: 1.25; }
.text-h3 { font-size: 1.5rem; font-weight: 600; line-height: 1.3; }
.text-h4 { font-size: 1.25rem; font-weight: 600; line-height: 1.35; }
.text-h5 { font-size: 1.125rem; font-weight: 500; line-height: 1.4; }
.text-h6 { font-size: 1rem; font-weight: 500; line-height: 1.45; }
.text-body { font-size: 1rem; line-height: 1.6; }
.text-caption { font-size: 0.875rem; opacity: 0.85; line-height: 1.4; }
```

## Spacing Scale

### Tailwind Spacing Scale (Used Throughout)
```css
/* Standard Tailwind spacing scale */
0.5 = 0.125rem = 2px
1   = 0.25rem  = 4px
1.5 = 0.375rem = 6px
2   = 0.5rem   = 8px
2.5 = 0.625rem = 10px
3   = 0.75rem  = 12px
3.5 = 0.875rem = 14px
4   = 1rem     = 16px
5   = 1.25rem  = 20px
6   = 1.5rem   = 24px
8   = 2rem     = 32px
10  = 2.5rem   = 40px
12  = 3rem     = 48px
16  = 4rem     = 64px
20  = 5rem     = 80px
24  = 6rem     = 96px
```

### Common Spacing Patterns
- **Card padding**: `p-4` (16px) on mobile, `md:p-6` (24px) on desktop
- **Section margins**: `mb-6` (24px) for section spacing
- **Button padding**: `py-3 px-4` (12px vertical, 16px horizontal)
- **Input padding**: `py-1 px-3` (4px vertical, 12px horizontal)
- **Gap spacing**: `gap-4` (16px) for card grids, `gap-6` (24px) for sections

## Component Specifications

### Dashboard Layout
```
┌─ Sidebar (256px fixed) ─┬─ Main Content (flex-1) ─┐
│ Logo                    │ Header (64px fixed)      │
│ Navigation Menu         │                          │
│ User Profile            │ Content Area             │
│ Logout                  │ (scrollable)             │
└─────────────────────────┴──────────────────────────┘
```

### Card Component Structure
```css
.card {
  @apply bg-card rounded-md shadow-sm border border-border;
  min-height: 160px;
  padding: 16px; /* p-4 */
  
  /* Dark mode enhancement */
  border-color: transparent !important; /* Light mode */
}

.dark .card {
  border-color: rgb(55 65 81) !important; /* Dark mode */
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.3);
}
```

### StatCard Component
- **Background**: `bg-card`
- **Padding**: `p-4`
- **Icon container**: Colored background (`bg-primary`, `bg-accent`, `bg-secondary`)
- **Title**: `text-caption text-muted-foreground`
- **Value**: `text-h3 text-card-foreground`
- **Subtitle**: `text-caption text-muted-foreground`

## Responsive Design Breakpoints

### Tailwind Breakpoints Used
```css
sm:  640px   /* Small tablets */
md:  768px   /* Large tablets */
lg:  1024px  /* Small desktops */
xl:  1280px  /* Large desktops */
2xl: 1536px  /* Extra large screens */
```

### Layout Adaptations
- **Mobile**: Single column layout, sidebar collapses
- **Tablet**: Two-column layout where appropriate
- **Desktop**: Full sidebar + two-column content
- **Large screens**: Optimized spacing and typography

## Accessibility Guidelines

### Color Contrast
- All color combinations meet WCAG AA standards
- Text on backgrounds maintains 4.5:1 contrast ratio
- Interactive elements have sufficient contrast in all states

### Focus States
- All interactive elements have visible focus indicators
- Focus rings use `ring-ring` token with 3px width
- Keyboard navigation supported throughout

### Typography
- Minimum 16px font size for body text
- Adequate line height for readability (1.4-1.6)
- Semantic heading structure maintained

## Usage Examples

### Using Color Tokens
```tsx
// Correct usage
<div className="bg-card text-card-foreground border border-border">
  <h2 className="text-h2">Dashboard</h2>
  <p className="text-caption text-muted-foreground">Overview</p>
</div>

// Avoid hardcoded values
<div className="bg-white text-black border border-gray-200"> // ❌
```

### Using Typography Classes
```tsx
// Correct usage
<h1 className="text-h1">Main Title</h1>
<h2 className="text-h2">Section Title</h2>
<p className="text-body">Body text content</p>
<small className="text-caption">Caption or helper text</small>

// Avoid hardcoded typography
<h1 className="text-3xl font-bold">Main Title</h1> // ❌
```

### Using Spacing
```tsx
// Consistent spacing patterns
<div className="p-4 md:p-6 space-y-6">
  <section className="mb-6">
    <h2 className="text-h2 mb-4">Section</h2>
    <div className="grid gap-4 md:gap-6">
      // Content
    </div>
  </section>
</div>
```

## Theme Implementation

### Light/Dark Mode Setup
The design system supports automatic theme switching using `next-themes`:

```tsx
import { useTheme } from 'next-themes'

// Theme toggle component
const { theme, setTheme } = useTheme()
```

### CSS Variables Approach
All colors are defined as CSS custom properties that automatically adapt to the current theme, ensuring consistent theming throughout the application.

---

*Last updated: November 24, 2025*
*Version: 1.0*