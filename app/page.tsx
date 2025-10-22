"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Users, MessageSquare, TrendingUp, Clock, Shield, ArrowUp } from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  const [showScroll, setShowScroll] = useState(false)

  // show button when scrolling down
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScroll(true)
      } else {
        setShowScroll(false)
      }
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // scroll back to top
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">Z</span>
            </div>
            <span className="font-heading font-bold text-xl text-foreground">ZareaAI</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="hidden sm:inline-flex" asChild>
              <Link href="/auth/signin">Sign In</Link>
            </Button>
            <Button className="bg-primary hover:bg-primary/90" asChild>
              <Link href="/auth/signup">Start Free Trial</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <Badge className="mb-6 bg-accent text-accent-foreground border-accent/20">
            7-Day Free Trial • No Credit Card Required
          </Badge>
          <h1 className="font-heading font-bold text-4xl md:text-6xl text-balance mb-6 text-foreground">
            AI-Powered Assistant for <span className="text-primary">Immigration Consultants</span>
          </h1>
          <p className="text-xl text-muted-foreground text-pretty mb-8 leading-relaxed">
            Streamline client communication, automate FAQs, capture leads, and manage your practice efficiently. Save
            time while providing exceptional client service.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8" asChild>
              <Link href="/auth/signup">Start Your Free Trial</Link>
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <span>Secure & Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span>24/7 AI Support</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span>500+ Consultants</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="font-heading font-bold text-3xl md:text-4xl text-balance mb-4">
              Everything You Need to Grow Your Practice
            </h2>
            <p className="text-xl text-muted-foreground text-pretty">
              Powerful AI tools designed specifically for immigration consultants
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-border hover:shadow-lg transition-shadow">
              <CardHeader>
                <MessageSquare className="w-10 h-10 text-primary mb-2" />
                <CardTitle className="font-heading">AI-Powered FAQ Bot</CardTitle>
                <CardDescription>
                  Instantly answer client questions with AI trained on immigration knowledge
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    <span>24/7 automated responses</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    <span>Immigration law database</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    <span>Custom knowledge base</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border hover:shadow-lg transition-shadow">
              <CardHeader>
                <Users className="w-10 h-10 text-primary mb-2" />
                <CardTitle className="font-heading">Lead Capture & CRM</CardTitle>
                <CardDescription>Capture leads automatically and manage clients in one place</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    <span>Smart lead forms</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    <span>Client management dashboard</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    <span>Automated follow-ups</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border hover:shadow-lg transition-shadow">
              <CardHeader>
                <TrendingUp className="w-10 h-10 text-primary mb-2" />
                <CardTitle className="font-heading">Content Generation</CardTitle>
                <CardDescription>Generate professional emails, posts, and client communications</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    <span>Email templates</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    <span>Social media posts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    <span>Client proposals</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="font-heading font-bold text-3xl md:text-4xl text-balance mb-4">Simple, Transparent Pricing</h2>
          <p className="text-xl text-muted-foreground text-pretty mb-12">
            Start with a free trial, then just £25/month to transform your practice
          </p>

          <Card className="max-w-md mx-auto border-primary/20 shadow-lg">
            <CardHeader className="text-center pb-8">
              <CardTitle className="font-heading text-2xl">Professional Plan</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold text-primary">£25</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <CardDescription className="mt-2">Everything you need to grow your immigration practice</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-accent" />
                  <span>AI-powered FAQ responses</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-accent" />
                  <span>Lead capture & CRM dashboard</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-accent" />
                  <span>Content generation tools</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-accent" />
                  <span>Automated client reminders</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-accent" />
                  <span>Email & chat support</span>
                </div>
              </div>
              <Button className="w-full bg-primary hover:bg-primary/90 mt-6" size="lg" asChild>
                <Link href="/auth/signup">Start 7-Day Free Trial</Link>
              </Button>
              <p className="text-sm text-muted-foreground">No credit card required • Cancel anytime</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="font-heading font-bold text-3xl md:text-4xl text-balance mb-4">
            Ready to Transform Your Immigration Practice?
          </h2>
          <p className="text-xl opacity-90 text-pretty mb-8">
            Join hundreds of consultants who are already saving time and growing their business with Zarea AI
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8" asChild>
              <Link href="/auth/signup">Start Your Free Trial</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-lg">Z</span>
                </div>
                <span className="font-heading font-bold text-xl">Zarea AI</span>
              </div>
              <p className="text-muted-foreground text-sm">
                AI-powered business assistant for immigration consultants worldwide.
              </p>
            </div>
            <div>
              <h4 className="font-heading font-semibold mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#features" className="hover:text-foreground transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-foreground transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Demo
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading font-semibold mb-3">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Status
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading font-semibold mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Terms
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 Zarea AI. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Scroll to top button */}
      {showScroll && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 rounded-full p-3 shadow-lg bg-primary hover:bg-primary/90"
        >
          <ArrowUp className="w-5 h-5 text-white" />
        </Button>
      )}
    </div>
  )
}
