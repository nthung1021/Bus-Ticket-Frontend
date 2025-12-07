import api from "@/lib/api";

interface PaymentMethod {
  id: string;
  name: string;
  type: 'bank_transfer' | 'momo' | 'zalopay' | 'vnpay' | 'card';
  icon: string;
  description: string;
}

interface PaymentRequest {
  bookingId: string;
  paymentMethod: string;
  amount: number;
}

interface PaymentResponse {
  success: boolean;
  message: string;
  data?: {
    bookingId: string;
    paymentId: string;
    status: string;
    amount: number;
    transactionRef?: string;
  };
}

export class PaymentService {
  // Mock payment methods
  static getPaymentMethods(): PaymentMethod[] {
    return [
      {
        id: 'bank_transfer',
        name: 'Chuyển khoản ngân hàng',
        type: 'bank_transfer',
        icon: '🏦',
        description: 'Chuyển khoản qua tài khoản ngân hàng'
      },
      {
        id: 'momo',
        name: 'Ví MoMo',
        type: 'momo',
        icon: '💰',
        description: 'Thanh toán qua ví điện tử MoMo'
      },
      {
        id: 'zalopay',
        name: 'ZaloPay',
        type: 'zalopay',
        icon: '💳',
        description: 'Thanh toán qua ví ZaloPay'
      },
      {
        id: 'vnpay',
        name: 'VNPay',
        type: 'vnpay',
        icon: '🏧',
        description: 'Thanh toán qua VNPay'
      },
      {
        id: 'card',
        name: 'Thẻ tín dụng/ghi nợ',
        type: 'card',
        icon: '💳',
        description: 'Visa, Mastercard, JCB'
      }
    ];
  }

  // Process payment (mock implementation)
  static async processPayment(paymentRequest: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock success (90% success rate)
      const isSuccess = Math.random() > 0.1;
      
      if (isSuccess) {
        // Mock successful payment
        const transactionRef = `TXN${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
        
        return {
          success: true,
          message: 'Payment processed successfully',
          data: {
            bookingId: paymentRequest.bookingId,
            paymentId: `PAY${Date.now()}`,
            status: 'completed',
            amount: paymentRequest.amount,
            transactionRef
          }
        };
      } else {
        // Mock payment failure
        return {
          success: false,
          message: 'Payment failed. Please try again or use a different payment method.'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Payment processing error. Please try again.'
      };
    }
  }

  // Confirm payment with backend
  static async confirmPayment(bookingId: string, paymentData: any): Promise<PaymentResponse> {
    try {
      // In development mode, if it's a mock booking, return mock success
      if (process.env.NODE_ENV === 'development' && 
          (bookingId === 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee' || bookingId.startsWith('mock-'))) {
        console.log('Using mock payment confirmation for development');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
        
        return {
          success: true,
          message: 'Payment confirmed successfully (mock)',
          data: {
            bookingId: bookingId,
            paymentId: `PAY${Date.now()}`,
            status: 'paid',
            amount: paymentData.amount || 250000,
            transactionRef: paymentData.transactionRef
          }
        };
      }
      
      const response = await api.put(`/bookings/${bookingId}/confirm-payment`, paymentData);
      
      if (response.data.success) {
        return {
          success: true,
          message: response.data.message,
          data: response.data.data
        };
      } else {
        return {
          success: false,
          message: response.data.message || 'Payment confirmation failed'
        };
      }
    } catch (error: any) {
      console.error('Error confirming payment:', error);
      
      if (error.response?.status === 404) {
        return {
          success: false,
          message: 'Booking not found'
        };
      } else if (error.response?.status === 400) {
        return {
          success: false,
          message: error.response.data.message || 'Invalid payment request'
        };
      } else {
        return {
          success: false,
          message: 'Network error. Please check your connection and try again.'
        };
      }
    }
  }

  // Get payment status
  static async getPaymentStatus(bookingId: string): Promise<{ status: string; message: string; }> {
    try {
      const response = await api.get(`/bookings/${bookingId}/payment-status`);
      return response.data;
    } catch (error) {
      console.error('Error getting payment status:', error);
      return {
        status: 'unknown',
        message: 'Could not retrieve payment status'
      };
    }
  }

  // Format currency
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }

  // Validate payment amount
  static validatePaymentAmount(amount: number): boolean {
    return amount > 0 && amount <= 50000000; // Max 50M VND
  }
}

export default PaymentService;
export type { PaymentMethod, PaymentRequest, PaymentResponse };