"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle2, Plus, RefreshCw, Smartphone, Facebook, Instagram, ArrowLeft } from "lucide-react" // ADDED: ArrowLeft
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { db, auth } from "@/lib/firebase"
import { onSnapshot, doc, Timestamp } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import qrcode from "qrcode"
import Link from "next/link" // ADDED: Link for navigation

// ✅ Real hook to get current user ID from Firebase Auth
const useGetCurrentUserId = () => {
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setUserId(user.uid)
      else setUserId(null)
    })
    return () => unsubscribe()
  }, [])

  return userId
}

type Connection = {
  connected: boolean
  status: string
  lastSync: Timestamp | null
  phoneNumber?: string | null
}

const generateQrDataUrl = async (qrString: string): Promise<string> => {
  try {
    const url = await qrcode.toDataURL(qrString, { margin: 1, width: 256 })
    return url
  } catch (error) {
    console.error("Error generating QR code on frontend:", error)
    return ""
  }
}

export default function ConnectionsPage() {
  const currentUserId = useGetCurrentUserId()

  const [connections, setConnections] = useState<{
    whatsapp: Connection
    messenger: Connection
    instagram: Connection
  }>({
    whatsapp: { connected: false, status: "disconnected", lastSync: null, phoneNumber: null },
    messenger: { connected: false, status: "disconnected", lastSync: null },
    instagram: { connected: false, status: "disconnected", lastSync: null },
  })

  const [whatsappUnsubscribe, setWhatsappUnsubscribe] = useState<(() => void) | null>(null)
  const [showSetupDialog, setShowSetupDialog] = useState(false)
  const [qr, setQr] = useState<string | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)

  const platforms = [
    {
      id: "whatsapp",
      name: "WhatsApp Business",
      description: "Connect your WhatsApp Business account to receive and send messages",
      icon: Smartphone,
      color: "bg-green-500",
    },
    {
      id: "messenger",
      name: "Facebook Messenger",
      description: "Connect your Facebook Page to manage Messenger conversations",
      icon: Facebook,
      color: "bg-blue-500",
    },
    {
      id: "instagram",
      name: "Instagram Direct",
      description: "Connect your Instagram Business account for DM management",
      icon: Instagram,
      color: "bg-purple-500",
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Connected</Badge>
      case "error":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Error</Badge>
      case "disconnected":
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Disconnected</Badge>
      case "awaiting_scan":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Awaiting Scan</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  // Cleanup snapshot listener when unmounting or dialog closes
  useEffect(() => {
    return () => {
      if (whatsappUnsubscribe) whatsappUnsubscribe()
    }
  }, [whatsappUnsubscribe])

  const handleConnect = async (platformId: string) => {
    if (!currentUserId) {
      alert("Please log in first.")
      return
    }

    if (platformId === "whatsapp") {
      try {
        await fetch("http://localhost:4000/start-whatsapp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: currentUserId }),
        })
        console.log(`✅ Requested backend to start client for ${currentUserId}`)
      } catch (err) {
        console.error("⚠️ Backend /start-whatsapp failed:", err)
        alert("Failed to start WhatsApp client on the server.")
        return
      }

      setShowSetupDialog(true)
      setQr(null)
      setQrDataUrl(null)

      const ref = doc(db, "whatsapp_sessions", currentUserId)
      console.log("👀 Subscribing to:", ref.path)

      // stop previous listener if active
      if (whatsappUnsubscribe) whatsappUnsubscribe()

      const unsub = onSnapshot(
        ref,
        (snap) => {
          console.log("🔥 Snapshot triggered:", snap.exists(), snap.data())
          const data = snap.data()
          if (!data) return

          setConnections((prev) => ({
            ...prev,
            whatsapp: {
              ...prev.whatsapp,
              status: data.status,
              connected: data.connected,
              phoneNumber: data.phoneNumber || null,
            },
          }))

          if (data.qr) {
            setQr(data.qr as string)
          } else {
            setQr(null)
            setQrDataUrl(null)
          }

          if (data.connected) {
            setShowSetupDialog(false)
          }
        },
        (error) => {
          console.error("Firestore Snapshot Error:", error)
          setConnections((prev) => ({
            ...prev,
            whatsapp: { ...prev.whatsapp, connected: false, status: "error" },
          }))
        }
      )

      setWhatsappUnsubscribe(() => unsub)
    }
  }

  // generate QR Data URL when raw QR changes
  useEffect(() => {
    if (qr) {
      generateQrDataUrl(qr).then((url) => {
        if (url) setQrDataUrl(url)
      })
    } else {
      setQrDataUrl(null)
    }
  }, [qr])

  const handleDisconnect = async (platformId: string) => {
    setConnections((prev) => ({
      ...prev,
      [platformId]: { connected: false, status: "disconnected", lastSync: null },
    }))

    if (!currentUserId) {
      alert("Please log in first.")
      return
    }

    if (platformId === "whatsapp") {
      if (whatsappUnsubscribe) {
        whatsappUnsubscribe()
        setWhatsappUnsubscribe(null)
      }

      try {
        await fetch("http://localhost:4000/disconnect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: currentUserId }),
        })
        console.log(`✅ Disconnected WhatsApp via backend for ${currentUserId}`)
      } catch (err) {
        console.error("⚠️ Backend disconnect failed:", err)
        setConnections((prev) => ({
          ...prev,
          whatsapp: { ...prev.whatsapp, status: "error" },
        }))
      }
    }
  }

  if (!currentUserId) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-muted-foreground text-lg">Please sign in to manage your connections.</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ADDED: Link to go back to the main messaging page */}
        <div className="mb-4">
          <Link href="/dashboard/messaging" className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Messaging Inbox
          </Link>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Platform Connections</h1>
            <p className="text-muted-foreground">
              Connect your messaging platforms to start receiving messages
            </p>
          </div>
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Status
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {platforms.map((platform) => {
            const connection = connections[platform.id as keyof typeof connections]
            const PlatformIcon = platform.icon

            return (
              <Card key={platform.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${platform.color}`}>
                        <PlatformIcon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{platform.name}</CardTitle>
                        <CardDescription className="text-sm">{platform.description}</CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(connection.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {connection.connected ? (
                      <>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          Connected {connection.phoneNumber && `(${connection.phoneNumber})`}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDisconnect(platform.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          Disconnect
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {connection.status === "error" ? (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-yellow-500" />
                          )}
                          {connection.status === "error"
                            ? "Connection Error"
                            : connection.status === "awaiting_scan"
                            ? "Awaiting Scan"
                            : "Not connected"}
                        </div>
                        <Button className="w-full" onClick={() => handleConnect(platform.id)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Connect {platform.name}
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* WhatsApp QR Dialog */}
        <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
          <DialogContent className="max-w-md flex flex-col items-center">
            <DialogHeader className="text-center w-full">
              <DialogTitle>Scan QR Code to connect WhatsApp</DialogTitle>
              <CardDescription className="text-sm">
                Keep this window open until connected. This QR refreshes every 30 seconds.
              </CardDescription>
            </DialogHeader>
            {qrDataUrl ? (
              <div className="p-4 border border-border rounded-lg shadow-xl bg-white flex justify-center">
                <img src={qrDataUrl} alt="WhatsApp QR" className="w-64 h-64 aspect-square rounded-lg" />
              </div>
            ) : (
              <div className="w-64 h-64 flex flex-col items-center justify-center p-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="text-muted-foreground mt-4">Waiting for QR code from server...</p>
              </div>
            )}
            <div className="text-sm text-center text-muted-foreground mt-4">
              <p>Steps to scan:</p>
              <ol className="list-decimal list-inside">
                <li>Open WhatsApp on your phone.</li>
                <li>Go to <b>Settings → Linked Devices</b>.</li>
                <li>Tap <b>Link a Device</b> and scan the code above.</li>
              </ol>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}