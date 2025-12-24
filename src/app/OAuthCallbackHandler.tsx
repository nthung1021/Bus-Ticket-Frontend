"use client";

import { useSearchParams } from "next/navigation";
import { useCurrentUser } from "src/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useEffect } from "react";

export default function OAuthCallbackHandler() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { data: user, refetch: refetchUser } = useCurrentUser();

  // Handle OAuth callback (Google & Facebook) - CRITICAL: Frontend compatibility for OAuth flow
  useEffect(() => {
    const error = searchParams.get('error');
    
    if (error === 'auth_failed') {
      toast.error('Authentication failed. Please try again.');
      // Clean URL without causing navigation
      const url = new URL(window.location.href);
      url.searchParams.delete('error');
      window.history.replaceState({}, '', url.toString());
    }
    
    // If user just returned from OAuth, refresh auth state
    const urlHasAuthParams = searchParams.has('error') || window.location.search.includes('auth');
    if (urlHasAuthParams && !user) {
      // Force refresh user data after OAuth redirect
      refetchUser();
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    }
  }, [searchParams, user, refetchUser, queryClient]);

  return null; // This component doesn't render anything
}