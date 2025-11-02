"use client"

import { useState, useEffect, useMemo } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  MessageSquare,
  TrendingUp,
  Search,
  Send,
  Star,
  MoreVertical,
  Archive,
  Trash2,
  UserPlus,
  Calendar,
  Bot,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Link,
  Users, // Added for Qualified Leads icon
} from "lucide-react"

import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/auth-context"

// --- NEW/UPDATED TYPES ---

type QualifiedLead = {
  id: string
  userId: string
  phoneNumber: string
  contactId: string
  rawMessageId: string
  intent: string
  priority: "High" | "Medium" | "Low"
  messageCount: number
  name: string
  email: string
  lastMessageBody: string
  autoReplyText: string
  timestamp: string // String representation of the timestamp
}

// Conversation type is no longer needed in its original form, 
// but we keep a simplified one for the "Chat" panel if we were to show messages.
// We'll use QualifiedLead for the main data.

export default function MessagingPage() {
  const { user } = useAuth()
  const [qualifiedLeads, setQualifiedLeads] = useState<QualifiedLead[]>([])
  const [selectedLead, setSelectedLead] = useState<QualifiedLead | null>(null)
  const [messageInput, setMessageInput] = useState("")
  const [filterPriority, setFilterPriority] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  // --- FIRESTORE DATA FETCHING FOR QUALIFIED LEADS ---

  useEffect(() => {
    if (!user?.uid) {
        console.log("Waiting for user UID to be available...")
        return
    }

    try {
      // 1. Target the 'qualified_leads' collection
      const q = query(
        collection(db, "qualified_leads"),
        // 2. Filter by the authenticated user's ID
        where("userId", "==", user.uid),
        // 3. Order by timestamp
        orderBy("timestamp", "desc")
      )
      
      console.log("Starting Firestore listener for qualified_leads on UID:", user.uid)

      const unsub = onSnapshot(
        q,
        (snapshot) => {
          console.log(`Received ${snapshot.docs.length} qualified lead documents.`) 
          
          const leads: QualifiedLead[] = snapshot.docs.map((d) => {
            const data = d.data() as any
            const timestamp = data.timestamp?.toDate ? data.timestamp.toDate().toLocaleString() : (data.timestamp?.value || new Date().toLocaleString())
            
            return {
              id: d.id,
              userId: data.userId,
              phoneNumber: data.phoneNumber,
              contactId: data.contactId,
              rawMessageId: data.rawMessageId,
              intent: data.intent || "Unknown Intent",
              priority: data.priority || "Medium",
              messageCount: data.messageCount || 1,
              name: data.name || data.phoneNumber || "Unknown Contact",
              email: data.email || "No Email",
              lastMessageBody: data.lastMessageBody || "No message content",
              autoReplyText: data.autoReplyText || "No auto-reply sent.",
              timestamp: timestamp,
            } as QualifiedLead
          })

          setQualifiedLeads(leads)
          
          // Update selected lead if it exists in the new list
          if (selectedLead) {
             const updatedSelected = leads.find(l => l.id === selectedLead.id)
             if (updatedSelected) {
                 setSelectedLead(updatedSelected)
             } else {
                // Deselect if the lead was removed/filtered on the backend
                setSelectedLead(null)
             }
          }
        },
        (err) => {
          console.error("Error listening to qualified_leads collection:", err)
        }
      )

      return () => unsub()
    } catch (err) {
      console.error("Firestore listener setup failed:", err)
    }
  }, [user?.uid])

  // --- PLATFORM STATS (Simplified/Refactored for Qualified Leads) ---
  // The original 'platform' logic is no longer relevant, but we keep the card structure
  // and adapt it to show qualified leads stats.

  const totalLeads = qualifiedLeads.length
  const highPriorityLeads = qualifiedLeads.filter(l => l.priority === "High").length
  const highPriorityRatio = totalLeads > 0 ? `${Math.round((highPriorityLeads / totalLeads) * 100)}%` : "—"

  const platformStats = [
    {
      platform: "Qualified Leads",
      data: totalLeads, 
      subtext: `${totalLeads} Total`,
      conversion: "100% Leads",
      icon: Users,
      color: "bg-green-600",
      key: "qualified_total",
    },
    {
      platform: "High Priority",
      data: highPriorityLeads,
      subtext: `${highPriorityRatio} of total`,
      conversion: highPriorityRatio,
      icon: AlertTriangle,
      color: "bg-red-500",
      key: "qualified_high",
    },
    {
      platform: "Automation Success",
      data: "Data Driven",
      subtext: "Coming Soon",
      conversion: "—",
      icon: Bot,
      color: "bg-indigo-500",
      key: "automation",
    }
  ]
  

  // --- FILTERING/SEARCHING ---
  const filteredLeads = qualifiedLeads.filter((lead) => {
    const q = searchQuery.trim().toLowerCase()
    const matchesSearch =
      !q ||
      lead.name.toLowerCase().includes(q) ||
      lead.lastMessageBody.toLowerCase().includes(q) ||
      lead.intent.toLowerCase().includes(q)

    const matchesFilter =
      filterPriority === "all" ||
      lead.priority.toLowerCase() === filterPriority

    return matchesSearch && matchesFilter
  })

  // --- UI HELPERS (Refactored/Simplified) ---

  const getPriorityColor = (priority: string) => {
    switch(priority.toLowerCase()) {
        case "high": return "bg-red-100 text-red-800 border-red-200"
        case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200"
        default: return "bg-green-100 text-green-800 border-green-200"
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch(priority.toLowerCase()) {
        case "high": return <AlertTriangle className="h-3 w-3 text-red-500" />
        case "medium": return <Clock className="h-3 w-3 text-yellow-500" />
        default: return <CheckCircle2 className="h-3 w-3 text-green-500" />
    }
  }

  const getPlatformIcon = (contactId: string) => {
    if (contactId.includes("whatsapp")) return "💬"
    if (contactId.includes("messenger")) return "📘"
    if (contactId.includes("instagram")) return "📷"
    return "💬"
  }


  // --- SEND MESSAGE FUNCTION (Simplified - UI Only) ---
  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedLead) return

    // In a real app, this would call an API to send a message via the platform (e.g., WhatsApp)
    console.log("Sending follow-up message (UI-only):", messageInput.trim(), "to lead:", selectedLead.id)
    setMessageInput("")
  }

  // --- DUMMY MESSAGE HISTORY FOR DISPLAY (Based on qualified_leads data) ---
  const leadMessages = useMemo(() => {
    if (!selectedLead) return []
    // Simulating a minimal conversation history based on the available data
    return [
        {
            id: 1,
            sender: "contact",
            message: selectedLead.lastMessageBody,
            timestamp: selectedLead.timestamp,
        },
        {
            id: 2,
            sender: "consultant",
            message: selectedLead.autoReplyText,
            timestamp: new Date().toLocaleString(), // Use current time for the auto-reply
        }
    ]
  }, [selectedLead])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Lead Qualification</h1>
            <p className="text-muted-foreground">Focus on your most qualified, high-intent leads</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href="/dashboard/messaging/connections">
                <Link className="h-4 w-4 mr-2" />
                Connections
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/dashboard/messaging/follow-ups">
                <Bot className="h-4 w-4 mr-2" />
                Automation
              </a>
            </Button>
            <Button size="sm">
              <TrendingUp className="h-4 w-4 mr-2" />
              Analytics
            </Button>
          </div>
        </div>

        {/* Platform Stats (Now Lead Stats) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {platformStats.map((stat) => (
            <Card key={stat.key}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.platform}</CardTitle>
                <div className={`p-2 rounded-full ${stat.color}`}>
                  <stat.icon className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.data}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.subtext}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Interface: Qualified Leads List and Lead Detail */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* 1. Qualified Leads List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Qualified Leads</CardTitle>
                <Badge variant="secondary">{filteredLeads.length}</Badge>
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, intent, or message..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Qualified Leads</SelectItem>
                    <SelectItem value="high">High Priority</SelectItem>
                    <SelectItem value="medium">Medium Priority</SelectItem>
                    <SelectItem value="low">Low Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1 max-h-[600px] overflow-y-auto">
                {filteredLeads.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    {user ? "No qualified leads found with these filters." : "Please sign in to view leads."}
                  </div>
                ) : (
                  filteredLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className={`p-4 cursor-pointer hover:bg-muted/50 border-l-4 transition-colors ${
                        selectedLead?.id === lead.id ? "bg-muted border-l-primary" : "border-l-transparent"
                      }`}
                      onClick={() => setSelectedLead(lead)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src="/placeholder.svg" />
                            <AvatarFallback>
                              {lead.name
                                ? lead.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                : "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-1 -right-1 text-sm">{getPlatformIcon(lead.contactId)}</div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm truncate">{lead.name}</p>
                              {getPriorityIcon(lead.priority)}
                            </div>
                            <span className="text-xs text-muted-foreground">{lead.timestamp.split(',')[0] ?? ""}</span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate line-clamp-1">{lead.lastMessageBody}</p>
                          
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={`text-xs ${getPriorityColor(lead.priority)}`}>
                              {lead.priority} Priority
                            </Badge>
                            {lead.intent && (
                                <Badge variant="outline" className="text-xs">
                                  {lead.intent}
                                </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* 2. Lead Detail & Follow-up Interface (replaces Chat Interface) */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {selectedLead ? (
                    <>
                      <Avatar>
                        <AvatarImage src="/placeholder.svg" />
                        <AvatarFallback>
                          {selectedLead.name
                            ? selectedLead.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                            : "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{selectedLead.name}</CardTitle>
                        <CardDescription className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
                          <span className="flex items-center gap-1">
                            {getPlatformIcon(selectedLead.contactId)} {selectedLead.phoneNumber}
                          </span>
                          
                          <Badge className={`ml-0 md:ml-2 text-xs ${getPriorityColor(selectedLead.priority)}`}>
                            {selectedLead.priority} Priority
                          </Badge>
                          
                          <Badge variant="outline" className="text-xs">
                            {selectedLead.intent}
                          </Badge>
                        </CardDescription>
                      </div>
                    </>
                  ) : (
                    <CardTitle>Select a Qualified Lead</CardTitle>
                  )}
                </div>
                {selectedLead && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule Call
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Convert to Client
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Archive className="h-4 w-4 mr-2" />
                          Archive Lead
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Dismiss
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {selectedLead ? (
                <div className="space-y-4">
                  
                  {/* Lead Information Panel */}
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 rounded-full">
                          <Zap className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-blue-900">Qualification Summary</h4>
                          <div className="text-sm text-blue-700 mt-1 space-y-1">
                            <p>
                              <strong>Name:</strong> {selectedLead.name}
                            </p>
                            <p>
                              <strong>Email:</strong> {selectedLead.email}
                            </p>
                            <p>
                              <strong>Intent:</strong> {selectedLead.intent}
                            </p>
                            <p>
                              <strong>Priority:</strong> <span className="font-semibold">{selectedLead.priority}</span>
                            </p>
                            <p>
                              <strong>Auto-Reply Sent:</strong> {selectedLead.autoReplyText}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Message History (Simulated) */}
                  <div className="space-y-4 min-h-[300px] max-h-[400px] overflow-y-auto">
                    {leadMessages.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No messages in this lead record.</div>
                    ) : (
                      leadMessages.map((message) => (
                        <div key={message.id} className={`flex ${message.sender === "consultant" ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`p-3 rounded-lg max-w-[80%] ${
                              message.sender === "consultant" ? "bg-primary text-primary-foreground" : "bg-muted"
                            }`}
                          >
                            <p className="text-sm">{message.message}</p>
                            <span className={`text-xs mt-1 block ${message.sender === "consultant" ? "opacity-80" : "text-muted-foreground"}`}>
                              {message.timestamp}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Message Input for Follow-up */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Send a direct follow-up message..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                      className="flex-1"
                    />
                    <Button onClick={handleSendMessage}>
                      <Send className="h-4 w-4 mr-2" />
                      Send
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                  <div className="text-center">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">Focus on Qualified Leads</p>
                    <p className="text-sm">Select a lead from the list to view the summary and send a follow-up.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
