"use client"

import { ProtectedRoute } from "@/components/auth/protected-route"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, Users, MessageSquare, Target, BarChart3, PieChart } from "lucide-react"
import Link from "next/link"

export default function AnalyticsPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading font-bold text-3xl text-foreground">Analytics</h1>
              <p className="text-muted-foreground mt-1">
                Track your practice performance and AI assistant effectiveness
              </p>
            </div>
            <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
              Coming Soon
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Performance Overview
                </CardTitle>
                <CardDescription>Track key metrics and growth trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">Analytics will be available soon</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  AI Chat Analytics
                </CardTitle>
                <CardDescription>Monitor chatbot performance and accuracy</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <PieChart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">Chat analytics coming soon</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Client Insights
                </CardTitle>
                <CardDescription>Understand your client base and patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">Client insights coming soon</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border">
            <CardHeader>
              <CardTitle className="font-heading">Advanced Analytics</CardTitle>
              <CardDescription>Detailed reporting and insights will be available in the full version</CardDescription>
            </CardHeader>
            <CardContent className="text-center py-12">
              <div className="max-w-md mx-auto">
                <h3 className="font-medium text-foreground mb-2">Coming in Pro Version</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Get detailed analytics on client acquisition, AI performance, revenue tracking, and more when you
                  upgrade to Pro.
                </p>
                <Button className="bg-primary hover:bg-primary/90">
                  <Link href="/dashboard/billing">Upgrade to Pro</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
