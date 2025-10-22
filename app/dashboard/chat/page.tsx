"use client"

import { useEffect, useRef, useState } from "react"
import { addDoc, collection, getDocs, orderBy, query, serverTimestamp, where, deleteDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/components/auth/auth-provider"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Bot, User } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
  confidence?: number
}

export default function ChatPage() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "seed",
      content:
        "Hello! I'm your AI assistant trained on UK immigration law. I can help answer questions about visas, applications, and immigration processes. How can I assist you today?",
      role: "assistant",
      timestamp: new Date(),
      confidence: 95,
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  // auto-scroll
  useEffect(() => {
    if (!scrollRef.current) return
    setTimeout(() => {
      try {
        scrollRef.current!.scrollTop = scrollRef.current!.scrollHeight
      } catch {}
    }, 50)
  }, [messages])

  const sanitizeAssistant = (text: string) => {
    if (!text) return text
    let out = text.replace(/\r\n/g, "\n")
    out = out
      .replace(/\s*\*\s*/g, (m) => (m.includes("\n") ? "\n" : " "))
      .replace(/\n{3,}/g, "\n\n")
      .trim()
    out = out
      .split("\n")
      .map((line) => line.trim().replace(/^[-•\*]\s*/, "• "))
      .join("\n")
    return out
  }

  const buildHistoryForServer = (n = 20) =>
    messages.slice(-n).map((m) => ({ role: m.role, content: m.content }))

  const saveMessageToFirestore = async (message: Message) => {
    if (!user?.id) return
    try {
      await addDoc(collection(db, "conversations"), {
        businessId: user.id,
        role: message.role,
        content: message.content,
        createdAt: serverTimestamp(),
      })
      const q = query(
        collection(db, "conversations"),
        where("businessId", "==", user.id),
        orderBy("createdAt", "asc")
      )
      const snap = await getDocs(q)
      const docs = snap.docs
      const excess = docs.length - 20
      if (excess > 0) {
        for (let i = 0; i < excess; i++) {
          await deleteDoc(doc(db, "conversations", docs[i].id))
        }
      }
    } catch (err) {
      console.error("Failed to save conversation:", err)
    }
  }

  const handleSend = async () => {
    if (!input.trim()) return
    const userMessage: Message = {
      id: Date.now().toString() + "-u",
      content: input,
      role: "user",
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    saveMessageToFirestore(userMessage).catch(console.warn)

    try {
      const history = buildHistoryForServer(20)
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          history,
          businessId: user?.id,
        }),
      })
      if (!res.ok) throw new Error("Server error " + res.status)
      const data = await res.json()
      const assistantText = sanitizeAssistant(data.response || "Sorry — I couldn't generate an answer right now.")
      const assistantMessage: Message = {
        id: Date.now().toString() + "-a",
        content: assistantText,
        role: "assistant",
        timestamp: new Date(),
        confidence: data.confidence,
      }
      setMessages((prev) => [...prev, assistantMessage])
      saveMessageToFirestore(assistantMessage).catch(console.warn)
    } catch (err) {
      console.error("Chat error:", err)
      const errMsg: Message = {
        id: Date.now().toString() + "-err",
        content: "There was an error contacting the assistant. Please try again.",
        role: "assistant",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errMsg])
      saveMessageToFirestore(errMsg).catch(() => {})
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI Assistant</h1>
            <p className="text-gray-600">Immigration law chatbot trained on UK visa requirements</p>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <Bot className="w-4 h-4 mr-1" />
            Online
          </Badge>
        </div>

        {/* Chat Card Only */}
        <Card className="h-[600px] flex flex-col">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Immigration Assistant Chat</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0">
            <ScrollArea className="flex-1 p-4 bg-white" style={{ overflow: "auto" }}>
              <div ref={scrollRef} className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] break-words rounded-lg p-3 whitespace-pre-wrap ${
                        message.role === "user"
                          ? "bg-green-600 text-white"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        {message.role === "assistant" && <Bot className="w-5 h-5 mt-0.5 text-green-600" />}
                        {message.role === "user" && <User className="w-5 h-5 mt-0.5" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">{message.content}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs opacity-70" suppressHydrationWarning>
                              {message.timestamp.toLocaleTimeString()}
                            </span>
                            {message.confidence !== undefined && (
                              <Badge variant="outline" className="text-xs">
                                {message.confidence}% confident
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <Bot className="w-5 h-5 text-green-600" />
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="p-4 border-t">
              <div className="flex space-x-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about visa requirements, application processes..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  disabled={isLoading}
                />
                <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
