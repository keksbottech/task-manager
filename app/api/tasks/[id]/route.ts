import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

    const { id } = params
    const updateData = await request.json()

    const client = await clientPromise
    const db = client.db("taskmaster")
    const tasks = db.collection("tasks")

    // Prepare update object
    const updateObject: any = {}
    if (updateData.title) updateObject.title = updateData.title
    if (updateData.description !== undefined) updateObject.description = updateData.description
    if (updateData.priority) updateObject.priority = updateData.priority
    if (updateData.status) updateObject.status = updateData.status
    if (updateData.reminderTime) updateObject.reminderTime = new Date(updateData.reminderTime)

    const result = await tasks.updateOne(
      {
        _id: new ObjectId(id),
        userId: new ObjectId(decoded.userId),
      },
      { $set: updateObject },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    const updatedTask = await tasks.findOne({ _id: new ObjectId(id) })

    return NextResponse.json(updatedTask)
  } catch (error) {
    console.error("Update task error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    const { id } = params

    const client = await clientPromise
    const db = client.db("taskmaster")
    const tasks = db.collection("tasks")

    const result = await tasks.deleteOne({
      _id: new ObjectId(id),
      userId: new ObjectId(decoded.userId),
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Task deleted successfully" })
  } catch (error) {
    console.error("Delete task error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
