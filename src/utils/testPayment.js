// Test mock data for sessionStorage to debug payment flow
const mockBookingData = {
  tripId: "6f304d61-2d83-4325-b34b-63bed27407fc",
  seats: [
    {
      id: "seat-1",
      code: "A1",
      type: "normal",
      price: 250000
    }
  ],
  passengers: [
    {
      fullName: "Nguyen Van Test",
      documentId: "123456789",
      seatCode: "A1",
      documentType: "id",
      phoneNumber: "0123456789",
      email: "test@example.com"
    }
  ],
  totalPrice: 250000
};

// To test payment flow:
// 1. Open browser console on payment page
// 2. Run: sessionStorage.setItem('bookingData', JSON.stringify(mockBookingData))
// 3. Refresh page

console.log('Mock booking data:', JSON.stringify(mockBookingData, null, 2));