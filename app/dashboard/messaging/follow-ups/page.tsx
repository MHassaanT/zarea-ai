"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Clock, Plus, Edit, Trash2, Play, BarChart3, Send, Timer, Target } from "lucide-react"

export default function FollowUpsPage() {
  const [templates, setTemplates] = useState([
    {
      id: 1,
      name: "High-Quality Lead Response",
      trigger: "lead_score_80_plus",
      delay: 5,
      delayUnit: "minutes",
      message:
        "Hi {name}! Thank you for your inquiry about {visa_type} visa. I'm an immigration consultant and I'd be happy to help you with your application. Would you like to schedule a free 15-minute consultation to discuss your case?",
      active: true,
      sent: 24,
      opened: 18,
      replied: 12,
    },
    {
      id: 2,
      name: "Spouse Visa Inquiry",
      trigger: "visa_type_spouse",
      delay: 15,
      delayUnit: "minutes",
      message:
        "Hello! I see you're interested in a spouse visa. This is one of my specialties. I can help you understand the requirements, prepare your documents, and guide you through the entire process. Would you like to know more about my services?",
      active: true,
      sent: 18,
      opened: 15,
      replied: 8,
    },
    {
      id: 3,
      name: "General Immigration Inquiry",
      trigger: "immigration_related",
      delay: 30,
      delayUnit: "minutes",
      message:
        "Thank you for reaching out! I'm an immigration consultant with over 5 years of experience helping people with various visa applications. I'd be happy to discuss your immigration needs. What specific type of visa are you interested in?",
      active: false,
      sent: 45,
      opened: 32,
      replied: 15,
    },
  ])

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)

  const triggerOptions = [
    { value: "lead_score_80_plus", label: "Lead Score 80+" },
    { value: "lead_score_60_plus", label: "Lead Score 60+" },
    { value: "visa_type_spouse", label: "Spouse Visa Inquiry" },
    { value: "visa_type_work", label: "Work Visa Inquiry" },
    { value: "visa_type_student", label: "Student Visa Inquiry" },
    { value: "urgency_high", label: "High Urgency" },
    { value: "immigration_related", label: "Any Immigration Inquiry" },
    { value: "first_message", label: "First Message from Contact" },
  ]

  const delayUnits = [
    { value: "minutes", label: "Minutes" },
    { value: "hours", label: "Hours" },
    { value: "days", label: "Days" },
  ]

  const handleToggleTemplate = (id: number) => {
    setTemplates(templates.map((t) => (t.id === id ? { ...t, active: !t.active } : t)))
  }

  const handleDeleteTemplate = (id: number) => {
    setTemplates(templates.filter((t) => t.id !== id))
  }

  const getConversionRate = (template: any) => {
    return template.sent > 0 ? Math.round((template.replied / template.sent) * 100) : 0
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Automated Follow-ups</h1>
            <p className="text-muted-foreground">Set up intelligent automated responses based on message analysis</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Follow-up Template</DialogTitle>
                  <DialogDescription>Set up an automated response for specific message types</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="template-name">Template Name</Label>
                      <Input id="template-name" placeholder="e.g., High Priority Lead Response" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="trigger">Trigger Condition</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select trigger" />
                        </SelectTrigger>
                        <SelectContent>
                          {triggerOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="delay">Delay</Label>
                      <Input id="delay" type="number" placeholder="5" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="delay-unit">Unit</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {delayUnits.map((unit) => (
                            <SelectItem key={unit.value} value={unit.value}>
                              {unit.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message Template</Label>
                    <Textarea id="message" placeholder="Hi {name}! Thank you for your inquiry..." rows={4} />
                    <p className="text-sm text-muted-foreground">
                      Use variables: {"{name}"}, {"{visa_type}"}, {"{location}"}, {"{urgency}"}
                    </p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancel
                    </Button>
                    <Button>Create Template</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Templates</CardTitle>
              <Play className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{templates.filter((t) => t.active).length}</div>
              <p className="text-xs text-muted-foreground">{templates.length} total templates</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{templates.reduce((sum, t) => sum + t.sent, 0)}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(
                  (templates.reduce((sum, t) => sum + t.replied, 0) / templates.reduce((sum, t) => sum + t.sent, 0)) *
                    100,
                ) || 0}
                %
              </div>
              <p className="text-xs text-muted-foreground">Average across all templates</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Timer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12m</div>
              <p className="text-xs text-muted-foreground">From message to follow-up</p>
            </CardContent>
          </Card>
        </div>

        {/* Templates List */}
        <Card>
          <CardHeader>
            <CardTitle>Follow-up Templates</CardTitle>
            <CardDescription>Manage your automated response templates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {templates.map((template) => (
                <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium">{template.name}</h3>
                      <Badge variant={template.active ? "default" : "secondary"}>
                        {template.active ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {triggerOptions.find((t) => t.value === template.trigger)?.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{template.message}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {template.delay} {template.delayUnit} delay
                      </span>
                      <span>Sent: {template.sent}</span>
                      <span>Opened: {template.opened}</span>
                      <span>Replied: {template.replied}</span>
                      <span className="font-medium text-foreground">{getConversionRate(template)}% conversion</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={template.active} onCheckedChange={() => handleToggleTemplate(template.id)} />
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Follow-up Settings</CardTitle>
            <CardDescription>Configure global settings for automated follow-ups</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Enable Automated Follow-ups</Label>
                <p className="text-sm text-muted-foreground">
                  Allow the system to send automated responses based on message analysis
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Business Hours Only</Label>
                <p className="text-sm text-muted-foreground">
                  Only send follow-ups during business hours (9 AM - 6 PM)
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Weekend Delivery</Label>
                <p className="text-sm text-muted-foreground">Allow follow-ups to be sent on weekends</p>
              </div>
              <Switch />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max-daily">Max Daily Follow-ups</Label>
                <Input id="max-daily" type="number" defaultValue="50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cooldown">Cooldown Period (hours)</Label>
                <Input id="cooldown" type="number" defaultValue="24" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
