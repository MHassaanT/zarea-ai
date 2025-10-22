"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  CreditCard,
  Calendar,
  Check,
  Crown,
  Zap,
  Users,
  MessageSquare,
  BarChart3,
  Send,
} from "lucide-react"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useAuth } from "@/components/auth/auth-provider"
import { db } from "@/lib/firebase"
import { doc, getDoc, setDoc } from "firebase/firestore"

export default function BillingPage() {
  const { user, isLoading: isAuthLoading } = useAuth()
  const [currentPlan, setCurrentPlan] = useState<"trial" | "pro" | "loading">("loading")
  const [trialDaysLeft, setTrialDaysLeft] = useState<number>(0)
  const [isRequesting, setIsRequesting] = useState(false)

  const trialProgress = ((7 - trialDaysLeft) / 7) * 100

  // Logic to fetch subscription status and calculate trial days
  useEffect(() => {
    if (!user || isAuthLoading) return

    const fetchBillingData = async () => {
      try {
        const billingRef = doc(db, "billing_plans", user.uid)
        const billingSnap = await getDoc(billingRef)

        if (billingSnap.exists() && billingSnap.data()?.isSubscribed) {
          setCurrentPlan("pro")
          setTrialDaysLeft(0)
        } else {
          setCurrentPlan("trial")
          
          // ⭐️ FIX 1: Add optional chaining to user.metadata
          const creationTimeMs = user.metadata?.creationTime 
            ? new Date(user.metadata.creationTime).getTime()
            : Date.now() 
          
          const trialDurationMs = 7 * 24 * 60 * 60 * 1000
          const elapsedMs = Date.now() - creationTimeMs
          const remainingMs = trialDurationMs - elapsedMs
          
          const daysLeft = Math.ceil(remainingMs / (24 * 60 * 60 * 1000))
          setTrialDaysLeft(Math.max(0, daysLeft))
        }
      } catch (error) {
        console.error("Error fetching billing data:", error)
        setCurrentPlan("trial") 
        
        // ⭐️ FIX 2: Add optional chaining to user.metadata in the error block
        const creationTimeMs = user.metadata?.creationTime 
            ? new Date(user.metadata.creationTime).getTime()
            : Date.now()
        const trialDurationMs = 7 * 24 * 60 * 60 * 1000
        const elapsedMs = Date.now() - creationTimeMs
        const remainingMs = trialDurationMs - elapsedMs
        const daysLeft = Math.ceil(remainingMs / (24 * 60 * 60 * 1000))
        setTrialDaysLeft(Math.max(0, daysLeft))
      }
    }

    fetchBillingData()
  }, [user, isAuthLoading])


  const handleRequestPaymentLink = async () => {
    if (!user) {
      alert("Please log in to request a payment link.")
      return
    }

    setIsRequesting(true)

    try {
      // Document path: payment_links/{userID}
      const requestRef = doc(db, "payment_links", user.uid)
      
      await setDoc(requestRef, {
        userId: user.uid,
        email: user.email, 
        requestDate: new Date(),
        status: "pending",
        planRequested: "Zarea AI Pro", 
      }, { merge: true }) 

      alert(
        "Your payment link request has been received and saved to our database. Our team will send a Payoneer payment link to your registered email shortly."
      )
    } catch (error) {
      console.error("Error saving payment request:", error)
      alert("❌ Failed to save payment request. Please try again.")
    } finally {
      setIsRequesting(false)
    }
  }

  // Display loading state while fetching
  if (isAuthLoading || currentPlan === "loading") {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-96">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mr-2" />
          Loading subscription data...
        </div>
      </DashboardLayout>
    )
  }
  
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
              <p className="text-gray-600">Manage your Zarea AI subscription and payments</p>
            </div>
            {currentPlan === "trial" && (
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                <Calendar className="w-4 h-4 mr-1" />
                {trialDaysLeft} days left in trial
              </Badge>
            )}
          </div>

          <Tabs defaultValue="subscription" className="space-y-6">
            <TabsList>
              <TabsTrigger value="subscription">
                <CreditCard className="w-4 h-4 mr-2" />
                Subscription
              </TabsTrigger>
              <TabsTrigger value="usage">
                <BarChart3 className="w-4 h-4 mr-2" />
                Usage & Limits
              </TabsTrigger>
            </TabsList>

            {/* Subscription Tab */}
            <TabsContent value="subscription">
              <div className="space-y-6">
                {/* Trial Card */}
                {currentPlan === "trial" && (
                  <Card className="border-yellow-200 bg-yellow-50">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-yellow-800">Free Trial Active</CardTitle>
                        <Badge className="bg-yellow-200 text-yellow-800">Trial</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>Trial Progress</span>
                            <span>{7 - trialDaysLeft} of 7 days used</span>
                          </div>
                          <Progress value={trialProgress} className="h-2" />
                        </div>
                        <p className="text-sm text-yellow-700">
                          Your free trial expires in {trialDaysLeft} days. To continue, request your Payoneer payment
                          link and activate the Pro plan.
                        </p>
                        <Button
                          onClick={handleRequestPaymentLink}
                          disabled={isRequesting}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {isRequesting ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                              Sending request...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              Request Payoneer Payment Link
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Pro Plan Card */}
                {currentPlan === "pro" && (
                  <Card className="border-green-200 bg-green-50">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-green-800">Zarea AI Pro</CardTitle>
                        <Badge className="bg-green-200 text-green-800">Active</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-green-700">Monthly subscription</span>
                          <span className="text-2xl font-bold text-green-800">£25/month</span>
                        </div>
                        <p className="text-sm text-green-700">
                          Payments are processed manually via Payoneer. You’ll receive a new payment link each billing
                          cycle.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Pricing Section */}
                <div className="grid gap-6 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Zap className="w-5 h-5 mr-2 text-gray-600" />
                        Free Trial
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <span className="text-3xl font-bold">£0</span>
                          <span className="text-gray-600">/7 days</span>
                        </div>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-center">
                            <Check className="w-4 h-4 mr-2 text-green-600" /> AI Chatbot (50 messages)
                          </li>
                          <li className="flex items-center">
                            <Check className="w-4 h-4 mr-2 text-green-600" /> Basic CRM (10 clients)
                          </li>
                        </ul>
                        {currentPlan === "trial" && (
                          <Badge className="bg-yellow-100 text-yellow-800">Current Plan</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="relative border-green-200 shadow-lg">
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-green-600 text-white">Most Popular</Badge>
                    </div>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Crown className="w-5 h-5 mr-2 text-green-600" />
                        Zarea AI Pro
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <span className="text-3xl font-bold">£25</span>
                          <span className="text-gray-600">/month</span>
                        </div>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-center">
                            <Check className="w-4 h-4 mr-2 text-green-600" /> Unlimited AI Chatbot messages
                          </li>
                          <li className="flex items-center">
                            <Check className="w-4 h-4 mr-2 text-green-600" /> Unlimited CRM clients
                          </li>
                          <li className="flex items-center">
                            <Check className="w-4 h-4 mr-2 text-green-600" /> Priority Support
                          </li>
                        </ul>
                        {currentPlan === "pro" ? (
                          <Badge className="bg-green-100 text-green-800">Current Plan</Badge>
                        ) : (
                          <Button
                            onClick={handleRequestPaymentLink}
                            disabled={isRequesting}
                            className="w-full bg-green-600 hover:bg-green-700"
                          >
                            {isRequesting ? "Processing..." : "Request Payoneer Link"}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Usage Tab */}
            <TabsContent value="usage">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Current Usage</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="flex items-center">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          AI Chat Messages
                        </span>
                        <span>{currentPlan === "trial" ? "32/50" : "247/∞"}</span>
                      </div>
                      <Progress value={currentPlan === "trial" ? 64 : 100} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="flex items-center">
                          <Users className="w-4 h-4 mr-2" />
                          CRM Clients
                        </span>
                        <span>{currentPlan === "trial" ? "7/10" : "23/∞"}</span>
                      </div>
                      <Progress value={currentPlan === "trial" ? 70 : 100} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}