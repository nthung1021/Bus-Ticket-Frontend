"use client";

import { useRouter } from "next/navigation";

export default function GoogleSignInButton() {
  //   const router = useRouter();

  const handleGoogleSignIn = () => {
    // Redirect to the backend's Google OAuth endpoint
    window.location.href = `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/google`;
    // router.push("/auth/google");
  };

  return (
    <button
      onClick={handleGoogleSignIn}
      className="w-full flex items-center justify-center gap-2 bg-background border border-input rounded-md shadow-sm py-3 px-4 text-caption font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
          <path
            fill="#4285F4"
            d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.28426 53.749 C -8.52426 55.089 -9.20426 56.239 -10.2543 57.009 L -10.2543 60.519 L -6.02426 60.519 C -3.59426 58.189 -2.754 55.009 -2.754 51.509 L -3.264 51.509 Z"
          />
          <path
            fill="#34A853"
            d="M -14.754 63.999 C -11.514 63.999 -8.80426 62.949 -6.02426 60.519 L -10.2543 57.009 C -11.7443 58.089 -13.8043 58.719 -14.754 58.719 C -17.6243 58.719 -20.1343 56.949 -20.9643 54.269 L -25.2743 54.269 L -25.2743 57.889 C -22.6143 63.269 -17.504 63.999 -14.754 63.999 Z"
          />
          <path
            fill="#FBBC05"
            d="M -20.9643 54.269 C -21.4843 52.679 -21.754 50.969 -21.754 49.239 C -21.754 47.509 -21.4843 45.799 -20.9643 44.209 L -20.9643 40.589 L -25.2743 40.589 C -27.0043 44.009 -27.754 47.569 -27.754 51.239 C -27.754 54.909 -27.0043 58.469 -25.2743 61.889 L -20.9643 58.269 C -21.4843 56.679 -21.754 54.969 -21.754 53.239 C -21.754 52.299 -21.6543 51.359 -21.4543 50.429 L -20.9643 54.269 Z"
          />
          <path
            fill="#EA4335"
            d="M -14.754 43.759 C -12.9843 43.759 -11.4043 44.369 -10.1543 45.549 L -6.01426 41.999 C -8.80426 39.329 -12.1543 38.479 -14.754 39.479 C -17.6243 40.479 -20.1343 42.249 -20.9643 44.929 L -16.6543 48.549 C -15.6143 45.999 -13.504 43.759 -14.754 43.759 Z"
          />
        </g>
      </svg>
      Continue with Google
    </button>
  );
}
