import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/toast";

interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  initialAttempt?: number;
  onRetry?: (attempt: number) => void;
  onSuccess?: () => void;
  onFailure?: (error: Error) => void;
}

interface RetryState {
  attempt: number;
  isRetrying: boolean;
  canRetry: boolean;
  lastError: Error | null;
}

/**
 * Custom React hook that provides retry functionality for payment-related operations.
 *
 * This hook handles the execution of asynchronous operations with automatic retry logic,
 * error handling, and payment failure redirection. It's specifically designed for
 * payment processing flows where network reliability might be a concern.
 *
 * @example
 * const { execute, state } = usePaymentRetry({
 *   maxRetries: 3,
 *   retryDelay: 2000,
 *   onRetry: (attempt) => console.log(`Retry attempt ${attempt}`),
 *   onSuccess: () => console.log('Operation succeeded'),
 *   onFailure: (error) => console.error('Operation failed', error)
 * });
 *
 * // Usage
 * const result = await execute(async () => {
 *   return await makePayment(paymentDetails);
 * }, "payment processing");
 *
 * @param {Object} [options] - Configuration options for the retry behavior
 * @param {number} [options.maxRetries=3] - Maximum number of retry attempts before giving up
 * @param {number} [options.retryDelay=1000] - Delay in milliseconds between retry attempts
 * @param {number} [options.initialAttempt=0] - Initial attempt count (useful for state persistence)
 * @param {(attempt: number) => void} [options.onRetry] - Callback triggered when a retry is attempted
 * @param {() => void} [options.onSuccess] - Callback triggered when the operation succeeds
 * @param {(error: Error) => void} [options.onFailure] - Callback triggered when all retry attempts fail
 *
 * @returns {Object} An object containing the retry state and control methods
 * @property {RetryState} state - Current state of the retry operation
 * @property {Function} execute - Function to execute an operation with retry logic
 * @property {Function} reset - Resets the retry state to initial values
 * @property {Function} handlePaymentFailure - Handles payment failure by redirecting to the failure page
 *
 * @see {@link RetryState} for the structure of the state object
 * @see {@link RetryOptions} for available configuration options
 */
export function usePaymentRetry(options: RetryOptions = {}) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    initialAttempt = 0,
    onRetry,
    onSuccess,
    onFailure,
  } = options;

  const router = useRouter();
  const [state, setState] = useState<RetryState>({
    attempt: initialAttempt,
    isRetrying: false,
    canRetry: initialAttempt < maxRetries,
    lastError: null,
  });

  const reset = useCallback(() => {
    setState({
      attempt: 0,
      isRetrying: false,
      canRetry: true,
      lastError: null,
    });
  }, []);

  const execute = useCallback(
    async <T>(
      operation: () => Promise<T>,
      context?: string,
      currentAttempt: number = state.attempt,
    ): Promise<T | null> => {
      if (!state.canRetry && currentAttempt >= maxRetries) {
        const error = new Error(
          `Maximum retry attempts (${maxRetries}) reached`,
        );
        setState((prev) => ({ ...prev, lastError: error, canRetry: false }));
        onFailure?.(error);
        return null;
      }

      setState((prev) => ({ ...prev, isRetrying: true, lastError: null }));

      try {
        const result = await operation();
        setState((prev) => ({ ...prev, isRetrying: false, lastError: null }));
        onSuccess?.();
        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setState((prev) => ({
          ...prev,
          isRetrying: false,
          lastError: err,
          attempt: prev.attempt + 1,
          canRetry: prev.attempt + 1 < maxRetries,
        }));

        console.error(
          `Payment operation failed (attempt ${currentAttempt + 1}):`,
          err,
        );

        // Determine if we should retry based on error type
        const shouldRetry = shouldRetryError(err);

        if (shouldRetry && currentAttempt + 1 < maxRetries) {
          showToast.info(
            `Operation failed, retrying... (${currentAttempt + 2}/${maxRetries})`,
          );
          onRetry?.(currentAttempt + 1);

          // Wait before retry
          await new Promise((resolve) => setTimeout(resolve, retryDelay));

          // Recursive retry with updated attempt count
          return execute(operation, context, currentAttempt + 1);
        } else if (!shouldRetry) {
          showToast.error(err.message);
          onFailure?.(err);
          return null;
        } else {
          // Max retries reached
          const finalError = new Error(
            `Operation failed after ${maxRetries} attempts: ${err.message}`,
          );
          showToast.error(finalError.message);
          onFailure?.(finalError);
          return null;
        }
      }
    },
    [
      state.attempt,
      state.canRetry,
      maxRetries,
      retryDelay,
      onRetry,
      onSuccess,
      onFailure,
    ],
  );

  const handlePaymentFailure = useCallback(
    (errorType: string, message: string, details?: string) => {
      const errorParams = new URLSearchParams({
        error: errorType,
        message,
        details: details || "Payment processing failed",
        attempt: state.attempt.toString(),
        maxRetries: maxRetries.toString(),
      });

      router.push(`/payment/failure?${errorParams.toString()}`);
    },
    [router, state.attempt, maxRetries],
  );

  return {
    state,
    execute,
    reset,
    handlePaymentFailure,
  };
}

function shouldRetryError(error: Error): boolean {
  const message = error.message.toLowerCase();

  // Don't retry on validation errors
  if (
    message.includes("validation") ||
    message.includes("invalid") ||
    message.includes("not found") ||
    message.includes("unauthorized")
  ) {
    return false;
  }

  // Don't retry on seat availability issues
  if (message.includes("seat") && message.includes("available")) {
    return false;
  }

  // Retry on network errors, timeouts, and server errors
  if (
    message.includes("network") ||
    message.includes("timeout") ||
    message.includes("connection") ||
    message.includes("server") ||
    message.includes("temporary")
  ) {
    return true;
  }

  // Default to retrying for unknown errors
  return true;
}
