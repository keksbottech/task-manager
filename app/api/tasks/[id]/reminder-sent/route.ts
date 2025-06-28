import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid authorization header" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const taskId = params.id

    if (!ObjectId.isValid(taskId)) {
      return NextResponse.json({ error: "Invalid task ID" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("taskmaster")
    const tasks = db.collection("tasks")

    // Update the task to mark reminder as sent
    const result = await tasks.updateOne(
      { 
        _id: new ObjectId(taskId), 
        userId: new ObjectId(decoded.userId) 
      },
      { 
        $set: { reminderSent: true } 
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Update reminder sent status error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 