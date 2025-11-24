# Component Architecture & Structure

## Overview
This document outlines the component hierarchy, dependencies, and architectural patterns used in the Bus Ticket Booking Platform.

## Component Tree Structure

```
App (layout.tsx)
├── Providers (providers.tsx)
│   ├── ThemeProvider (next-themes)
│   └── QueryClient (react-query)
│
├── Authentication Pages
│   ├── LoginClient
│   │   ├── GoogleSignInButton
│   │   └── Form Components
│   └── SignUpClient
│       └── Form Components
│
├── Admin Dashboard (admin/page.tsx)
│   ├── Sidebar
│   │   ├── Navigation Menu
│   │   ├── Logo Component
│   │   └── User Profile Section
│   ├── Header
│   │   ├── Title
│   │   ├── Notifications
│   │   └── User Menu
│   ├── StatCard (×4)
│   │   ├── Icon Container
│   │   ├── Text Content
│   │   └── Trend Indicator
│   ├── Chart Widgets
│   │   ├── BarChart (Recharts)
│   │   ├── LineChart (Recharts)
│   │   └── PieChart (Recharts)
│   ├── Data Table
│   │   ├── Table Header
│   │   ├── Table Body
│   │   └── Status Badges
│   └── Quick Actions Panel
│       └── Action Buttons
│
├── User Dashboard (user/page.tsx)
│   ├── UserSidebar
│   │   ├── Navigation Menu
│   │   ├── Logo Component
│   │   └── Footer Info
│   ├── UserHeader
│   │   ├── Title
│   │   ├── Notifications
│   │   └── User Menu
│   ├── StatCard (×3)
│   ├── Trip Cards
│   │   ├── Route Visualization
│   │   ├── Trip Details
│   │   └── Status Badge
│   ├── Booking Table
│   └── Quick Actions Sidebar
│       ├── Action Buttons
│       ├── Travel Tips
│       └── Support Links
│
└── Shared UI Components (/components/ui)
    ├── Button
    ├── Card
    ├── Input
    ├── Label
    ├── Table
    ├── Badge
    ├── Dialog
    ├── Dropdown
    ├── Toast/Toaster
    ├── Tabs
    ├── Switch
    └── Form Components
```

## Component Dependencies

### Core Dependencies
```typescript
// Layout & Styling
- next: 16.0.3
- tailwindcss: 4.1.17
- next-themes: 0.4.6

// UI Components
- lucide-react: Icons
- recharts: Chart components
- react-hook-form: Form handling
- react-hot-toast: Notifications

// State Management
- @tanstack/react-query: Server state
```

### Component Relationship Map
```
┌─ Layout Components ──────────────────┐
│ App Layout                           │
│ ├─ Sidebar/UserSidebar (Navigation)  │
│ ├─ Header/UserHeader (App Bar)       │
│ └─ Main Content Area                 │
└──────────────────────────────────────┘
           ↓ Contains
┌─ Dashboard Components ───────────────┐
│ ├─ StatCard (Data Display)           │
│ ├─ Chart Widgets (Analytics)         │
│ ├─ Data Tables (Lists)               │
│ └─ Action Panels (Controls)          │
└──────────────────────────────────────┘
           ↓ Uses
┌─ Shared UI Components ───────────────┐
│ ├─ Button (Actions)                  │
│ ├─ Card (Containers)                 │
│ ├─ Table (Data Display)              │
│ ├─ Badge (Status Indicators)         │
│ └─ Form Controls (Inputs)            │
└──────────────────────────────────────┘
```

## Detailed Component Specifications

### 1. StatCard Component
```typescript
interface StatCardProps {
  title: string
  value: string
  subtitle: string
  icon?: React.ReactNode
  trend?: number
  trendLabel?: string
  bgColor?: string
}

// Usage Pattern:
<StatCard
  title="Total Routes"
  value="260,200"
  subtitle="3 Admin"
  icon={<Route className="w-6 h-6" />}
  bgColor="bg-primary"
/>
```

**File Location**: `src/components/dashboard/StatCard/StatCard.tsx`
**CSS Module**: `src/components/dashboard/StatCard/StatCard.module.css`

### 2. Sidebar Components
```typescript
// Admin Sidebar
interface SidebarProps {
  // Static navigation component
}

// User Sidebar
interface UserSidebarProps {
  // User-specific navigation
}
```

**File Locations**: 
- `src/components/dashboard/Sidebar/Sidebar.tsx`
- `src/components/dashboard/UserSidebar/UserSidebar.tsx`

### 3. Chart Components
```typescript
// Uses Recharts library
import { BarChart, LineChart, PieChart } from 'recharts'

// Data interfaces
interface ChartDataPoint {
  name: string
  value: number
  fill?: string
}
```

**Integration**: Embedded directly in dashboard pages with theme-aware colors

### 4. Form Components
```typescript
// React Hook Form integration
interface LoginFormData {
  email: string
  password: string
}

interface SignUpFormData {
  name: string
  email: string
  phone: string
  password: string
  confirmPassword: string
}
```

**File Locations**:
- `src/app/login/LoginClient.tsx`
- `src/app/signup/SignUpClient.tsx`

## State Management Architecture

### Theme State
```typescript
// Global theme state using next-themes
const { theme, setTheme } = useTheme()

// CSS variable-based theming
:root { /* light theme variables */ }
.dark { /* dark theme variables */ }
```

### Authentication State
```typescript
// Custom hooks for auth
const { mutate: login, isPending } = useLogin()
const { mutate: signup } = useSignup()

// Protected route pattern
useEffect(() => {
  // Route protection logic
}, [router])
```

### Form State
```typescript
// React Hook Form for form management
const {
  register,
  handleSubmit,
  formState: { errors },
  setError
} = useForm<FormData>()
```

## Styling Architecture

### CSS Module Pattern
```css
/* Component.module.css */
.componentName {
  @apply bg-card rounded-md p-4;
}

.elementName {
  @apply text-foreground font-medium;
}
```

### Design Token Usage
```tsx
// Preferred approach - using design tokens
<div className="bg-card text-card-foreground border border-border">
  <h2 className="text-h2">Title</h2>
  <p className="text-caption text-muted-foreground">Subtitle</p>
</div>

// Avoid hardcoded values
<div className="bg-white text-black border border-gray-200"> {/* ❌ */}
```

### Responsive Design Pattern
```tsx
// Mobile-first responsive design
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
  {/* StatCards */}
</div>

// Typography scaling
<h1 className="text-lg md:text-xl font-bold">
  // ❌ Avoid this pattern
</h1>

<h1 className="text-h2">
  // ✅ Use design token classes
</h1>
```

## Component Communication Patterns

### Parent-Child Communication
```typescript
// Props down, callbacks up pattern
interface ChildProps {
  data: DataType
  onAction: (id: string) => void
}

// Parent component
<Child data={data} onAction={handleAction} />
```

### Global State Sharing
```typescript
// Theme context for global theme state
const ThemeProvider = ({ children }) => {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system">
      {children}
    </NextThemesProvider>
  )
}

// Query client for server state
<QueryClientProvider client={queryClient}>
  <App />
</QueryClientProvider>
```

## Performance Considerations

### Component Optimization
```typescript
// Memoization for expensive computations
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data)
}, [data])

// Callback memoization
const handleClick = useCallback((id: string) => {
  // Handle click logic
}, [dependency])
```

### Code Splitting
```typescript
// Dynamic imports for large components
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
  ssr: false
})
```

### Image Optimization
```typescript
// Next.js Image component
import Image from 'next/image'

<Image
  src="/dashboard-screenshot.png"
  alt="Dashboard"
  width={800}
  height={600}
  priority
/>
```

## Error Handling Patterns

### Form Error Handling
```typescript
// Form-level error handling
try {
  await submitForm(data)
} catch (error) {
  setError('root', {
    type: 'manual',
    message: error.message
  })
}
```

### Async Operation Handling
```typescript
// Using react-query for error handling
const { data, error, isLoading } = useQuery({
  queryKey: ['bookings'],
  queryFn: fetchBookings,
  onError: (error) => {
    toast.error(error.message)
  }
})
```

## Testing Strategy

### Component Testing
```typescript
// Jest + React Testing Library
import { render, screen } from '@testing-library/react'
import { StatCard } from './StatCard'

test('renders stat card with data', () => {
  render(<StatCard title="Test" value="100" subtitle="units" />)
  expect(screen.getByText('Test')).toBeInTheDocument()
})
```

### Integration Testing
```typescript
// End-to-end testing with Playwright/Cypress
test('dashboard navigation', async () => {
  await page.goto('/dashboard')
  await page.click('[data-testid="sidebar-bookings"]')
  await expect(page).toHaveURL(/.*bookings/)
})
```

---

## File Structure Summary

```
src/
├── app/
│   ├── admin/page.tsx (Admin Dashboard)
│   ├── user/page.tsx (User Dashboard)
│   ├── login/LoginClient.tsx
│   └── signup/SignUpClient.tsx
├── components/
│   ├── dashboard/
│   │   ├── StatCard/
│   │   ├── Sidebar/
│   │   ├── Header/
│   │   └── UserSidebar/
│   └── ui/ (Shared components)
├── hooks/
│   └── useAuth.ts
├── lib/
│   ├── utils.ts
│   └── api.ts
└── styles/
    ├── globals.css
    └── typography.css
```

---

*Last updated: November 24, 2025*
*Component architecture for Bus Ticket Platform v1.0*