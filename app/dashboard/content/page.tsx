"use client"

import { useEffect, useState } from "react"
import { addDoc, collection, getDocs, query, where, orderBy, serverTimestamp, doc, deleteDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/components/auth/auth-provider"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileText, Mail, MessageSquare, Copy, Wand2, Save, Clock, Star, Trash2 } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"

interface ContentTemplate {
  id: string
  name: string
  type: "email" | "social" | "blog" | "letter"
  description: string
  category: string
}

interface GeneratedContent {
  id: string
  title: string
  content: string
  type: string
  createdAt: Date
  isFavorite: boolean
  businessId?: string
}

const contentTemplates: ContentTemplate[] = [
  {
    id: "1",
    name: "Welcome Email",
    type: "email",
    description: "Welcome new clients to your immigration services",
    category: "Client Communication",
  },
  {
    id: "2",
    name: "Document Checklist Email",
    type: "email",
    description: "Send clients a list of required documents",
    category: "Client Communication",
  },
  {
    id: "3",
    name: "Social Media Post - Success Story",
    type: "social",
    description: "Share client success stories (anonymized)",
    category: "Marketing",
  },
  {
    id: "4",
    name: "Blog Post - Visa Updates",
    type: "blog",
    description: "Write about recent immigration law changes",
    category: "Content Marketing",
  },
  {
    id: "5",
    name: "Follow-up Letter",
    type: "letter",
    description: "Professional follow-up after consultation",
    category: "Client Communication",
  },
]

export default function ContentPage() {
  const { user } = useAuth()

  // generation UI state
  const [selectedTemplate, setSelectedTemplate] = useState<ContentTemplate | null>(null)
  const [generatedContent, setGeneratedContent] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  // saved content library (loaded from Firestore)
  const [contentLibrary, setContentLibrary] = useState<GeneratedContent[]>([])
  const [isLibraryLoading, setIsLibraryLoading] = useState(false)

  // form fields
  const [clientName, setClientName] = useState("")
  const [visaType, setVisaType] = useState("")
  const [tone, setTone] = useState("professional")
  const [customPrompt, setCustomPrompt] = useState("")

  // Fetch saved contents for this business on mount / when user changes
  useEffect(() => {
    const loadLibrary = async () => {
      if (!user?.id) {
        setContentLibrary([])
        return
      }
      setIsLibraryLoading(true)
      try {
        const q = query(
          collection(db, "contents"),
          where("businessId", "==", user.id),
          orderBy("createdAt", "desc")
        )
        const snap = await getDocs(q)
        const list: GeneratedContent[] = snap.docs.map((d) => {
          const data = d.data() as any
          const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt ? new Date(data.createdAt) : new Date()
          return {
            id: d.id,
            title: data.title || "Untitled",
            content: data.content || "",
            type: data.type || "other",
            createdAt,
            isFavorite: !!data.isFavorite,
            businessId: data.businessId,
          }
        })
        setContentLibrary(list)
      } catch (err) {
        console.error("Failed to load content library:", err)
      } finally {
        setIsLibraryLoading(false)
      }
    }

    loadLibrary()
  }, [user?.id])

  // generate content (calls your server endpoint)
  const handleGenerate = async () => {
    if (!selectedTemplate) return
    setIsGenerating(true)
    setGeneratedContent("")
    try {
      const res = await fetch("/api/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template: selectedTemplate,
          clientName,
          visaType,
          tone,
          customPrompt,
        }),
      })

      if (!res.ok) {
        const txt = await res.text().catch(() => "")
        throw new Error("Server error: " + res.status + " " + txt)
      }

      const data = await res.json()
      setGeneratedContent(data.content || "")
    } catch (err) {
      console.error("Content generation error:", err)
      alert("Failed to generate content. See console for details.")
    } finally {
      setIsGenerating(false)
    }
  }

  // Save content to Firestore for this business
  const handleSaveContent = async () => {
    if (!generatedContent || !selectedTemplate) return
    if (!user?.id) {
      alert("You must be signed in to save content.")
      return
    }

    const title = `${selectedTemplate.name} - ${new Date().toLocaleDateString()}`

    try {
      const docRef = await addDoc(collection(db, "contents"), {
        businessId: user.id,
        title,
        content: generatedContent,
        type: selectedTemplate.type,
        createdAt: serverTimestamp(),
        isFavorite: false,
      })

      // Optimistically update UI with local Date (serverTimestamp will settle later)
      const newItem: GeneratedContent = {
        id: docRef.id,
        title,
        content: generatedContent,
        type: selectedTemplate.type,
        createdAt: new Date(),
        isFavorite: false,
        businessId: user.id,
      }

      setContentLibrary((prev) => [newItem, ...prev])
      // Optionally notify user
      // toast.success("Saved to library")
    } catch (err) {
      console.error("Failed to save content:", err)
      alert("Failed to save content. See console for details.")
    }
  }

  // Toggle favorite - updates Firestore and UI
  const toggleFavorite = async (id: string) => {
    const item = contentLibrary.find((c) => c.id === id)
    if (!item) return
    try {
      await updateDoc(doc(db, "contents", id), { isFavorite: !item.isFavorite })
      setContentLibrary((prev) => prev.map((c) => (c.id === id ? { ...c, isFavorite: !c.isFavorite } : c)))
    } catch (err) {
      console.error("Failed to toggle favorite:", err)
      alert("Failed to update favorite status.")
    }
  }

  // Delete content (Firestore + local)
  const deleteContent = async (id: string) => {
    if (!confirm("Delete this saved content? This cannot be undone.")) return
    try {
      await deleteDoc(doc(db, "contents", id))
      setContentLibrary((prev) => prev.filter((c) => c.id !== id))
    } catch (err) {
      console.error("Failed to delete content:", err)
      alert("Failed to delete content.")
    }
  }

  // copy helper
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // optional: toast.success("Copied")
    } catch {
      alert("Failed to copy to clipboard")
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Content Generator</h1>
            <p className="text-gray-600">Create professional content for your immigration practice</p>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <Wand2 className="w-4 h-4 mr-1" />
            AI Powered
          </Badge>
        </div>

        {/* Tabs: Generate + Library (Templates tab removed) */}
        <Tabs defaultValue="generate" className="space-y-6">
          <TabsList>
            <TabsTrigger value="generate">
              <Wand2 className="w-4 h-4 mr-2" />
              Generate Content
            </TabsTrigger>
            <TabsTrigger value="library">
              <FileText className="w-4 h-4 mr-2" />
              Content Library
            </TabsTrigger>
          </TabsList>

          {/* Generate */}
          <TabsContent value="generate">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Content Generation Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Create New Content</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Content Template</label>
                    <Select
                      onValueChange={(value) => {
                        const template = contentTemplates.find((t) => t.id === value)
                        setSelectedTemplate(template || null)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a template" />
                      </SelectTrigger>
                      <SelectContent>
                        {contentTemplates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            <div className="flex items-center space-x-2">
                              {template.type === "email" && <Mail className="w-4 h-4" />}
                              {template.type === "social" && <MessageSquare className="w-4 h-4" />}
                              {template.type === "blog" && <FileText className="w-4 h-4" />}
                              {template.type === "letter" && <FileText className="w-4 h-4" />}
                              <span>{template.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedTemplate && <p className="text-sm text-gray-500 mt-1">{selectedTemplate.description}</p>}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Client Name (Optional)</label>
                      <Input
                        placeholder="John Smith"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Visa Type</label>
                      <Select value={visaType} onValueChange={setVisaType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select visa type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="spouse">Spouse Visa</SelectItem>
                          <SelectItem value="skilled-worker">Skilled Worker</SelectItem>
                          <SelectItem value="student">Student Visa</SelectItem>
                          <SelectItem value="investor">Investor Visa</SelectItem>
                          <SelectItem value="settlement">Settlement</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Tone</label>
                    <Select value={tone} onValueChange={setTone}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="formal">Formal</SelectItem>
                        <SelectItem value="conversational">Conversational</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Additional Instructions (Optional)</label>
                    <Textarea
                      placeholder="Any specific details or requirements..."
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <Button
                    onClick={handleGenerate}
                    disabled={!selectedTemplate || isGenerating}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-2" />
                        Generate Content
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Generated Content Display */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Generated Content</CardTitle>
                    {generatedContent && (
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(generatedContent)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleSaveContent}>
                          <Save className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {generatedContent ? (
                    <ScrollArea className="h-96">
                      <div className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg">{generatedContent}</div>
                    </ScrollArea>
                  ) : (
                    <div className="h-96 flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>Select a template and click generate to create content</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Library */}
          <TabsContent value="library">
            <Card>
              <CardHeader>
                <CardTitle>Saved Content</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isLibraryLoading ? (
                    <div>Loading saved content...</div>
                  ) : contentLibrary.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No saved content yet</div>
                  ) : (
                    contentLibrary.map((item) => (
                      <div key={item.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium">{item.title}</h3>
                            <Badge variant="outline">{item.type}</Badge>
                            {item.isFavorite && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => toggleFavorite(item.id)}>
                              <Star
                                className={`w-4 h-4 ${item.isFavorite ? "text-yellow-500 fill-current" : "text-gray-400"}`}
                              />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(item.content)}>
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteContent(item.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{item.content.substring(0, 150)}...</p>
                        <div className="flex items-center text-xs text-gray-400">
                          <Clock className="w-3 h-3 mr-1" />
                          {item.createdAt.toLocaleDateString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
