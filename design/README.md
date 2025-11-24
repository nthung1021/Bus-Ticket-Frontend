# Bus Ticket Platform - Design Documentation

## 📁 Folder Structure

```
/design/
├── README.md                    # This file - main design documentation
├── design-system.md             # Color tokens, typography, spacing guidelines
├── wireframes.md                # Layout wireframes and component specifications
├── mockups/                     # Dashboard screenshots and visual mockups
│   ├── admin-dashboard-light.png
│   ├── admin-dashboard-dark.png
│   ├── user-dashboard-light.png
│   ├── user-dashboard-dark.png
│   ├── login-page.png
│   └── README.md                # Screenshot index and usage guide
├── wireframes/                  # Wireframe templates and planning documents
│   ├── index.md                 # Wireframes overview and standards
│   ├── dashboard-wireframe-template.md
│   ├── component-wireframe-template.md
│   └── user-flow-template.md
├── components/                  # Component architecture documentation
│   └── component-structure.md   # Detailed component hierarchy and specs
└── scripts/                     # Automation tools for design workflow
    ├── package.json
    ├── open-excalidraw.js       # Excalidraw integration for wireframing
    ├── take-screenshots.js      # Automated dashboard screenshot generator
    └── create-wireframe.js      # Wireframe template generator
```

## 🎨 Design System

### Color Palette
Our design system uses semantic color tokens that automatically adapt between light and dark themes:

- **Primary**: `#5B5FFF` - Brand color, interactive elements
- **Accent**: `#4ADE80` - Success states, highlights  
- **Background**: Adaptive white/dark
- **Foreground**: Adaptive dark/light text
- **Card**: Elevated surface backgrounds
- **Muted**: Secondary text and subtle elements
- **Border**: Dividers and component outlines

[📖 Full Design System Documentation](design-system.md)

### Typography Scale
```css
text-h1: 2rem (32px) - Page titles
text-h2: 1.75rem (28px) - Section titles
text-h3: 1.5rem (24px) - Subsection titles
text-h4: 1.25rem (20px) - Component titles
text-h5: 1.125rem (18px) - Small headings
text-h6: 1rem (16px) - Base headings
text-body: 1rem (16px) - Body content
text-caption: 0.875rem (14px) - Helper text
```

### Spacing Scale
Using Tailwind's standard spacing scale (4px base unit):
- **Small gaps**: 4px, 8px, 12px
- **Medium gaps**: 16px, 24px, 32px  
- **Large gaps**: 48px, 64px, 96px

## 📐 Wireframes & Layouts

### Dashboard Layouts

#### Admin Dashboard
- **Sidebar**: 256px fixed navigation
- **Header**: 64px with title, search, notifications
- **Stats Grid**: 4-column responsive stat cards
- **Charts**: Bar charts, line charts, pie charts using Recharts
- **Data Table**: Bookings management with actions

#### User Dashboard  
- **Travel Overview**: Personal booking statistics
- **Upcoming Trips**: Trip cards with route visualization
- **Booking History**: Tabular booking data
- **Quick Actions**: Booking, support, and utility functions

[📖 Full Wireframe Documentation](wireframes.md)

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 768px (single column, collapsible navigation)
- **Tablet**: 768px - 1279px (two columns, overlay navigation)
- **Desktop**: 1280px+ (full sidebar, multi-column layout)

### Component Adaptation
- **StatCards**: 4 → 2 → 1 columns
- **Charts**: Side-by-side → stacked
- **Tables**: Horizontal scroll → card layout
- **Sidebar**: Always visible → overlay → hidden

## 🔧 Automation Tools

### Quick Start
```bash
cd design/scripts
npm run setup     # First-time setup (installs dependencies)

# Generate wireframe templates
npm run wireframe

# Open Excalidraw for visual wireframing  
npm run excalidraw dashboard

# Capture dashboard screenshots (requires dev server)
npm run screenshot
```

### Troubleshooting Setup

If you encounter dependency issues:
```bash
# Clean install with compatible versions
cd design/scripts
rm -rf node_modules package-lock.json
npm install
```

Common issues:
- **ESM Import Errors**: Fixed with CommonJS-compatible versions (chalk@4.1.2, open@8.4.2)
- **Puppeteer Issues**: Ensure sufficient system resources and network access
- **Screenshot Failures**: Start Next.js dev server with `cd ../../ && npm run dev`

### Available Scripts

#### 1. Wireframe Generator
```bash
npm run wireframe
```
Creates structured Markdown templates with ASCII wireframes for quick planning.

#### 2. Excalidraw Integration  
```bash
npm run excalidraw [template]
```
Opens Excalidraw with pre-configured templates:
- `dashboard` - Dashboard layout template
- `components` - Individual component mockups
- `flows` - User journey diagrams
- `mobile` - Mobile layout template

#### 3. Screenshot Generator
```bash
npm run screenshot
```
Automatically captures dashboard screenshots in multiple formats:
- **PNG**: For documentation and sharing
- **WebP**: For web-optimized usage
- **Themes**: Both light and dark mode variants

## 📊 Dashboard Screenshots

### Available Mockups
- ✅ Admin Dashboard (Light & Dark)
- ✅ User Dashboard (Light & Dark)  
- ✅ Login Page
- ✅ Signup Page

Screenshots are automatically generated and saved in the `/mockups` folder with detailed documentation.

[📖 View Screenshot Gallery](mockups/README.md)

## 🏗️ Component Architecture

### Dashboard Components
```
App Layout
├── Admin Dashboard
│   ├── Sidebar (Navigation)
│   ├── Header (App Bar)
│   ├── StatCard (×4 metrics)
│   ├── Chart Widgets (Analytics)
│   └── Data Table (Bookings)
└── User Dashboard
    ├── UserSidebar (Navigation)  
    ├── UserHeader (App Bar)
    ├── StatCard (×3 metrics)
    ├── Trip Cards (Bookings)
    └── Quick Actions (Utilities)
```

### Shared Components
- **UI Library**: Button, Card, Input, Table, Badge, Dialog
- **Form Components**: React Hook Form integration
- **Chart Components**: Recharts integration with theme support

[📖 Full Component Documentation](components/component-structure.md)

## 🌙 Theme System

### Implementation
- **Framework**: `next-themes` for automatic theme switching
- **CSS Variables**: All colors defined as custom properties
- **Automatic Adaptation**: Components automatically adapt to theme changes
- **Chart Integration**: Dynamic colors for Recharts components

### Theme Toggle
```tsx
import { useTheme } from 'next-themes'

const { theme, setTheme } = useTheme()
```

### Dark Mode Features
- **Enhanced Borders**: Subtle borders appear in dark mode for better definition
- **Adaptive Colors**: All design tokens automatically adjust
- **Chart Colors**: Dynamic grid and element colors based on theme

## 📋 Usage Guidelines

### For Developers

1. **Color Usage**: Always use design tokens (`bg-card`, `text-foreground`) instead of hardcoded colors
2. **Typography**: Use typography classes (`text-h2`, `text-body`) instead of Tailwind size classes
3. **Spacing**: Follow the standard spacing scale using Tailwind classes
4. **Responsive**: Use mobile-first responsive design patterns

### For Designers

1. **Wireframing**: Start with generated templates, customize as needed
2. **Visual Design**: Use Excalidraw for quick mockups and concept validation
3. **Screenshots**: Use automation tools for consistent documentation
4. **Handoff**: Document all design decisions in the design system file

### For Team Members

1. **Updates**: Use automation scripts to regenerate documentation
2. **Collaboration**: Keep design files in version control
3. **Reviews**: Use screenshots for design reviews and stakeholder feedback
4. **Standards**: Follow established patterns and document any deviations

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ installed
- Next.js development server running (for screenshots)
- Modern web browser (for Excalidraw)

### Setup Process
1. **Clone Repository**: Get the latest codebase
2. **Install Dependencies**: `cd design/scripts && npm install`  
3. **Generate Templates**: `npm run wireframe`
4. **Start Designing**: Use Excalidraw or preferred design tool
5. **Document Changes**: Update relevant `.md` files
6. **Capture Screenshots**: `npm run screenshot` when ready

### Best Practices
- ✅ Use automation scripts for consistency
- ✅ Document all design decisions
- ✅ Test responsive behavior across devices
- ✅ Validate accessibility standards
- ✅ Keep design files updated with code changes

## 📚 Additional Resources

### Design Tools
- **Excalidraw**: https://excalidraw.com (Integrated)
- **Figma**: For advanced visual design
- **Tailwind CSS**: https://tailwindcss.com (Framework)
- **Recharts**: https://recharts.org (Chart library)

### Documentation References
- [Design System](design-system.md) - Complete design token reference
- [Wireframes](wireframes.md) - Layout planning and component specs
- [Component Architecture](components/component-structure.md) - Technical implementation details
- [Mockups Gallery](mockups/README.md) - Visual reference and screenshots

---

## 🤝 Contributing

### Design Updates
1. Update relevant documentation files
2. Regenerate screenshots if UI changed
3. Update wireframes for new features
4. Document new design patterns

### Automation Improvements  
1. Enhance existing scripts for better workflow
2. Add new automation for repetitive tasks
3. Update templates based on team feedback
4. Improve documentation clarity

---

**Version**: 1.0  
**Last Updated**: November 24, 2025  
**Maintainer**: Bus Ticket Platform Design Team