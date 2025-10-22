"use client"

import { ProtectedRoute } from "@/components/auth/protected-route"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Bell, Shield, Palette, Database } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { useState } from "react"
import { reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth"
import { auth } from "@/lib/firebase"

export default function SettingsPage() {
  const { user, updateProfile, deleteAccount, updatePassword } = useAuth()

  // Profile form state
  const [firstName, setFirstName] = useState(user?.firstName || "")
  const [lastName, setLastName] = useState(user?.lastName || "")
  const [email, setEmail] = useState(user?.email || "")
  const [companyName, setCompanyName] = useState(user?.companyName || "")
  // ⬅️ NEW: Added state for contactNo
  const [contactNo, setContactNo] = useState(user?.contactNo || "") 
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  const handleSaveProfile = async () => {
    if (!user) return
    setIsSavingProfile(true)
    try {
      const updates: any = {}
      if (firstName && firstName !== user.firstName) updates.firstName = firstName
      if (lastName && lastName !== user.lastName) updates.lastName = lastName
      // NOTE: Email update may require re-authentication and additional Firebase Auth logic, but we include it here for the Firestore profile update.
      if (email && email !== user.email) updates.email = email 
      if (companyName && companyName !== user.companyName) updates.companyName = companyName
      // ⬅️ NEW: Check and include contactNo update
      if (contactNo && contactNo !== user.contactNo) updates.contactNo = contactNo

      if (Object.keys(updates).length > 0) {
        await updateProfile(updates)
        alert("✅ Profile updated successfully!")
      } else {
        alert("⚠️ No changes to update")
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      alert("❌ Failed to update profile")
    } finally {
      setIsSavingProfile(false)
    }
  }

  // Security form state
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  const handlePasswordUpdate = async () => {
    if (newPassword !== confirmPassword) {
      alert("❌ New passwords do not match")
      return
    }
    if (!auth.currentUser || !user) return

    try {
      setIsUpdatingPassword(true)

      // ✅ Re-authenticate
      const credential = EmailAuthProvider.credential(user.email, currentPassword)
      await reauthenticateWithCredential(auth.currentUser, credential)

      // ✅ Update password
      await updatePassword(newPassword)
      alert("✅ Password updated successfully!")

      // Reset form
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error: any) {
      console.error("Password update failed:", error)
      alert("❌ Failed to update password. Check your current password and try again.")
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-8">
          <div>
            <h1 className="font-heading font-bold text-3xl text-foreground">Settings</h1>
            <p className="text-muted-foreground mt-1">
              Manage your account preferences
            </p>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            {/* UPDATED: TabsList to only include Profile and Security, and set grid-cols-2 */}
            <TabsList className="grid w-full grid-cols-2"> 
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Profile Information
                  </CardTitle>
                  <CardDescription>Update your personal and business information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Enter your first name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Enter your last name"
                      />
                    </div>
                  </div>
                  
                  {/* ⬅️ NEW: Contact No. Input Field */}
                  <div className="space-y-2">
                    <Label htmlFor="contactNo">Contact No.</Label>
                    <Input
                      id="contactNo"
                      type="tel"
                      value={contactNo}
                      onChange={(e) => setContactNo(e.target.value)}
                      placeholder="Enter your contact number"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Company/Practice Name</Label>
                    <Input
                      id="company"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Enter your practice name"
                    />
                  </div>
                  <Button
                    onClick={handleSaveProfile}
                    disabled={isSavingProfile}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {isSavingProfile ? "Saving..." : "Save Changes"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Security Settings
                  </CardTitle>
                  <CardDescription>Manage your account security and privacy</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                    />
                  </div>
                  <Button
                    onClick={handlePasswordUpdate}
                    disabled={isUpdatingPassword}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {isUpdatingPassword ? "Updating..." : "Update Password"}
                  </Button>
                  
                  <Separator /> 
                  
                  {/* Account Deletion moved from old "Data" tab */}
                  <div>
                    <h4 className="font-medium mb-2 text-destructive">Delete Account</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Permanently delete your account and all associated data
                    </p>
                    <Button
                      variant="destructive"
                      onClick={async () => {
                        if (confirm("⚠️ Are you sure you want to delete your account? This action is permanent.")) {
                          await deleteAccount()
                        }
                      }}
                    >
                      Delete Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* The Notifications, AI Settings, and Data Tabs have been removed */}

          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}