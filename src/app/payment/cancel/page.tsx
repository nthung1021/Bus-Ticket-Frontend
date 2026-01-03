"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/api";

function PaymentCancelRedirectContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    // Decide where to redirect after PayOS returns to cancel URL
    const paramsObj = Object.fromEntries(searchParams.entries());
    const bookingId = paramsObj.bookingId || paramsObj.bookingid || null;
    const tripId = paramsObj.tripId || paramsObj.tripid || null;
    const status = (paramsObj.status || '').toString().toLowerCase();
    const code = (paramsObj.code || '').toString();
    const isCancelFlag = paramsObj.cancel === 'true' || paramsObj.cancel === '1';
    const hasError = !!paramsObj.error || (code && code !== '00') || (status && status !== 'cancelled' && status !== 'paid');

    // If there's an explicit error, go to failure page preserving params
    const params = Array.from(searchParams.entries())
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join("&");

    if (hasError) {
      const target = `/payment/failure${params ? `?${params}` : ""}`;
      router.replace(target);
      return;
    }

    // guard against duplicate redirects/callswhen provider hits URL multiple times
    const handledRef = (globalThis as any).__bpf_cancelHandledRef ||= { ids: new Set() };

    // If PayOS indicates a successful payment on this redirect, confirm it immediately
    const payosStatus = (paramsObj.status || '').toString().toLowerCase();
    const payosCode = (paramsObj.code || '').toString();
    // Only treat as paid when PayOS explicitly reports success (status=paid or code=00)
    // and this redirect is not an explicit cancel redirect.
    const looksLikePaid = !isCancelFlag && (payosStatus === 'paid' || payosCode === '00');

    if (bookingId && looksLikePaid) {
      if (handledRef.ids.has(bookingId)) {
        // already processed for this bookingId
        const paramsObj2 = new URLSearchParams(params);
        paramsObj2.delete('bookingId');
        paramsObj2.set('bookingId', bookingId);
        router.replace(`/payment/success?${paramsObj2.toString()}`);
        return;
      }
      handledRef.ids.add(bookingId);
      (async () => {
          try {
          const paymentData = {
            orderCode: paramsObj.orderCode || undefined,
            transactionId: paramsObj.id || undefined,
            raw: paramsObj,
          };

          // Call confirm-payment to mark booking as paid using API client
          const resp = await api.put(`/bookings/${encodeURIComponent(bookingId)}/confirm-payment`, paymentData);

          // Redirect to success page with params preserved (backend is idempotent)
          const paramsObj3 = new URLSearchParams(params);
          paramsObj3.delete('bookingId');
          paramsObj3.set('bookingId', bookingId);
          router.replace(`/payment/success?${paramsObj3.toString()}`);
          return;
        } catch (err) {
          console.debug('Confirm-payment call failed on cancel redirect:', err);
        }

        // If confirm failed, fall back to showing failure
        const targetFail = `/payment/failure${params ? `?${params}` : ""}`;
        router.replace(targetFail);
      })();
      return;
    }

    // Normal cancel: attempt to mark booking cancelled on backend, then redirect to Complete Payment page
    if (bookingId) {
      // avoid duplicate cancels
      if (handledRef.ids.has(bookingId)) {
        const paramsObj4 = new URLSearchParams();
        paramsObj4.set('bookingId', bookingId);
        if (tripId) paramsObj4.set('tripId', tripId);
        router.replace(`/payment?${paramsObj4.toString()}`);
        return;
      }
      handledRef.ids.add(bookingId);
      (async () => {
          try {
            if (isCancelFlag) {
              await api.delete(`/bookings/${encodeURIComponent(bookingId)}`);
            }
          } catch (err) {
            console.debug('Failed to call cancel booking API on redirect:', err);
          } finally {
            const paramsObj5 = new URLSearchParams();
            paramsObj5.set('bookingId', bookingId);
            if (tripId) paramsObj5.set('tripId', tripId);
            router.replace(`/payment?${paramsObj5.toString()}`);
          }
      })();
      return;
    }

    // Fallback: redirect to payment page root
    router.replace('/payment');
  }, [searchParams, router]);

  return null;
}

export default function PaymentCancelRedirect() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentCancelRedirectContent />
    </Suspense>
  );
}
