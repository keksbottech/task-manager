import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
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

    const client = await clientPromise
    const db = client.db("taskmaster")
    const tasks = db.collection("tasks")

    const userTasks = await tasks
      .find({ userId: new ObjectId(decoded.userId) })
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json(userTasks)
  } catch (error) {
    console.error("Get tasks error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    const { title, description, priority, reminderTime } = await request.json()

    if (!title || !reminderTime) {
      return NextResponse.json({ error: "Title and reminder time are required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("taskmaster")
    const tasks = db.collection("tasks")

    const result = await tasks.insertOne({
      userId: new ObjectId(decoded.userId),
      title,
      description: description || "",
      priority: priority || "medium",
      status: "pending",
      reminderTime: new Date(reminderTime),
      createdAt: new Date(),
      reminderSent: false,
    })

    const newTask = await tasks.findOne({ _id: result.insertedId })

    return NextResponse.json(newTask, { status: 201 })
  } catch (error) {
    console.error("Create task error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
