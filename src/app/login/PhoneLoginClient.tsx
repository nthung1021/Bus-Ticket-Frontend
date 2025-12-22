"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCurrentUser } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Phone, Shield, ArrowLeft, Loader2 } from "lucide-react";

type PhoneFormData = {
  phone: string;
};

type OtpFormData = {
  otp: string;
};

interface OtpResponse {
  success: boolean;
  message: string;
  data: {
    phone: string;
    expiresAt: string;
    otp?: string; // DEV mode only
  };
}

interface VerifyResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      userId: string;
      phone: string;
      fullName: string;
      email?: string;
      role: string;
    };
  };
}

export default function PhoneLoginClient() {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpExpires, setOtpExpires] = useState<Date | null>(null);
  const [devOtp, setDevOtp] = useState<string>(''); // DEV mode helper
  
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const phoneForm = useForm<PhoneFormData>();
  const otpForm = useForm<OtpFormData>();

  const handleSendOtp = async (data: PhoneFormData) => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await api.post<OtpResponse>('/auth/phone/send-otp', {
        phone: data.phone,
      });
      
      if (response.data.success) {
        setPhoneNumber(data.phone);
        setOtpExpires(new Date(response.data.data.expiresAt));
        setStep('otp');
        
        // DEV mode: Show OTP in console and state for easy testing
        if (response.data.data.otp) {
          setDevOtp(response.data.data.otp);
          console.log(`[DEV MODE] OTP for ${data.phone}: ${response.data.data.otp}`);
          toast.success(`OTP sent! (DEV: ${response.data.data.otp})`, { duration: 8000 });
        } else {
          toast.success('OTP sent successfully!');
        }
      }
    } catch (error: any) {
      console.error('Send OTP error:', error);
      setError(error.response?.data?.message || 'Failed to send OTP. Please try again.');
      toast.error('Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (data: OtpFormData) => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await api.post<VerifyResponse>('/auth/phone/verify-otp', {
        phone: phoneNumber,
        otp: data.otp,
      });
      
      if (response.data.success) {
        // Invalidate auth queries to refresh user state
        await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
        
        toast.success('Login successful!');
        router.push('/');
      }
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      setError(error.response?.data?.message || 'Invalid OTP. Please try again.');
      toast.error('OTP verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToPhone = () => {
    setStep('phone');
    setError('');
    setDevOtp('');
    otpForm.reset();
  };

  const fillDevOtp = () => {
    if (devOtp) {
      otpForm.setValue('otp', devOtp);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Phone className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>
                  {step === 'phone' ? 'Phone Login' : 'Verify OTP'}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {step === 'phone' 
                    ? 'Enter your phone number to receive an OTP'
                    : `Enter the 6-digit code sent to ${phoneNumber}`
                  }
                </p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {error && (
              <Alert className="mb-4 border-destructive/50 bg-destructive/10">
                <AlertDescription className="text-destructive">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {step === 'phone' ? (
              <form onSubmit={phoneForm.handleSubmit(handleSendOtp)} className="space-y-4">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="0912345678 or +84912345678"
                    className={phoneForm.formState.errors.phone ? "border-destructive" : ""}
                    {...phoneForm.register("phone", {
                      required: "Phone number is required",
                      pattern: {
                        value: /^(0|\+84)(3[2-9]|5[2689]|7[06-9]|8[1-9]|9\d)\d{7}$/,
                        message: "Please enter a valid Vietnamese phone number",
                      },
                    })}
                  />
                  {phoneForm.formState.errors.phone && (
                    <p className="mt-1 text-sm text-destructive">
                      {phoneForm.formState.errors.phone.message}
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Send OTP
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={otpForm.handleSubmit(handleVerifyOtp)} className="space-y-4">
                <div>
                  <Label htmlFor="otp">OTP Code</Label>
                  <div className="flex gap-2">
                    <Input
                      id="otp"
                      type="text"
                      placeholder="123456"
                      maxLength={6}
                      className={`text-center text-lg tracking-widest ${
                        otpForm.formState.errors.otp ? "border-destructive" : ""
                      }`}
                      {...otpForm.register("otp", {
                        required: "OTP is required",
                        pattern: {
                          value: /^\d{6}$/,
                          message: "OTP must be 6 digits",
                        },
                      })}
                    />
                    {/* DEV mode helper button */}
                    {devOtp && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={fillDevOtp}
                        title={`Fill DEV OTP: ${devOtp}`}
                      >
                        Fill
                      </Button>
                    )}
                  </div>
                  {otpForm.formState.errors.otp && (
                    <p className="mt-1 text-sm text-destructive">
                      {otpForm.formState.errors.otp.message}
                    </p>
                  )}
                  
                  {/* DEV mode OTP display */}
                  {devOtp && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                      <p className="text-yellow-800">
                        <strong>DEV MODE:</strong> OTP is <code className="bg-yellow-200 px-1 rounded">{devOtp}</code>
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleBackToPhone}
                    className="flex-1"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  
                  <Button type="submit" className="flex-1" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Verify & Login'
                    )}
                  </Button>
                </div>

                <div className="text-center">
                  <Button 
                    type="button"
                    variant="link"
                    onClick={() => handleSendOtp({ phone: phoneNumber })}
                    disabled={isLoading}
                    className="text-sm"
                  >
                    Didn't receive OTP? Resend
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}