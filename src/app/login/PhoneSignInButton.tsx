"use client";

import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PhoneSignInButton() {
  const router = useRouter();
  
  const handleClick = () => {
    router.push('/login/phone');
  };
  
  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleClick}
      className="group relative w-full flex justify-center py-2 px-4 border border-input text-sm font-medium rounded-md text-foreground bg-background hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring transition-colors"
    >
      <Phone className="w-4 h-4 mr-2" />
      Continue with Phone
    </Button>
  );
}