"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  FileText,
  TrendingUp,
  Settings,
  CreditCard,
  LogOut,
  User,
  Menu,
  MessageCircle,
} from "lucide-react"
import Link from "next/link"

// 🧱 Import modal UI
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Leads Hub", href: "/dashboard/messaging", icon: MessageCircle },
  { name: "AI Chatbot", href: "/dashboard/chat", icon: MessageSquare },
  { name: "Clients & CRM", href: "/dashboard/clients", icon: Users },
  { name: "Content Generator", href: "/dashboard/content", icon: FileText },
  { name: "Analytics", href: "/dashboard/analytics", icon: TrendingUp },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, signOut } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showExpiredModal, setShowExpiredModal] = useState(false)

  // ✅ Calculate trial days safely
  const trialDaysLeft = user?.trialEndsAt
    ? Math.max(
        0,
        Math.ceil(
          (new Date(user.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
      )
    : 0

  // ✅ Protect app from expired/unsubscribed users
  useEffect(() => {
    if (!user) return // wait until user loads

    const isTrialExpired = trialDaysLeft <= 0
    const isSubscribed = user?.isSubscribed

    // if trial expired & not subscribed → redirect to billing page
    if (isTrialExpired && !isSubscribed && pathname !== "/dashboard/billing") {
      router.replace("/dashboard/billing")

      // show modal AFTER redirect (delay a bit)
      setTimeout(() => {
        setShowExpiredModal(true)
      }, 1000)
    }
  }, [user, trialDaysLeft, pathname, router])

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center text-lg font-semibold">
        Loading...
      </div>
    )
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {/* Sidebar */}
        <Sidebar className="border-r border-border">
          <SidebarHeader className="border-b border-border p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">Z</span>
              </div>
              <span className="font-heading font-bold text-xl text-foreground">ZareaAI</span>
            </div>
          </SidebarHeader>

          <SidebarContent className="p-4">
            <SidebarMenu>
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link
                        href={item.href}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors"
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="border-t border-border p-4">
            {!user?.isSubscribed && (
              <div className="mb-4 p-3 bg-accent/10 rounded-lg border border-accent/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">
                    {trialDaysLeft > 0 ? "Free Trial" : "Trial Expired"}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {trialDaysLeft > 0 ? `${trialDaysLeft} days left` : "Expired"}
                  </Badge>
                </div>
                <Button size="sm" className="w-full bg-primary hover:bg-primary/90" asChild>
                  <Link href="/dashboard/billing">Upgrade Now</Link>
                </Button>
              </div>
            )}

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start p-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-foreground">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">{user?.companyName}</p>
                    </div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/billing">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Billing
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="lg:hidden">
                  <Menu className="w-5 h-5" />
                </SidebarTrigger>
              </div>

              <div className="flex items-center gap-4">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={signOut}
                  className="flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>

                {!user?.isSubscribed && (
                  <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
                    {trialDaysLeft > 0
                      ? `Trial: ${trialDaysLeft} days left`
                      : "Trial Expired"}
                  </Badge>
                )}
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>

      {/* ✅ Trial Expired Modal (AFTER redirect) */}
      <Dialog open={showExpiredModal} onOpenChange={setShowExpiredModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">
              Trial Expired
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mt-2">
              Your 7-day free trial has ended. Please upgrade your plan to
              continue using ZareaAI features.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => {
                setShowExpiredModal(false)
                router.push("/dashboard/billing")
              }}
              className="w-full bg-primary hover:bg-primary/90"
            >
              Go to Billing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}
