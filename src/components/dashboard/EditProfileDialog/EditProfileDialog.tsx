"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import userService, { type UpdateProfileDto, type UserProfileData } from "@/services/userService";
import { toast } from "@/hooks/use-toast";

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentProfile: UserProfileData;
  onProfileUpdated: (updatedProfile: UserProfileData) => void;
}

export function EditProfileDialog({
  open,
  onOpenChange,
  currentProfile,
  onProfileUpdated,
}: EditProfileDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdateProfileDto>({
    defaultValues: {
      fullName: currentProfile.fullName,
      phone: currentProfile.phone,
    },
  });

  const onSubmit = async (data: UpdateProfileDto) => {
    try {
      setIsSubmitting(true);

      // Only send fields that have changed
      const updates: UpdateProfileDto = {};
      if (data.fullName && data.fullName !== currentProfile.fullName) {
        updates.fullName = data.fullName;
      }
      if (data.phone && data.phone !== currentProfile.phone) {
        updates.phone = data.phone;
      }

      // If nothing changed, just close the dialog
      if (Object.keys(updates).length === 0) {
        toast({
          title: "No changes",
          description: "No changes were made to your profile.",
        });
        onOpenChange(false);
        return;
      }

      const updatedProfile = await userService.updateProfile(updates);

      toast({
        title: "Success!",
        description: "Your profile has been updated successfully.",
        variant: "default",
      });

      onProfileUpdated(updatedProfile);
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    reset({
      fullName: currentProfile.fullName,
      phone: currentProfile.phone,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Edit Profile</DialogTitle>
          <DialogDescription>
            Update your personal information. Click save when you're done.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-sm font-medium">
              Full Name
            </Label>
            <Input
              id="fullName"
              placeholder="Enter your full name"
              {...register("fullName", {
                required: "Full name is required",
                minLength: {
                  value: 2,
                  message: "Full name must be at least 2 characters",
                },
                maxLength: {
                  value: 100,
                  message: "Full name must not exceed 100 characters",
                },
              })}
              className={errors.fullName ? "border-destructive" : ""}
            />
            {errors.fullName && (
              <p className="text-sm text-destructive">{errors.fullName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium">
              Phone Number
            </Label>
            <Input
              id="phone"
              placeholder="Enter your phone number"
              {...register("phone", {
                required: "Phone number is required",
                pattern: {
                  value: /^(0)[0-9]{9,10}$/,
                  message: "Please provide a valid Vietnamese phone number",
                },
              })}
              className={errors.phone ? "border-destructive" : ""}
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Format: 0xxxxxxxxx
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email Address
            </Label>
            <Input
              id="email"
              value={currentProfile.email}
              disabled
              className="bg-muted cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
