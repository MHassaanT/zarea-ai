import { type NextRequest, NextResponse } from "next/server"

interface Lead {
  id: string
  name: string
  email: string
  phone?: string
  visaType: string
  message: string
  source: string
  score: number
  status: "new" | "qualified" | "proposal" | "won" | "lost"
  createdAt: Date
}

// Mock lead data
const mockLeads: Lead[] = [
  {
    id: "1",
    name: "John Smith",
    email: "john.smith@email.com",
    phone: "+44 7700 900111",
    visaType: "Spouse Visa",
    message: "I need help with my spouse visa application. My wife is from India and we want to move to the UK.",
    source: "Website Form",
    score: 85,
    status: "new",
    createdAt: new Date("2024-01-15T10:30:00Z"),
  },
  {
    id: "2",
    name: "Lisa Chen",
    email: "lisa.chen@email.com",
    phone: "+44 7700 900222",
    visaType: "Skilled Worker",
    message: "I have a job offer from a UK company. What documents do I need for the work permit?",
    source: "Google Ads",
    score: 92,
    status: "qualified",
    createdAt: new Date("2024-01-14T15:45:00Z"),
  },
]

export async function GET() {
  try {
    return NextResponse.json({ leads: mockLeads })
  } catch (error) {
    console.error("Error fetching leads:", error)
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, visaType, message, source } = body

    let score = 50 // Base score

    // Higher scores for complex visa types
    if (["Spouse Visa", "Investor Visa", "Settlement"].includes(visaType)) {
      score += 20
    }

    // Higher score if phone number provided
    if (phone) {
      score += 15
    }

    // Higher score for detailed messages
    if (message && message.length > 100) {
      score += 15
    }

    const newLead: Lead = {
      id: Date.now().toString(),
      name,
      email,
      phone,
      visaType,
      message,
      source: source || "Direct",
      score,
      status: "new",
      createdAt: new Date(),
    }

    // In a real app, save to database
    mockLeads.unshift(newLead)

    return NextResponse.json({
      success: true,
      lead: newLead,
      message: "Lead captured successfully",
    })
  } catch (error) {
    console.error("Error creating lead:", error)
    return NextResponse.json({ error: "Failed to create lead" }, { status: 500 })
  }
}
