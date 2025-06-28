import { MongoClient } from "mongodb"

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017"
const DB_NAME = "taskmaster"

async function setupDatabase() {
  const client = new MongoClient(MONGODB_URI)

  try {
    await client.connect()
    console.log("Connected to MongoDB")

    const db = client.db(DB_NAME)

    // Create users collection with indexes
    const usersCollection = db.collection("users")
    await usersCollection.createIndex({ email: 1 }, { unique: true })
    console.log("Created users collection with email index")

    // Create tasks collection with indexes
    const tasksCollection = db.collection("tasks")
    await tasksCollection.createIndex({ userId: 1 })
    await tasksCollection.createIndex({ reminderTime: 1 })
    await tasksCollection.createIndex({ status: 1 })
    console.log("Created tasks collection with indexes")

    console.log("Database setup completed successfully!")
  } catch (error) {
    console.error("Database setup error:", error)
  } finally {
    await client.close()
  }
}

setupDatabase()
