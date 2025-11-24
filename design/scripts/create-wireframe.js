#!/usr/bin/env node

const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');

/**
 * Wireframe Template Generator
 * Creates structured wireframe templates using ASCII art and Markdown
 */

const WIREFRAME_TEMPLATES = {
  dashboard: {
    name: 'Dashboard Layout Template',
    filename: 'dashboard-wireframe-template.md',
    content: `# Dashboard Wireframe Template

## Layout Structure
\`\`\`
┌─────────────────────────────────────────────────────────────────────────────┐
│ [LOGO] TITLE                                    [SEARCH] [NOTIFICATIONS] [👤] │ ← HEADER
├───────────────┬─────────────────────────────────────────────────────────────┤
│   SIDEBAR     │ MAIN CONTENT AREA                                           │
│               │                                                             │
│ [📊] Analytics│ ┌─ STATS SECTION ─────────────────────────────────────────┐ │
│ [📋] Reports  │ │                                                         │ │
│ [⚙️] Settings │ │ [STAT 1]  [STAT 2]  [STAT 3]  [STAT 4]                │ │
│ [👥] Users    │ │                                                         │ │
│ [🚌] Buses    │ └─────────────────────────────────────────────────────────┘ │
│               │                                                             │
│ [👤] Profile  │ ┌─ CHART SECTION ────────────────────────────────────────┐ │
│ [🚪] Logout   │ │                                                         │ │
│               │ │ [BAR CHART]        [LINE CHART]                        │ │
└───────────────┤ │                                                         │ │
                │ └─────────────────────────────────────────────────────────┘ │
                │                                                             │
                │ ┌─ DATA TABLE ───────────────────────────────────────────┐ │
                │ │ Header 1  │ Header 2  │ Header 3  │ Actions            │ │
                │ │ Data 1    │ Data 2    │ Data 3    │ [Edit] [Delete]    │ │
                │ │ Data 4    │ Data 5    │ Data 6    │ [Edit] [Delete]    │ │
                │ └─────────────────────────────────────────────────────────┘ │
                └─────────────────────────────────────────────────────────────┘
\`\`\`

## Component Breakdown

### Header (64px height)
- Logo/Brand (left)
- Search bar (center) 
- Notifications + User menu (right)

### Sidebar (256px width)
- Navigation items with icons
- User profile section
- Logout button

### Main Content
- Stats cards grid (responsive)
- Chart widgets section
- Data table with actions

## Responsive Behavior

### Desktop (1280px+)
- Full sidebar visible
- 4-column stats grid
- Side-by-side charts

### Tablet (768-1279px)
- Collapsible sidebar
- 2-column stats grid
- Stacked charts

### Mobile (<768px)
- Hidden sidebar (hamburger menu)
- 1-column stats grid
- Single chart per row

---
*Template for: ${new Date().toDateString()}*
`
  },
  
  component: {
    name: 'Component Wireframe Template',
    filename: 'component-wireframe-template.md',
    content: `# Component Wireframe Template

## StatCard Component
\`\`\`
┌─ StatCard ────────────────────┐
│ TITLE                    [🔢] │ ← Icon container (colored)
│ VALUE (Large Typography)      │ ← Primary metric
│ SUBTITLE                      │ ← Context/description
│                               │
│ [📈] +X% TREND LABEL          │ ← Optional trend indicator
└───────────────────────────────┘
\`\`\`

## Chart Widget
\`\`\`
┌─ Chart Widget ──────────────────┐
│ CHART TITLE                     │ ← Section header
│ ┌─────────────────────────────┐ │
│ │                             │ │
│ │     [CHART VISUALIZATION]   │ │ ← Recharts component
│ │                             │ │
│ │                             │ │
│ └─────────────────────────────┘ │
│ [LEGEND] [FILTERS]              │ ← Chart controls
└─────────────────────────────────┘
\`\`\`

## Data Table Row
\`\`\`
┌─ Table Row ─────────────────────────────────────────────────┐
│ [CHECKBOX] │ DATA 1 │ DATA 2 │ DATA 3 │ [STATUS] │ [ACTIONS] │
│            │        │        │        │ ✅ Active │ ⋯ Menu   │
└─────────────────────────────────────────────────────────────┘
\`\`\`

## Button Components
\`\`\`
┌─ Primary Button ─┐  ┌─ Secondary Button ─┐  ┌─ Icon Button ─┐
│ [📝] SUBMIT      │  │ CANCEL             │  │ [⚙️]           │
└──────────────────┘  └────────────────────┘  └───────────────┘
\`\`\`

## Form Layout
\`\`\`
┌─ Form Container ─────────────────┐
│ FORM TITLE                      │
│                                 │
│ Label 1                         │
│ [Input Field 1____________]     │ ← Text input
│                                 │
│ Label 2                         │
│ [Dropdown___▼]                  │ ← Select input
│                                 │
│ [☐] Checkbox Option             │ ← Checkbox
│                                 │
│ [SUBMIT] [CANCEL]               │ ← Action buttons
└─────────────────────────────────┘
\`\`\`

## Navigation Menu
\`\`\`
┌─ Sidebar Navigation ─┐
│ [🏠] Dashboard       │ ← Active state
│ [📊] Analytics       │
│ [📋] Reports         │
│ [👥] Users           │
│ [⚙️] Settings        │
│ ─────────────────────│ ← Separator
│ [👤] Profile         │
│ [🚪] Logout          │
└──────────────────────┘
\`\`\`

---
*Component library: ${new Date().toDateString()}*
`
  },
  
  userflow: {
    name: 'User Flow Template',
    filename: 'user-flow-template.md',
    content: `# User Flow Template

## Authentication Flow
\`\`\`
START → [Login Page] → [Credentials] → [Validation]
                                           ↓
                                      [Success?]
                                     ↙         ↘
                                [Dashboard]  [Error]
                                     ↓         ↓
                                [User Role]  [Retry]
                                ↙        ↘      ↓
                        [Admin View] [User View] ←┘
\`\`\`

## Booking Process (User)
\`\`\`
[User Dashboard] → [Book Ticket] → [Select Route] → [Choose Seat]
                                        ↓              ↓
                                   [Route List]   [Seat Map]
                                        ↓              ↓
                                   [Date/Time]    [Confirmation]
                                        ↓              ↓
                                   [Payment]  ←───────┘
                                        ↓
                                   [Success] → [Ticket Download]
                                        ↓
                                   [Dashboard] ← Return
\`\`\`

## Admin Management Flow
\`\`\`
[Admin Dashboard] → [Manage Section]
                         ↓
                    [Select Entity]
                  ↙      ↓      ↘
            [Routes] [Trips] [Bookings]
                ↓        ↓        ↓
            [CRUD]   [CRUD]   [View/Update]
                ↓        ↓        ↓
            [List] → [Edit] → [Save/Cancel]
                                 ↓
                            [Dashboard] ← Return
\`\`\`

## Navigation Flow
\`\`\`
[Dashboard]
    ↓
[Sidebar Navigation]
    ├─ [Analytics] → [Charts & Reports]
    ├─ [Bookings] → [Booking Management]
    ├─ [Users] → [User Management]
    ├─ [Settings] → [Configuration]
    └─ [Profile] → [User Profile]
         ↓
    [Logout] → [Login Page]
\`\`\`

## Error Handling Flow
\`\`\`
[User Action] → [Processing]
                     ↓
                [Validation]
               ↙           ↘
        [Success]      [Error]
            ↓             ↓
    [Continue Flow]  [Error Message]
                          ↓
                     [Retry Option]
                          ↓
                    [User Action] ← Loop back
\`\`\`

---
*User flows for: ${new Date().toDateString()}*
`
  }
};

async function generateWireframes() {
  console.log(chalk.blue('📐 Bus Ticket Platform - Wireframe Generator'));
  console.log(chalk.gray('─'.repeat(50)));
  
  const wireframeDir = path.join(__dirname, '..', 'wireframes');
  
  // Ensure wireframes directory exists
  try {
    await fs.access(wireframeDir);
  } catch {
    await fs.mkdir(wireframeDir, { recursive: true });
    console.log(chalk.green(`📁 Created wireframes directory`));
  }
  
  // Generate each template
  for (const [key, template] of Object.entries(WIREFRAME_TEMPLATES)) {
    const filepath = path.join(wireframeDir, template.filename);
    
    try {
      await fs.writeFile(filepath, template.content, 'utf8');
      console.log(chalk.green(`✅ Generated: ${template.name}`));
      console.log(chalk.gray(`   ${template.filename}`));
    } catch (error) {
      console.error(chalk.red(`❌ Failed to generate ${template.name}:`), error.message);
    }
  }
  
  // Generate master wireframe index
  await generateWireframeIndex(wireframeDir);
  
  console.log(chalk.cyan('\n📝 Wireframe templates generated successfully!'));
  console.log(chalk.gray(`📁 Location: ${wireframeDir}`));
  console.log('\n🎯 Next steps:');
  console.log('1. Review and customize the generated templates');
  console.log('2. Create actual wireframes using Excalidraw (npm run excalidraw)');
  console.log('3. Export wireframes as PNG/SVG files');
  console.log('4. Update wireframes.md with final designs');
}

async function generateWireframeIndex(wireframeDir) {
  const indexContent = `# Wireframes Index

Generated on: ${new Date().toISOString()}

## Available Templates

${Object.entries(WIREFRAME_TEMPLATES).map(([key, template]) => 
  `### ${template.name}
- **File**: [${template.filename}](${template.filename})
- **Type**: ${key}
- **Purpose**: Template for creating ${key} wireframes

`).join('')}

## Usage Instructions

### 1. Text-based Wireframes
Use the Markdown templates above for quick documentation and planning.

### 2. Visual Wireframes
For visual wireframes, use the automation tools:

\`\`\`bash
# Open Excalidraw with dashboard template
npm run excalidraw dashboard

# Open Excalidraw with component template  
npm run excalidraw components

# Open Excalidraw for user flows
npm run excalidraw flows
\`\`\`

### 3. Screenshots
Generate dashboard screenshots:

\`\`\`bash
npm run screenshot
\`\`\`

## Wireframe Standards

### Grid System
- **Desktop**: 8px grid system
- **Mobile**: 4px grid system
- **Gutters**: 16px between components
- **Margins**: 24px from screen edges

### Typography Hierarchy
- **H1**: Page titles
- **H2**: Section titles  
- **H3**: Subsection titles
- **Body**: Content text
- **Caption**: Helper text, labels

### Color Coding
- **Primary**: #5B5FFF (Interactive elements)
- **Accent**: #4ADE80 (Success, highlights)
- **Gray**: #374151 (Text, borders)
- **Light**: #F9FAFB (Backgrounds)

---

*Auto-generated wireframe index*
`;

  const indexPath = path.join(wireframeDir, 'index.md');
  await fs.writeFile(indexPath, indexContent, 'utf8');
  console.log(chalk.green(`📄 Generated wireframes index`));
}

// Command line interface
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(chalk.blue('📐 Wireframe Generator'));
  console.log(chalk.gray('─'.repeat(30)));
  console.log('\nUsage:');
  console.log('  npm run wireframe');
  console.log('\nTemplates:');
  Object.entries(WIREFRAME_TEMPLATES).forEach(([key, template]) => {
    console.log(chalk.cyan(`  ${key.padEnd(12)} ${template.name}`));
  });
  console.log('\nOutput:');
  console.log('  • Markdown templates with ASCII wireframes');
  console.log('  • Ready-to-edit structured layouts');
  console.log('  • Integration with Excalidraw workflows');
} else {
  generateWireframes().catch(error => {
    console.error(chalk.red('💥 Generation failed:'), error);
    process.exit(1);
  });
}

module.exports = {
  generateWireframes,
  WIREFRAME_TEMPLATES
};