"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar/Sidebar";
import ProtectedRole from "@/components/ProtectedRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Eye, CheckCircle, XCircle, RefreshCw, Calendar, User, MapPin, CreditCard } from "lucide-react";
import { adminBookingService, AdminBooking } from "@/services/admin-booking.service";
import { toast } from "sonner";
import { format } from "date-fns";

export default function BookingsPage() {
  return (
    <ProtectedRole allowed={["ADMIN"]}>
      <BookingsManagement />
    </ProtectedRole>
  );
}

function BookingsManagement() {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<AdminBooking | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isStatusUpdateDialogOpen, setIsStatusUpdateDialogOpen] = useState(false);
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<"paid" | "completed" | "cancelled">("completed");
  const [refundReason, setRefundReason] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, [statusFilter, startDate, endDate]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await adminBookingService.getAllBookings({
        status: statusFilter,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setBookings(response.data);
    } catch (error) {
      toast.error("Failed to fetch bookings");
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (booking: AdminBooking) => {
    setSelectedBooking(booking);
    setIsDetailsDialogOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedBooking) return;

    try {
      await adminBookingService.updateBookingStatus(selectedBooking.id, {
        status: newStatus,
      });
      toast.success("Booking status updated successfully");
      setIsStatusUpdateDialogOpen(false);
      setSelectedBooking(null);
      fetchBookings();
    } catch (error) {
      toast.error("Failed to update booking status");
      console.error("Error updating booking status:", error);
    }
  };

  const handleProcessRefund = async () => {
    if (!selectedBooking) return;

    try {
      await adminBookingService.processRefund({
        bookingId: selectedBooking.id,
        amount: selectedBooking.totalAmount,
        reason: refundReason,
      });
      toast.success("Refund processed successfully");
      setIsRefundDialogOpen(false);
      setSelectedBooking(null);
      setRefundReason("");
      fetchBookings();
    } catch (error) {
      toast.error("Failed to process refund");
      console.error("Error processing refund:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Pending</Badge>;
      case "paid":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Paid</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Completed</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Cancelled</Badge>;
      case "expired":
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">Expired</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.bookingReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.contactEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.trip.route.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.trip.route.destination.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  // Sort by bookedAt descending (newest first)
  const sortedBookings = [...filteredBookings].sort((a, b) => 
    new Date(b.bookedAt).getTime() - new Date(a.bookedAt).getTime()
  );

  return (
    <div className="flex bg-background min-h-screen">
      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      
      <div className="flex-1 lg:ml-64 flex flex-col">
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-30 bg-background border-b border-border px-4 py-3">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 rounded-lg hover:bg-muted"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        <main className="flex-1 pt-6 lg:pt-10 px-4 sm:px-6 pb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                Booking Management
              </CardTitle>

              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                <div className="relative sm:col-span-2 lg:col-span-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search bookings..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    placeholder="Start Date"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    placeholder="End Date"
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading bookings...</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Reference</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Route</TableHead>
                        <TableHead>Departure</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Booked At</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedBookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell className="font-medium">
                            {booking.bookingReference}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {booking.user?.name || "Guest"}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {booking.contactEmail || booking.user?.email}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="h-3 w-3" />
                              <span>{booking.trip.route.origin}</span>
                              <span>→</span>
                              <span>{booking.trip.route.destination}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {format(new Date(booking.trip.departureTime), "MMM dd, HH:mm")}
                          </TableCell>
                          <TableCell>
                            {booking.totalAmount.toLocaleString()} VND
                          </TableCell>
                          <TableCell>{getStatusBadge(booking.status)}</TableCell>
                          <TableCell>
                            {format(new Date(booking.bookedAt), "MMM dd, yyyy HH:mm")}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetails(booking)}
                                className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {booking.status === "pending" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedBooking(booking);
                                    setNewStatus("paid");
                                    setIsStatusUpdateDialogOpen(true);
                                  }}
                                  className="cursor-pointer hover:bg-green-50 dark:hover:bg-green-950"
                                  title="Confirm Payment"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
                              {booking.status === "paid" && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedBooking(booking);
                                      setNewStatus("completed");
                                      setIsStatusUpdateDialogOpen(true);
                                    }}
                                    className="cursor-pointer hover:bg-green-50 dark:hover:bg-green-950"
                                    title="Mark as Completed"
                                  >
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedBooking(booking);
                                      setIsRefundDialogOpen(true);
                                    }}
                                    className="cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-950"
                                    title="Process Refund"
                                  >
                                    <RefreshCw className="h-4 w-4 text-orange-600" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {sortedBookings.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No bookings found
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Booking Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Reference</p>
                  <p className="font-medium">{selectedBooking.bookingReference}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge(selectedBooking.status)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-medium">{selectedBooking.user?.name || "Guest"}</p>
                  <p className="text-sm">{selectedBooking.contactEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="font-medium">{selectedBooking.totalAmount.toLocaleString()} VND</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Trip Information</h4>
                <div className="space-y-2">
                  <p><span className="text-muted-foreground">Route:</span> {selectedBooking.trip.route.name}</p>
                  <p><span className="text-muted-foreground">From:</span> {selectedBooking.trip.route.origin}</p>
                  <p><span className="text-muted-foreground">To:</span> {selectedBooking.trip.route.destination}</p>
                  <p><span className="text-muted-foreground">Departure:</span> {format(new Date(selectedBooking.trip.departureTime), "PPP HH:mm")}</p>
                  <p><span className="text-muted-foreground">Bus:</span> {selectedBooking.trip.bus.plateNumber} ({selectedBooking.trip.bus.model})</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Passengers ({selectedBooking.passengers?.length || 0})</h4>
                <div className="space-y-2">
                  {selectedBooking.passengers?.map((passenger) => (
                    <div key={passenger.id} className="flex justify-between items-center p-2 bg-muted rounded">
                      <div>
                        <p className="font-medium">{passenger.fullName}</p>
                        {passenger.documentId && (
                          <p className="text-sm text-muted-foreground">ID: {passenger.documentId}</p>
                        )}
                      </div>
                      <Badge variant="outline">{passenger.seatCode}</Badge>
                    </div>
                  ))}
                  {(!selectedBooking.passengers || selectedBooking.passengers.length === 0) && (
                    <p className="text-sm text-muted-foreground">No passenger information available</p>
                  )}
                </div>
              </div>

              {selectedBooking.payment && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Payment Information</h4>
                  <div className="space-y-2">
                    <p><span className="text-muted-foreground">Method:</span> {selectedBooking.payment.method}</p>
                    <p><span className="text-muted-foreground">Amount:</span> {selectedBooking.payment.amount.toLocaleString()} VND</p>
                    <p><span className="text-muted-foreground">Status:</span> {selectedBooking.payment.status}</p>
                    {selectedBooking.payment.transactionId && (
                      <p><span className="text-muted-foreground">Transaction ID:</span> {selectedBooking.payment.transactionId}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={isStatusUpdateDialogOpen} onOpenChange={setIsStatusUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Booking Status</DialogTitle>
            <DialogDescription>
              Change the status of booking {selectedBooking?.bookingReference}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={newStatus} onValueChange={(value: any) => setNewStatus(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusUpdateDialogOpen(false)} className="cursor-pointer">
              Cancel
            </Button>
            <Button onClick={handleUpdateStatus} className="cursor-pointer">
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={isRefundDialogOpen} onOpenChange={setIsRefundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription>
              Process refund for booking {selectedBooking?.bookingReference}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Refund Amount</p>
              <p className="text-lg font-bold">{selectedBooking?.totalAmount.toLocaleString()} VND</p>
            </div>
            <div>
              <label className="text-sm font-medium">Reason</label>
              <Input
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Enter refund reason..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRefundDialogOpen(false)} className="cursor-pointer">
              Cancel
            </Button>
            <Button onClick={handleProcessRefund} disabled={!refundReason} className="cursor-pointer">
              Process Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
