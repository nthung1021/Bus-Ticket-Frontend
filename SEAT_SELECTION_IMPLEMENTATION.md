# Sequential Seat Selection Implementation

## Overview
Implemented a comprehensive seat selection feature for the bus ticket booking system with visual seat map, interactive seat selection, and different seat types.

## Components Created

### 1. SeatSelectionMap Component
**Location:** `src/components/seat-selection/SeatSelectionMap.tsx`

**Features:**
- **Visual Seat Map**: Interactive grid layout showing all seats with their positions
- **Seat Types**: Support for Normal, VIP, and Business class seats with distinct styling
- **Status Indicators**: 
  - Available (green/purple/blue based on type)
  - Selected (primary color with checkmark)
  - Booked (gray with X mark)
  - Unavailable (faded gray)
- **Interactive Selection**: Click to select/deselect seats
- **Hover Tooltips**: Show seat code, type, and price on hover
- **Selection Limits**: Configurable maximum seats (default: 10)
- **Sequential Selection**: Users can select multiple seats in sequence
- **Selection Summary**: Shows selected seats with badges and total price
- **Clear All**: Quick button to deselect all seats
- **Driver Section**: Visual indicator for the driver's position
- **Aisle Support**: Configurable aisles between seat columns

**Props:**
```typescript
interface SeatSelectionMapProps {
  layoutConfig: SeatLayoutConfig;
  bookedSeats?: string[];
  onSelectionChange?: (selectedSeats: SeatInfo[]) => void;
  maxSeats?: number;
  className?: string;
}
```

## Integration with Trip Detail Page

### Changes Made to `src/app/trips/[id]/page.tsx`

1. **Added Imports:**
   - `SeatSelectionMap` component
   - `seatLayoutService` for API calls
   - `Dialog` components for modal display
   - `toast` for notifications
   - `Loader2` icon for loading states

2. **Added State Variables:**
   ```typescript
   const [seatLayout, setSeatLayout] = useState<SeatLayout | null>(null);
   const [loadingSeatLayout, setLoadingSeatLayout] = useState(false);
   const [selectedSeats, setSelectedSeats] = useState<SeatInfo[]>([]);
   const [seatDialogOpen, setSeatDialogOpen] = useState(false);
   const [busId, setBusId] = useState<string | null>(null);
   ```

3. **Added Handler Functions:**
   - `fetchSeatLayout()`: Fetches seat layout from API based on bus ID
   - `handleSeatSelectionChange()`: Updates selected seats and quantity
   - `handleBookNow()`: Opens seat selection dialog or shows error

4. **Updated Book Now Button:**
   - Added `onClick={handleBookNow}` handler
   - Shows loading state while fetching seat layout

5. **Added Seat Selection Dialog:**
   - Modal dialog with seat map
   - Cancel and Continue buttons
   - Disabled Continue button when no seats selected
   - Shows selected seat count in button text

## Design Features

### Visual Excellence
- **Gradient Backgrounds**: Smooth gradients for cards and seats
- **Hover Effects**: Scale and shadow effects on interactive elements
- **Color-Coded Seats**: 
  - Normal: Green gradient
  - VIP: Purple gradient
  - Business: Blue gradient
  - Selected: Primary color with ring effect
  - Booked: Muted gray
- **Responsive Layout**: Works on all screen sizes
- **Dark Mode Support**: Proper colors for both light and dark themes

### User Experience
- **Clear Legend**: Shows all seat types at the top
- **Visual Feedback**: Immediate response to clicks and hovers
- **Tooltips**: Detailed information on hover
- **Selection Summary**: Real-time display of selected seats and total price
- **Error Handling**: Toast notifications for errors
- **Loading States**: Spinner while fetching data

## API Integration

### Endpoints Used
- `GET /seat-layouts/bus/{busId}`: Fetch seat layout for a specific bus
- Uses existing `seatLayoutService` from `src/services/seat-layout.service.ts`

### Data Flow
1. User clicks "Book Now" on trip detail page
2. System fetches bus ID from trip data
3. Calls API to get seat layout for that bus
4. Opens dialog with visual seat map
5. User selects seats interactively
6. Selected seats are tracked in state
7. User clicks "Continue to Booking" with selected seats

## TODO Items

1. **Fetch Booked Seats**: Currently using empty array `[]` for booked seats
   - Need API endpoint to get already booked seats for a trip
   - Update `bookedSeats` prop in SeatSelectionMap

2. **Implement Booking Logic**: 
   - Create booking API call with selected seats
   - Navigate to payment/confirmation page
   - Pass selected seat information to booking flow

3. **Pricing Integration**:
   - Currently shows seat prices from layout config
   - May need to fetch dynamic pricing based on trip/date

4. **Seat Reservation Timer**:
   - Add countdown timer when seats are selected
   - Release seats if not booked within time limit

## Testing Checklist

- [ ] Seat selection works correctly
- [ ] Multiple seats can be selected
- [ ] Selected seats can be deselected
- [ ] Maximum seat limit is enforced
- [ ] Booked seats cannot be selected
- [ ] Total price calculates correctly
- [ ] Dialog opens and closes properly
- [ ] Loading states display correctly
- [ ] Error messages show for missing data
- [ ] Responsive on mobile devices
- [ ] Dark mode styling works
- [ ] Tooltips display correctly

## Files Modified/Created

### Created:
- `src/components/seat-selection/SeatSelectionMap.tsx`

### Modified:
- `src/app/trips/[id]/page.tsx`

## Dependencies Used
- `@/components/ui/button`
- `@/components/ui/card`
- `@/components/ui/badge`
- `@/components/ui/dialog`
- `@/services/seat-layout.service`
- `react-hot-toast`
- `lucide-react` (for icons)
- `@/lib/utils` (for cn function)
