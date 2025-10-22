"use client"

import { ProtectedRoute } from "@/components/auth/protected-route"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, MessageSquare, TrendingUp, Clock, CheckCircle, FileText } from "lucide-react" // <--- FIX IS HERE
import Link from "next/link"
// ... rest of the file
import { useEffect, useState } from "react"
import { collection, getDocs, query, where, Timestamp } from "firebase/firestore" // Import Timestamp
import { db } from "@/lib/firebase"
import { useAuth } from "@/components/auth/auth-provider"

export default function DashboardPage() {
  const { user } = useAuth()
  const [totalClients, setTotalClients] = useState(0)
  const [pendingClients, setPendingClients] = useState<any[]>([])
  const [newLeadsCount, setNewLeadsCount] = useState(0) // New state for lead count

  useEffect(() => {
    const fetchClients = async () => {
      if (!user?.id) return
      try {
        const q = query(
          collection(db, "clients"),
          where("businessId", "==", user.id) // always match with user.id
        )
        const snapshot = await getDocs(q)

        // total = all docs
        setTotalClients(snapshot.size)

        // pending = exclude completed/paused
        const list = snapshot.docs
          .map((doc) => {
            const data = doc.data()
            return {
              id: doc.id,
              ...data,
              status: data.status ? data.status.toString().toLowerCase() : "pending",
            }
          })
          .filter(
            (client: any) =>
              client.status !== "completed" && client.status !== "paused"
          )

        setPendingClients(list)
      } catch (err) {
        console.error("Error fetching clients:", err)
      }
    }

    const fetchNewLeads = async () => {
      if (!user?.id) return
      try {
        // 1. Calculate the timestamp for 3 days ago
        const threeDaysAgo = new Date()
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
        const threeDaysAgoTimestamp = Timestamp.fromDate(threeDaysAgo)

        // 2. Query the raw_messages collection
        const q = query(
          collection(db, "raw_messages"),
          where("businessId", "==", user.id),
          where("isLead", "==", true),
          where("createdAt", ">=", threeDaysAgoTimestamp) // Assuming a 'createdAt' field exists
        )
        const snapshot = await getDocs(q)
        
        // 3. Set the count
        setNewLeadsCount(snapshot.size)
      } catch (err) {
        console.error("Error fetching new leads:", err)
        setNewLeadsCount(0) // Default to 0 on error
      }
    }

    fetchClients()
    fetchNewLeads() // Call the new fetch function
  }, [user?.id])

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="font-heading font-bold text-3xl text-foreground">Welcome back!</h1>
              <p className="text-muted-foreground mt-1">
                Here's what's happening with your immigration practice today.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button className="bg-primary hover:bg-primary/90">
                <Link href="/dashboard/billing">Upgrade to Pro</Link>
              </Button>
            </div>
          </div>

          {/* Stats Grid - ONLY Total Clients and New Leads remain */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Clients Card */}
            <Card className="border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Clients</CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{totalClients}</div>
                <p className="text-xs text-muted-foreground">Start by adding your first client</p>
              </CardContent>
            </Card>

            {/* New Leads Card - UPDATED */}
            <Card className="border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">New Leads (Past 3 Days)</CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{newLeadsCount}</div>
                <p className="text-xs text-muted-foreground">Set up lead capture forms</p>
              </CardContent>
            </Card>

            {/* Placeholder for remaining grid spots to keep layout consistent, although only 2 cards are shown */}
            <div className="hidden lg:block"></div>
            <div className="hidden lg:block"></div>

          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pending Tasks */}
            <Card className="lg:col-span-2 border-border">
              <CardHeader>
                <CardTitle className="font-heading">Pending Tasks</CardTitle>
                <CardDescription>Items that need your attention</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingClients.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                      <CheckCircle className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <h3 className="font-medium text-foreground mb-2">No pending tasks</h3>
                    <p className="text-sm text-muted-foreground">
                      Tasks and reminders will appear here as you manage your clients
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-4">
                    {pendingClients.map((client) => (
                      <li
                        key={client.id}
                        className="p-4 border rounded-lg flex flex-col md:flex-row md:items-center md:justify-between gap-2"
                      >
                        <div>
                          <p className="font-medium">{client.name}</p>
                          <p className="text-sm text-muted-foreground">{client.email}</p>
                          <p className="text-sm text-muted-foreground">Phone: {client.phone}</p>
                        </div>
                        <div className="text-left md:text-right">
                          <p className="text-sm">
                            <span className="font-medium">Next Action:</span>{" "}
                            {client.nextAction || "—"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Last Contact: {client.lastContact || "—"}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="font-heading">Quick Actions</CardTitle>
                <CardDescription>Common tasks and shortcuts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild className="w-full justify-start bg-primary hover:bg-primary/90" size="sm">
                  <Link href="/dashboard/chat">
                    <MessageSquare className="w-4 h-4 mr-2" />Chat with AI Bot
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
                  <Users className="w-4 h-4 mr-2" />
                  <Link href="/dashboard/clients">Add new Client</Link>
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
                  <FileText className="w-4 h-4 mr-2" />
                  <Link href="/dashboard/content">Generate Content</Link>
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  <Link href="/dashboard/analytics">View Analytics</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}