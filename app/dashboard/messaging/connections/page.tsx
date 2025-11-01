"use client"

import { useState, useEffect } from "react"
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
} from "lucide-react"

import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/auth-context"

type MessageItem = {
  id: string | number
  sender: "contact" | "consultant"
  message: string
  timestamp: string
}

/**
 * NEW: Data structure mirroring the Firestore 'raw_messages' collection
 */
type RawMessage = {
  autoReplyText?: string;
  body: string;
  from: string; // E.g., "923037126202@c.us" - The contact's identifier
  isGroup: boolean;
  isLead: boolean;
  phoneNumber: string; // The consultant's phone number
  processed: boolean;
  replyPending: boolean;
  replySentAt?: any; // Firestore Timestamp
  timestamp: any; // Firestore Timestamp
  to: string; // E.g., "923306036339@c.us" - The consultant's identifier
  type: string;
  userId: string; // The current user's ID
  wwebId: string;
};

type Conversation = {
  id: string | number
  platform: string
  contact: string
  avatar?: string
  lastMessage?: string
  timestamp?: string
  unread?: number
  leadScore?: number
  classification?: string
  status?: string
  visaType?: string
  urgency?: string
  location?: string
  aiAnalysis?: {
    intent?: string
    keyPhrases?: string[]
    sentiment?: string
    followUpRecommendation?: string
    confidence?: number
  }
  messages?: MessageItem[]
  phoneNumber?: string
  rawMessageId?: string
}

/**
 * NEW: Helper function to map Firestore data to the Conversation UI type
 */
const mapRawMessageToConversation = (docId: string, rawMessage: RawMessage): Conversation => {
  // Clean up the WhatsApp ID (e.g., "923037126202@c.us" -> "923037126202")
  const contactId = rawMessage.from ? rawMessage.from.split('@')[0] : 'Unknown Contact';
  
  // Convert Firestore Timestamp to a readable string
  const formattedTimestamp = rawMessage.timestamp?.toDate ? 
    rawMessage.timestamp.toDate().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 
    'N/A';
  
  const initialMessage: MessageItem = {
      id: docId,
      sender: "contact",
      message: rawMessage.body,
      timestamp: formattedTimestamp,
  };

  return {
    id: docId,
    platform: 'whatsapp',
    contact: contactId,
    lastMessage: rawMessage.body,
    timestamp: formattedTimestamp,
    unread: 1, // Assuming new leads are unread
    // --- Placeholders for UI functionality ---
    leadScore: 85, 
    urgency: "high",
    visaType: "Study",
    location: "Canada",
    aiAnalysis: {
        intent: "Study Visa Inquiry",
        followUpRecommendation: "Send the 'Study Visa Brochure' template immediately.",
        confidence: 90,
    },
    // ----------------------------------------
    messages: [initialMessage],
    phoneNumber: contactId,
    rawMessageId: docId,
  } as Conversation;
};


export default function MessagingPage() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messageInput, setMessageInput] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  /**
   * UPDATED Firestore Data Fetching: Target 'raw_messages', filter by isLead=true and userId, and group by contact.
   */
  useEffect(() => {
    if (!user?.uid) {
        console.log("Waiting for user UID to be available...")
        return
    }

    try {
      // 1. Create the Firestore query targeting 'raw_messages'
      // Requires a composite index on (isLead, userId, timestamp)
      const q = query(
        collection(db, "raw_messages"),
        where("isLead", "==", true),
        where("userId", "==", user.uid),
        orderBy("timestamp", "desc")
      )
      
      console.log("Starting Firestore listener for raw_messages (Leads) on UID:", user.uid)

      const unsub = onSnapshot(
        q,
        (snapshot) => {
          // Map to hold the LATEST RawMessage for each unique contact ('from' field)
          const leadMap = new Map<string, RawMessage & { id: string }>();

          snapshot.docs.forEach((doc) => {
            // Include doc.id in the RawMessage for use in Conversation.id
            const rawMessage = doc.data() as RawMessage;
            const docId = doc.id;
            const contactIdentifier = rawMessage.from;

            // Only keep the most recent message for each unique 'from' contact
            // This groups messages to create a conversation list view
            const currentTimestampSeconds = rawMessage.timestamp?.seconds || 0;
            const existingTimestampSeconds = leadMap.get(contactIdentifier)?.timestamp.seconds || 0;

            if (!leadMap.has(contactIdentifier) || currentTimestampSeconds > existingTimestampSeconds) {
                leadMap.set(contactIdentifier, { ...rawMessage, id: docId });
            }
          });
          
          // 2. Map the unique, latest messages to the Conversation type
          const transformedConversations: Conversation[] = Array.from(leadMap.values())
            // Sort the RawMessages (which are now unique by contact) by timestamp (descending)
            .sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0))
            .map(rawMessage => 
                mapRawMessageToConversation(rawMessage.id, rawMessage)
            );

          setConversations(transformedConversations);
          
          // 3. Update selected conversation state if necessary
          if (selectedConversation) {
            const updatedSelected = transformedConversations.find(c => c.id === selectedConversation.id);
            if (updatedSelected) {
                // Update the selected conversation with fresh data
                setSelectedConversation(updatedSelected);
            } else if (!transformedConversations.some(c => c.id === selectedConversation.id)) {
                // If the selected conversation no longer exists, deselect it
                setSelectedConversation(null);
            }
          } else if (transformedConversations.length > 0) {
              // Auto-select the first conversation if none is selected
              setSelectedConversation(transformedConversations[0]);
          }
        },
        (err) => {
          console.error("Error listening to raw_messages collection:", err)
        }
      )

      return () => unsub()
    } catch (err) {
      console.error("Firestore listener setup failed:", err)
    }
  }, [user?.uid, selectedConversation?.id]) // Added selectedConversation?.id to re-run effect if the ID changes

  // Platform stats calculation
  const platformKeys = ["whatsapp", "messenger", "instagram"]
  const getPlatformDisplay = (p: string) => p.charAt(0).toUpperCase() + p.slice(1)

  const platformStats = platformKeys.map((p) => {
    if (p === "whatsapp") {
      const totalLeads = conversations.length
      const leads = conversations.filter((c) => c.platform === p).length 
      const conversion = totalLeads ? `100% (All are Leads)` : "—"
      return {
        platform: getPlatformDisplay(p),
        messages: totalLeads, 
        leads: totalLeads,
        conversion,
        icon: MessageSquare,
        color: "bg-gray-500",
        key: p,
      }
    } else {
      return {
        platform: getPlatformDisplay(p),
        messages: "Coming Soon",
        leads: "Coming Soon",
        conversion: "—",
        icon: MessageSquare,
        color: "bg-gray-300",
        key: p,
      }
    }
  })

  // Filtering/searching
  const filteredConversations = conversations.filter((conv) => {
    const q = searchQuery.trim().toLowerCase()
    const matchesSearch =
      !q ||
      (conv.contact ?? "").toLowerCase().includes(q) ||
      (conv.lastMessage ?? "").toLowerCase().includes(q)

    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "unread" && (conv.unread ?? 0) > 0) ||
      (filterStatus === "leads" && (conv.leadScore ?? 0) >= 60) ||
      (filterStatus === "urgent" && (conv.urgency ?? '').toLowerCase() === "high")

    return matchesSearch && matchesFilter
  })

  // UI helpers
  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "whatsapp":
        return "💬"
      case "messenger":
        return "📘"
      case "instagram":
        return "📷"
      default:
        return "💬"
    }
  }

  const getLeadScoreColor = (score?: number) => {
    const s = score ?? 0
    if (s >= 80) return "bg-red-100 text-red-800 border-red-200"
    if (s >= 60) return "bg-yellow-100 text-yellow-800 border-yellow-200"
    return "bg-gray-100 text-gray-800 border-gray-200"
  }

  const getUrgencyIcon = (urgency?: string) => {
    switch (urgency) {
      case "high":
        return <AlertTriangle className="h-3 w-3 text-red-500" />
      case "medium":
        return <Clock className="h-3 w-3 text-yellow-500" />
      default:
        return <CheckCircle2 className="h-3 w-3 text-green-500" />
    }
  }

  // Send message function (unchanged)
  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConversation) return

    const newMessage: MessageItem = {
      id: Date.now(),
      sender: "consultant",
      message: messageInput.trim(),
      timestamp: new Date().toLocaleString(),
    }

    // Update conversations array immutably
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === selectedConversation.id
          ? {
              ...conv,
              messages: [...(conv.messages ?? []), newMessage],
              lastMessage: newMessage.message,
              timestamp: "Just now",
            }
          : conv
      )
    )

    // Keep selectedConversation in sync for immediate UI
    setSelectedConversation((prev) =>
      prev
        ? {
            ...prev,
            messages: [...(prev.messages ?? []), newMessage],
            lastMessage: newMessage.message,
            timestamp: "Just now",
          }
        : prev
    )

    // TODO: call your backend API to actually send message via WhatsApp/Gemini
    console.log("Sending message (UI-only):", newMessage, "to conversation:", selectedConversation.id)
    setMessageInput("")
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Lead Inbox</h1>
            <p className="text-muted-foreground">All your leads from connected platforms</p>
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
                Follow-ups
              </a>
            </Button>
            <Button size="sm">
              <TrendingUp className="h-4 w-4 mr-2" />
              Analytics
            </Button>
          </div>
        </div>

        {/* Platform Stats */}
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
                <div className="text-2xl font-bold">{stat.messages}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.leads} leads • {stat.conversion} conversion
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Messaging Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversations List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Conversations</CardTitle>
                <Badge variant="secondary">{filteredConversations.length}</Badge>
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search conversations..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Conversations</SelectItem>
                    <SelectItem value="unread">Unread Messages</SelectItem>
                    <SelectItem value="leads">High-Quality Leads</SelectItem>
                    <SelectItem value="urgent">Urgent Inquiries</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1">
                {filteredConversations.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    {user ? "No conversations yet — messages will appear here automatically." : "Please sign in to view messages."}
                  </div>
                ) : (
                  filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`p-4 cursor-pointer hover:bg-muted/50 border-l-4 transition-colors ${
                        selectedConversation?.id === conversation.id ? "bg-muted border-l-primary" : "border-l-transparent"
                      }`}
                      onClick={() => setSelectedConversation(conversation)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={conversation.avatar || "/placeholder.svg"} />
                            <AvatarFallback>
                              {conversation.contact
                                ? conversation.contact
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                : "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-1 -right-1 text-sm">{getPlatformIcon(conversation.platform)}</div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm truncate">{conversation.contact ?? "Unknown"}</p>
                              {/* CONDITIONAL RENDERING */}
                              {conversation.urgency && getUrgencyIcon(conversation.urgency)}
                            </div>
                            <div className="flex items-center gap-1">
                              {((conversation.unread ?? 0) > 0) && (
                                <Badge variant="destructive" className="h-5 w-5 p-0 text-xs">
                                  {conversation.unread}
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">{conversation.timestamp ?? ""}</span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground truncate line-clamp-2">{conversation.lastMessage ?? "No messages yet"}</p>
                          
                          {/* CONDITIONAL RENDERING */}
                          <div className="flex items-center gap-2 mt-2">
                            {conversation.leadScore !== undefined && conversation.leadScore !== null && (
                                <Badge className={`text-xs ${getLeadScoreColor(conversation.leadScore)}`}>
                                  {conversation.leadScore}% Lead Score
                                </Badge>
                            )}
                            {conversation.visaType && (
                                <Badge variant="outline" className="text-xs">
                                  {conversation.visaType} visa
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

          {/* Chat Interface */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {selectedConversation ? (
                    <>
                      <Avatar>
                        <AvatarImage src={selectedConversation.avatar || "/placeholder.svg"} />
                        <AvatarFallback>
                          {selectedConversation.contact
                            ? selectedConversation.contact
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                            : "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{selectedConversation.contact ?? "Unknown"}</CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          {getPlatformIcon(selectedConversation.platform)} {selectedConversation.platform}
                          
                          {/* CONDITIONAL RENDERING */}
                          {selectedConversation.leadScore !== undefined && selectedConversation.leadScore !== null && (
                            <Badge className={`ml-2 ${getLeadScoreColor(selectedConversation.leadScore)}`}>
                              {selectedConversation.leadScore}% Lead Score
                            </Badge>
                          )}
                          
                          {/* CONDITIONAL RENDERING */}
                          {(selectedConversation.visaType || selectedConversation.location) && (
                            <Badge variant="outline" className="text-xs">
                              {selectedConversation.visaType ?? "—"} • {selectedConversation.location ?? "—"}
                            </Badge>
                          )}
                        </CardDescription>
                      </div>
                    </>
                  ) : (
                    <CardTitle>Select a conversation</CardTitle>
                  )}
                </div>
                {selectedConversation && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Star className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Calendar className="h-4 w-4" />
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
                          Add to CRM
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Archive className="h-4 w-4 mr-2" />
                          Archive
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {selectedConversation ? (
                <div className="space-y-4">
                  
                  {/* CONDITIONAL RENDERING: AI Analysis Panel */}
                  {selectedConversation.aiAnalysis?.intent || selectedConversation.aiAnalysis?.followUpRecommendation ? (
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-blue-100 rounded-full">
                            <Bot className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-blue-900">AI Analysis</h4>
                            <div className="text-sm text-blue-700 mt-1 space-y-1">
                              {selectedConversation.aiAnalysis?.intent && (
                                <p>
                                  <strong>Intent:</strong> {selectedConversation.aiAnalysis.intent}
                                </p>
                              )}
                              {selectedConversation.aiAnalysis?.keyPhrases?.length && (
                                <p>
                                  <strong>Key Phrases:</strong> {selectedConversation.aiAnalysis.keyPhrases.join(", ")}
                                </p>
                              )}
                              {selectedConversation.aiAnalysis?.followUpRecommendation && (
                                <p>
                                  <strong>Recommendation:</strong> {selectedConversation.aiAnalysis.followUpRecommendation}
                                </p>
                              )}
                              {selectedConversation.aiAnalysis?.confidence !== undefined && (
                                <p>
                                  <strong>Confidence:</strong> {selectedConversation.aiAnalysis.confidence}%
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2 mt-3">
                              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                                Send Follow-up Template
                              </Button>
                              <Button variant="outline" size="sm">
                                Schedule Call
                              </Button>
                              <Button variant="outline" size="sm">
                                Add to CRM
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : null}

                  {/* Messages */}
                  <div className="space-y-4 min-h-[300px] max-h-[400px] overflow-y-auto">
                    {(selectedConversation.messages ?? []).length === 0 ? (
                      <div className="text-sm text-muted-foreground">No messages in this conversation yet.</div>
                    ) : (
                      (selectedConversation.messages ?? []).map((message) => (
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

                  {/* Message Input */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type your message..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                      className="flex-1"
                    />
                    <Button onClick={handleSendMessage}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">Welcome to your Unified Inbox</p>
                    <p className="text-sm">Select a conversation to start messaging across all platforms</p>
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
