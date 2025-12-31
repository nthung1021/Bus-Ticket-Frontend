"use client";

import { useState, useEffect } from "react";
import { User, Mail, Phone, Shield, Calendar, RefreshCcw, Edit, Camera, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import userService, { type UserProfileData } from "@/services/userService";
import { EditProfileDialog } from "@/components/dashboard/EditProfileDialog/EditProfileDialog";
import { ChangePasswordDialog } from "@/components/dashboard/ChangePasswordDialog/ChangePasswordDialog";
import styles from "./UserProfile.module.css";

export function UserProfile() {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isChangePasswordDialogOpen, setIsChangePasswordDialogOpen] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await userService.getProfile();
      setProfile(data);
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchProfile();
  };

  const handleProfileUpdated = (updatedProfile: UserProfileData) => {
    setProfile(updatedProfile);
  };

  if (loading && !isRefreshing) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <RefreshCcw className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="max-w-2xl mx-auto border-destructive/20 shadow-lg">
        <CardContent className="pt-10 pb-10 text-center">
          <div className="bg-destructive/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Oops! Something went wrong</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">{error}</p>
          <Button onClick={handleRefresh} variant="outline" className="gap-2">
            <RefreshCcw className="h-4 w-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!profile) return null;

  return (
    <div className={styles.container}>
      {/* Header Section */}
      <div className={styles.header}>
        <div>
          <h2 className="text-h2 font-semibold text-foreground">My Profile</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage your personal information and account settings</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="gap-2">
            <RefreshCcw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {profile.authProvider === 'email' && (
            <Button size="sm" variant="outline" className="gap-2" onClick={() => setIsChangePasswordDialogOpen(true)}>
              <KeyRound className="h-4 w-4" />
              Change Password
            </Button>
          )}
          <Button size="sm" className="gap-2" onClick={() => setIsEditDialogOpen(true)}>
            <Edit className="h-4 w-4" />
            Edit Profile
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Summary Card */}
        <Card className={`${styles.profileCard} lg:col-span-1`}>
          <CardContent className="pt-10 pb-8 flex flex-col items-center">
            <div className={styles.avatar}>
              <User className={styles.avatarIcon} />
            </div>
            <h3 className="text-2xl font-bold text-foreground mt-4 text-center">{profile.fullName}</h3>
            <Button size="sm" className="gap-2 mt-2 px-3 py-1 capitalize">
              <Camera className="h-4 w-4" />
              Edit Avatar
            </Button>
            
            <div className="w-full mt-8 space-y-4">
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Member Since</span>
                <span className="font-medium">{format(new Date(profile.createdAt), "MMM d, yyyy")}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Account Status</span>
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">Active</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column - Detail Card */}
        <Card className={`${styles.profileCard} lg:col-span-2`}>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
            <CardDescription>All your basic information used for bookings and notifications</CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="pt-8">
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <div className={styles.label}>
                  <User className="h-4 w-4" />
                  Full Name
                </div>
                <div className={styles.value}>{profile.fullName}</div>
              </div>

              <div className={styles.infoItem}>
                <div className={styles.label}>
                  <Mail className="h-4 w-4" />
                  Email Address
                </div>
                <div className={styles.value}>{profile.email}</div>
              </div>

              <div className={styles.infoItem}>
                <div className={styles.label}>
                  <Phone className="h-4 w-4" />
                  Phone Number
                </div>
                <div className={styles.value}>{profile.phone || "(Not provided)"}</div>
              </div>

              <div className={styles.infoItem}>
                <div className={styles.label}>
                  <Shield className="h-4 w-4" />
                  Account Role
                </div>
                <div className={styles.value}>{profile.role}</div>
              </div>
            </div>

            <div className="mt-12 p-4 bg-muted/30 rounded-lg border border-border/50">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-medium text-foreground">Registration Date</h4>
                  <p className="text-sm text-muted-foreground">
                    This account was created on {format(new Date(profile.createdAt), "PPPP")}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Profile Dialog */}
      <EditProfileDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        currentProfile={profile}
        onProfileUpdated={handleProfileUpdated}
      />

      {/* Change Password Dialog */}
      <ChangePasswordDialog
        open={isChangePasswordDialogOpen}
        onOpenChange={setIsChangePasswordDialogOpen}
      />
    </div>
  );
}
