"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Clock, 
  Bus, 
  User, 
  CreditCard,
  Phone,
  Mail,
  IdCard,
  ArmchairIcon,
  X,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import UserBookingService, { type Booking } from "@/services/userBookingService";
import { formatCurrency } from "@/utils/formatCurrency";

export default function BookingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;
  
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const bookingService = new UserBookingService();

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await bookingService.getBookingById(bookingId);
        setBooking(data);
      } catch (error) {
        console.error('Error fetching booking:', error);
        setError(error instanceof Error ? error.message : 'Failed to load booking details');
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId]);

  const handleCancelBooking = () => {
    setShowCancelDialog(true);
  };

  const confirmCancelBooking = async () => {
    if (!booking) return;

    setIsCancelling(true);
    setShowCancelDialog(false);
    
    try {
      await bookingService.cancelBooking(booking.id);
      // Refresh booking data to show updated status
      const updatedBooking = await bookingService.getBookingById(booking.id);
      setBooking(updatedBooking);
      alert('Đã hủy vé thành công! Chúng tôi sẽ xử lý hoàn tiền trong vòng 3-5 ngày làm việc.');
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert(`Lỗi khi hủy vé: ${error instanceof Error ? error.message : 'Vui lòng thử lại sau'}`);
    } finally {
      setIsCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto p-6 text-center">
          <h2 className="text-h3 mb-4">Booking Not Found</h2>
          <p className="text-muted-foreground mb-6">
            {error || "The booking you're looking for doesn't exist or you don't have access to it."}
          </p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => router.back()}>
              Go Back
            </Button>
            <Button asChild>
              <Link href="/user/bookings ">My Bookings</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4 lg:px-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/user/bookings " className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to My Bookings
              </Link>
            </Button>
            <div className="h-6 w-px bg-border"></div>
            <div>
              <h1 className="text-h2 font-semibold">Booking Details</h1>
              <p className="text-sm text-muted-foreground">
                #{booking.id.slice(-8).toUpperCase()}
              </p>
            </div>
          </div>
          
          <Badge className={UserBookingService.getStatusColor(booking.status)}>
            {UserBookingService.getStatusLabel(booking.status)}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Trip Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bus className="w-5 h-5" />
                  Trip Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <MapPin className="w-4 h-4" />
                      Route
                    </div>
                    <p className="font-semibold text-lg">
                      {booking.trip.route.origin} → {booking.trip.route.destination}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {booking.trip.route.name}
                    </p>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Calendar className="w-4 h-4" />
                      Departure Date
                    </div>
                    <p className="font-semibold">
                      {format(new Date(booking.trip.departureTime), 'EEEE, MMMM d, yyyy')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(booking.trip.departureTime), 'h:mm a')}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Bus className="w-4 h-4" />
                      Bus Details
                    </div>
                    <p className="font-medium">{booking.trip.bus.model}</p>
                    <p className="text-sm text-muted-foreground">{booking.trip.bus.plateNumber}</p>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Clock className="w-4 h-4" />
                      Duration
                    </div>
                    <p className="font-medium">
                      {Math.floor(booking.trip.route.estimatedMinutes / 60)}h {booking.trip.route.estimatedMinutes % 60}m
                    </p>
                    <p className="text-sm text-muted-foreground">{booking.trip.route.distanceKm} km</p>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <ArmchairIcon className="w-4 h-4" />
                      <span>Seats</span>
                    </div>
                    <p className="font-medium">{booking.seats.length} seat{booking.seats.length > 1 ? 's' : ''}</p>
                    <p className="text-sm text-muted-foreground">
                      {booking.seats.map(s => s.seat?.seatCode).join(', ')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Passengers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Passenger Information ({booking.passengers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {booking.passengers.map((passenger, index) => {
                    const seat = booking.seats[index]?.seat;
                    return (
                      <div key={passenger.id} className="p-4 border rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{passenger.fullName}</h4>
                              <Badge variant="outline">
                                Seat {seat?.seatCode}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <IdCard className="w-4 h-4" />
                              <span>ID: {passenger.documentId}</span>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Seat Type</p>
                            <p className="font-medium capitalize">{seat?.seatType || 'Standard'}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Summary */}
          <div className="space-y-6">
            {/* Payment Summary */}
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Seat charges ({booking.seats.length} seat{booking.seats.length > 1 ? 's' : ''})</span>
                    <span>{formatCurrency(booking.totalAmount)}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between font-semibold text-lg">
                  <span>Total Amount</span>
                  <span className="text-primary">{formatCurrency(booking.totalAmount)}</span>
                </div>

                {booking.status === 'pending' && UserBookingService.canPayBooking(booking) && (
                  <Button className="w-full" asChild>
                    <Link href={`/payment?tripId=${booking.tripId}&bookingId=${booking.id}`}>
                      Complete Payment
                    </Link>
                  </Button>
                )}

                {UserBookingService.canCancelBooking(booking) && (
                  <Button 
                    variant="destructive" 
                    className="w-full flex items-center gap-1"
                    onClick={handleCancelBooking}
                    disabled={isCancelling}
                  >
                    {isCancelling ? 'Cancelling...' : 'Cancel Booking'}
                  </Button>
                )}

                {/* Show cancellation notice if booking is pending/paid but cannot be cancelled */}
                {(booking.status === 'pending' || booking.status === 'paid') && !UserBookingService.canCancelBooking(booking) && (
                  <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      <strong>Lưu ý:</strong> Không thể hủy vé trong vòng 6 tiếng trước giờ khởi hành.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Booking Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Booking Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="font-medium text-sm">Booking Created</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(booking.bookedAt), 'PPp')}
                      </p>
                    </div>
                  </div>

                  {booking.status === 'paid' && (
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <p className="font-medium text-sm">Payment Completed</p>
                        <p className="text-xs text-muted-foreground">Payment confirmed</p>
                      </div>
                    </div>
                  )}

                  {booking.cancelledAt && (
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <p className="font-medium text-sm">Booking Cancelled</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(booking.cancelledAt), 'PPp')}
                        </p>
                      </div>
                    </div>
                  )}

                  {booking.status === 'pending' && booking.expiresAt && (
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <p className="font-medium text-sm">Payment Deadline</p>
                        <p className="text-xs text-muted-foreground">
                          Expires: {format(new Date(booking.expiresAt), 'PPp')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Cancel Confirmation Dialog */}
        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Xác nhận hủy vé
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <p className="text-muted-foreground text-sm">
                Bạn có chắc chắn muốn hủy vé này không?
              </p>
              
              {booking && (
                <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Chuyến đi:</span>
                    <span className="font-medium">{booking.trip.route.origin} → {booking.trip.route.destination}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ngày khởi hành:</span>
                    <span className="font-medium">{format(new Date(booking.trip.departureTime), 'dd/MM/yyyy')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Số tiền:</span>
                    <span className="font-medium text-primary">{formatCurrency(booking.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Số ghế:</span>
                    <span className="font-medium">{booking.seats.length} ghế</span>
                  </div>
                </div>
              )}
              
              <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Lưu ý:</strong> Sau khi hủy vé, tiền sẽ được hoàn lại trong vòng 3-5 ngày làm việc. 
                  Hành động này không thể hoàn tác. Vé chỉ có thể hủy trước 6 tiếng so với giờ khởi hành.
                </p>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setShowCancelDialog(false)}
                disabled={isCancelling}
              >
                Giữ vé
              </Button>
              <Button
                variant="destructive"
                onClick={confirmCancelBooking}
                disabled={isCancelling}
                className="flex items-center gap-1"
              >
                {isCancelling ? (
                  <>
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    Đang hủy...
                  </>
                ) : (
                  <>
                    <X className="h-3 w-3" />
                    Xác nhận hủy
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}