# Wireframes Index

Generated on: 2025-11-24

## Available Templates

### Admin Dashboard Template
- **File**: [admin-dashboard-template.excalidraw](admin-dashboard-template.excalidraw)
- **Type**: Visual wireframe
- **Purpose**: Admin dashboard layout with sidebar, header, stats, charts, and tables

### User Dashboard Template
- **File**: [user-dashboard-template.excalidraw](user-dashboard-template.excalidraw)
- **Type**: Visual wireframe
- **Purpose**: User dashboard layout with travel-focused content and bookings

## Usage Instructions

### Opening Excalidraw Templates
Use the automation tools to open templates:

```bash
# Open admin dashboard template
node ../scripts/open-excalidraw.js admin-dashboard

# Open user dashboard template  
node ../scripts/open-excalidraw.js user-dashboard
```

### Generating Screenshots
Create dashboard screenshots for reference:

```bash
# From scripts directory
cd ../scripts
node take-screenshots.js
```

## Template Features

### Admin Dashboard Template
- **Layout**: 256px sidebar + 64px header + main content + 284px right sidebar
- **Components**: Stats cards, analytics charts, data tables, user management
- **Colors**: Dark sidebar (#0f172a), light content areas
- **Responsive**: Desktop-first design

### User Dashboard Template
- **Layout**: Same structure as admin but travel-focused
- **Components**: Trip overview, upcoming trips, booking history, travel tips
- **Features**: Trip cards, booking status, quick actions
- **Content**: User-centric navigation and information

## Wireframe Standards

### Grid System
- **Desktop**: 8px grid system
- **Mobile**: 4px grid system
- **Gutters**: 16px between components
- **Margins**: 24px from screen edges

### Layout Dimensions
- **Sidebar**: 256px width
- **Header**: 64px height  
- **Right Sidebar**: 284px width
- **Breakpoints**: 768px (tablet), 1280px (desktop)

### Typography Hierarchy
- **H1**: Page titles (24px)
- **H2**: Section titles (20px)
- **H3**: Subsection titles (16px)
- **Body**: Content text (14px)
- **Caption**: Helper text, labels (12px)

### Color Coding
- **Primary**: #5B5FFF (Interactive elements)
- **Accent**: #4ADE80 (Success, highlights)
- **Gray**: #374151 (Text, borders)
- **Light**: #F9FAFB (Backgrounds)
- **Dark**: #0f172a (Sidebar, dark elements)

---

*Updated wireframe index - Bus Ticket Platform v1.0*
