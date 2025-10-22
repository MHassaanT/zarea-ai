"use client"

import { useEffect, useState } from "react"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { db } from "@/lib/firebase"
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore"
import { useAuth } from "@/components/auth/auth-provider"
import {
  Users,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Phone,
  Mail,
  Calendar,
  FileText,
  Star,
  TrendingUp,
} from "lucide-react"

interface Client {
  id: string
  name: string
  email: string
  phone: string
  visaType: string
  status: "active" | "pending" | "completed" | "paused"
  priority: "high" | "medium" | "low"
  lastContact: string // YYYY-MM-DD
  nextAction: string
  value: number
  businessId: string
}

const visaOptions = [
  "Spouse Visa",
  "Skilled Worker",
  "Student Visa",
  "Investor Visa",
  "Settlement",
  "Other",
]

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [selectedPriority, setSelectedPriority] = useState<string>("all")
  const [formData, setFormData] = useState<Omit<Client, "id" | "businessId">>({
    name: "",
    email: "",
    phone: "",
    visaType: "",
    status: "pending",
    priority: "medium",
    lastContact: "",
    nextAction: "",
    value: 0,
  })
  const [otherVisaType, setOtherVisaType] = useState("")
  const { user } = useAuth()

  // --- Fetch clients for the current business (user.id) ---
  useEffect(() => {
    if (!user) return
    const fetchClients = async () => {
      try {
        const q = query(collection(db, "clients"), where("businessId", "==", user.id))
        const querySnap = await getDocs(q)
        const list: Client[] = []
        querySnap.forEach((docSnap) => {
          const raw = docSnap.data() as any
          // normalize lastContact (support Firestore Timestamp or string)
          let lastContact = ""
          if (raw?.lastContact) {
            if (raw.lastContact?.toDate) {
              lastContact = raw.lastContact.toDate().toISOString().slice(0, 10)
            } else if (typeof raw.lastContact === "string") {
              lastContact = raw.lastContact
            } else {
              const d = new Date(raw.lastContact)
              if (!isNaN(d.getTime())) lastContact = d.toISOString().slice(0, 10)
            }
          }
          const client: Client = {
            id: docSnap.id,
            name: raw.name || "",
            email: raw.email || "",
            phone: raw.phone || "",
            visaType: raw.visaType || "",
            status: (raw.status as Client["status"]) || "pending",
            priority: (raw.priority as Client["priority"]) || "medium",
            lastContact,
            nextAction: raw.nextAction || "",
            value: raw.value || 0,
            businessId: raw.businessId || "",
          }
          list.push(client)
        })
        setClients(list)
      } catch (error) {
        console.error("Failed to fetch clients:", error)
      }
    }
    fetchClients()
  }, [user])

  // prefill form when editing
  const openEdit = (client: Client) => {
    setEditingClient(client)
    const visa = visaOptions.includes(client.visaType) ? client.visaType : "Other"
    setFormData({
      name: client.name,
      email: client.email,
      phone: client.phone,
      visaType: visa,
      status: client.status,
      priority: client.priority,
      lastContact: client.lastContact || "",
      nextAction: client.nextAction,
      value: client.value,
    })
    setOtherVisaType(visa === "Other" ? client.visaType : "")
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      visaType: "",
      status: "pending",
      priority: "medium",
      lastContact: "",
      nextAction: "",
      value: 0,
    })
    setOtherVisaType("")
  }

  const handleSaveClient = async () => {
    if (!user) return
    const finalVisaType = formData.visaType === "Other" ? otherVisaType : formData.visaType

    if (!formData.name || !finalVisaType) {
      alert("Please fill in the client name and visa type.")
      return
    }

    const clientData = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      visaType: finalVisaType,
      status: formData.status,
      priority: formData.priority,
      lastContact: formData.lastContact || "",
      nextAction: formData.nextAction || "",
      value: Number(formData.value) || 0,
    }

    try {
      if (editingClient) {
        const docRef = doc(db, "clients", editingClient.id)
        await updateDoc(docRef, clientData)
        setClients((prev) => prev.map((c) => (c.id === editingClient.id ? { ...c, ...clientData } : c)))
      } else {
        const docRef = await addDoc(collection(db, "clients"), {
          ...clientData,
          businessId: user.id,
        })
        setClients((prev) => [...prev, { id: docRef.id, businessId: user.id, ...clientData }])
      }
      setIsDialogOpen(false)
      setEditingClient(null)
      resetForm()
    } catch (error) {
      console.error("Error saving client:", error)
      alert("Failed to save client. See console for details.")
    }
  }

  const handleDeleteClient = async (id: string) => {
    if (!confirm("Are you sure you want to delete this client? This action cannot be undone.")) return
    try {
      await deleteDoc(doc(db, "clients", id))
      setClients((prev) => prev.filter((c) => c.id !== id))
    } catch (error) {
      console.error("Failed to delete client:", error)
      alert("Failed to delete client.")
    }
  }

  // Filtering & searching
  const filteredClients = clients.filter((client) => {
  const matchesSearch =
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())

  const matchesStatus =
    selectedStatus === "all" || client.status === selectedStatus

  const matchesPriority =
    selectedPriority === "all" || client.priority === selectedPriority

  return matchesSearch && matchesStatus && matchesPriority
})


  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      case "paused":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Clients & CRM</h1>
              <p className="text-gray-600">Manage your immigration clients and track their progress</p>
            </div>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                resetForm()
                setEditingClient(null)
                setIsDialogOpen(true)
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Client
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="w-8 h-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Clients</p>
                    <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Cases</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {clients.filter((c) => c.status === "active").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Star className="w-8 h-8 text-yellow-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">High Priority</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {clients.filter((c) => c.priority === "high").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <FileText className="w-8 h-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Value</p>
                    <p className="text-2xl font-bold text-gray-900">
                      £{clients.reduce((sum, c) => sum + c.value, 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="clients" className="space-y-6">
            <TabsList>
              <TabsTrigger value="clients">All Clients</TabsTrigger>
            </TabsList>

            <TabsContent value="clients">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Client Management</CardTitle>
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Search clients..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 w-64"
                        />
                      </div>

                      <Select
                        value={selectedStatus}
                        onValueChange={(value) => setSelectedStatus(value)}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Filter by Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="paused">Paused</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select
                        value={selectedPriority}
                        onValueChange={(value) => setSelectedPriority(value)}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Filter by Priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Priorities</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {clients.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                        <Users className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <h3 className="font-medium text-foreground mb-2">No clients yet</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Start by adding your first client to begin managing your immigration practice
                      </p>
                      <Button
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          resetForm()
                          setEditingClient(null)
                          setIsDialogOpen(true)
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Client
                      </Button>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Client</TableHead>
                          <TableHead>Visa Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Last Contact</TableHead>
                          <TableHead>Next Action</TableHead>
                          <TableHead>Value</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredClients.map((client) => (
                          <TableRow key={client.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{client.name}</div>
                                <div className="text-sm text-gray-500">{client.email}</div>
                              </div>
                            </TableCell>
                            <TableCell>{client.visaType}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(client.status)}>{client.status}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={getPriorityColor(client.priority)}>{client.priority}</Badge>
                            </TableCell>
                            <TableCell>{client.lastContact}</TableCell>
                            <TableCell>{client.nextAction}</TableCell>
                            <TableCell>£{client.value.toLocaleString()}</TableCell>

                            {/* Action dropdown - properly aligned + z-index */}
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    aria-label="Actions"
                                    className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted"
                                  >
                                    <MoreHorizontal className="w-4 h-4" />
                                  </button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent align="end" side="bottom" className="w-44 z-50">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      openEdit(client)
                                    }}
                                  >
                                    Edit
                                  </DropdownMenuItem>

                                  <DropdownMenuItem
                                    onClick={() => handleDeleteClient(client.id)}
                                    className="text-destructive"
                                  >
                                    Delete
                                  </DropdownMenuItem>

                                  <DropdownMenuItem>
                                    <Phone className="w-4 h-4 mr-2" /> Call Client
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Mail className="w-4 h-4 mr-2" /> Send Email
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Calendar className="w-4 h-4 mr-2" /> Schedule Meeting
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <FileText className="w-4 h-4 mr-2" /> View Documents
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* ---------------- DIALOG (Add / Edit) ---------------- */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[640px] w-full max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingClient ? "Edit Client" : "Add New Client"}</DialogTitle>
              <DialogDescription>Fill in the details below. Click save when you're done.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid w-full items-center gap-2">
                <Label htmlFor="name">Client Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., John Smith"
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                />
              </div>

              <div className="grid w-full items-center gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="e.g., john.smith@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                />
              </div>

              <div className="grid w-full items-center gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="e.g., +44 1234 567890"
                  value={formData.phone}
                  onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                />
              </div>

              <div className="grid w-full items-center gap-2">
                <Label htmlFor="visaType">Visa Type</Label>
                <Select
                  value={formData.visaType}
                  onValueChange={(value) => setFormData((p) => ({ ...p, visaType: value }))}
                >
                  <SelectTrigger id="visaType">
                    <SelectValue placeholder="Select a visa type" />
                  </SelectTrigger>
                  <SelectContent>
                    {visaOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.visaType === "Other" && (
                <div className="grid w-full items-center gap-2">
                  <Label htmlFor="otherVisaType">Please Specify Visa Type</Label>
                  <Input
                    id="otherVisaType"
                    placeholder="e.g., Global Talent Visa"
                    value={otherVisaType}
                    onChange={(e) => setOtherVisaType(e.target.value)}
                  />
                </div>
              )}

              <div className="grid w-full items-center gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData((p) => ({ ...p, status: value as Client["status"] }))}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid w-full items-center gap-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData((p) => ({ ...p, priority: value as Client["priority"] }))}
                >
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid w-full items-center gap-2">
                <Label htmlFor="lastContact">Last Contact</Label>
                <Input
                  id="lastContact"
                  type="date"
                  value={formData.lastContact}
                  onChange={(e) => setFormData((p) => ({ ...p, lastContact: e.target.value }))}
                />
              </div>

              <div className="grid w-full items-center gap-2">
                <Label htmlFor="nextAction">Next Action</Label>
                <Input
                  id="nextAction"
                  placeholder="e.g., Send documents"
                  value={formData.nextAction}
                  onChange={(e) => setFormData((p) => ({ ...p, nextAction: e.target.value }))}
                />
              </div>

              <div className="grid w-full items-center gap-2">
                <Label htmlFor="value">Case Value (£)</Label>
                <Input
                  id="value"
                  type="number"
                  placeholder="e.g., 1500"
                  value={String(formData.value)}
                  onChange={(e) => setFormData((p) => ({ ...p, value: Number(e.target.value) }))}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveClient} className="bg-green-600 hover:bg-green-700">
                {editingClient ? "Save Changes" : "Add Client"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </ProtectedRoute>
  )
}