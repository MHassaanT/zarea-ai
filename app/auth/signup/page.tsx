"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, ArrowLeft, CheckCircle } from "lucide-react"

import { db } from "@/lib/firebase"
import { doc, setDoc, collection, addDoc } from "firebase/firestore"

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    contactNo: "",
    agreeToTerms: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const { signUp } = useAuth()
  const router = useRouter()

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long")
      setIsLoading(false)
      return
    }

    if (!formData.agreeToTerms) {
      setError("Please agree to the terms and conditions")
      setIsLoading(false)
      return
    }
    
    // Basic contact number validation
    if (!formData.contactNo.match(/^\+?\d{10,15}$/)) { 
        setError("Please enter a valid contact number (10-15 digits, optional '+' at start)")
        setIsLoading(false)
        return
    }

    try {
      // 1) Create user in Firebase Auth (returns UserCredential)
      const userCredential = await signUp(formData)
      const user = userCredential.user

      // 2) Create a new business document (auto-generated id)
      const businessRef = await addDoc(collection(db, "businesses"), {
        name: formData.companyName,
        ownerId: user.uid,
        createdAt: new Date(),
      })

      // 3) Create the user profile in Firestore and attach businessId
      await setDoc(
        doc(db, "users", user.uid),
        {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          contactNo: formData.contactNo,
          companyName: formData.companyName,
          businessId: businessRef.id,
          trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          isSubscribed: false,
          createdAt: new Date(),
        },
        { merge: true }
      )
      
      // 4) Create an initial document in the 'whatsapp_sessions' collection
      await setDoc(
        doc(db, "whatsapp_sessions", formData.contactNo), // Use phone number as Document ID
        {
            userId: user.uid,
            businessId: businessRef.id,
            isActive: true,
            createdAt: new Date(),
            lastActivity: new Date(),
        }
      )

      // 5) 🚀 UPDATED: Create the billing plan document with all required fields.
      // Document ID is the user's UID (user.uid).
      await setDoc(
        doc(db, "billing_plans", user.uid), 
        {
            // Use the auto-generated ID of the business document to link the plan
            businessId: businessRef.id, 
            plan_id: "free_trial",
            startedAt: new Date(), 
        }
      )

      // Navigate to dashboard (user is authenticated)
      router.push("/dashboard")
    } catch (err: any) {
      console.error("Signup error:", err)
      // Friendly error message — include firebase message when available
      setError(err?.message ? String(err.message) : "Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>

        <Card className="border-border shadow-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-2xl">Z</span>
              </div>
            </div>
            <CardTitle className="font-heading text-2xl">Start your free trial</CardTitle>
            <CardDescription>Create your Zarea AI account - no credit card required</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 p-4 bg-accent/10 rounded-lg border border-accent/20">
              <div className="flex items-center gap-2 text-accent font-medium mb-2">
                <CheckCircle className="w-4 h-4" />
                <span>7-Day Free Trial Includes:</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• AI-powered FAQ responses</li>
                <li>• Lead capture & CRM</li>
                <li>• Content generation tools</li>
                <li>• Full dashboard access</li>
              </ul>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    required
                    className="bg-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    required
                    className="bg-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                  className="bg-input"
                />
              </div>
              
              {/* Contact No. Input Field */}
              <div className="space-y-2">
                <Label htmlFor="contactNo">Contact No.</Label>
                <Input
                  id="contactNo"
                  type="tel"
                  placeholder="+1 555 123 4567"
                  value={formData.contactNo}
                  onChange={(e) => handleInputChange("contactNo", e.target.value)}
                  required
                  className="bg-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  placeholder="Your Immigration Consultancy"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange("companyName", e.target.value)}
                  required
                  className="bg-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    required
                    className="bg-input pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    required
                    className="bg-input pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) => handleInputChange("agreeToTerms", checked as boolean)}
                />
                <Label htmlFor="terms" className="text-sm leading-relaxed">
                  I agree to the{" "}
                  <Link href="/terms" className="text-primary hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                </Label>
              </div>

              <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Start Free Trial"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/auth/signin" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}