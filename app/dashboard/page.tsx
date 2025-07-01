"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, Plus, Clock, Trash2, Edit, LogOut, Bell, Calendar, Check, AlertCircle } from "lucide-react"

interface Task {
  _id: string
  title: string
  description: string
  priority: "low" | "medium" | "high"
  status: "pending" | "completed"
  reminderTime: string
  createdAt: string
  reminderSent?: boolean
}

// Utility: Convert local datetime-local string to UTC ISO string
function localToUTCISOString(localDateTime: string) {
  if (!localDateTime) return '';
  const date = new Date(localDateTime);
  return date.toISOString();
}

// Utility: Convert UTC ISO string to local datetime-local string (for input value)
function utcToLocalInputValue(utcISOString: string) {
  if (!utcISOString) return '';
  const date = new Date(utcISOString);
  const tzOffset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - tzOffset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
}

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ name: string; email: string } | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high",
    reminderTime: "",
  })
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("pending")
  const [notificationAlert, setNotificationAlert] = useState<{title: string, description: string} | null>(null)
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [isCreatingTask, setIsCreatingTask] = useState(false)
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null)
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null)
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null)
  const [isCreatingTestTask, setIsCreatingTestTask] = useState(false)
  const router = useRouter()

  // Audio for notifications
  const [audio] = useState(() => {
    if (typeof window !== "undefined") {
      // Try to use the global audio instance first
      const globalAudio = (window as any).notificationAudio
      if (globalAudio) {
        return globalAudio
      }
      
      // Fallback to local audio instance
      const audioElement = new Audio("/ring.mp3")
      audioElement.volume = 0.7
      audioElement.preload = "auto"
      
      // Add event listeners for better debugging
      audioElement.addEventListener('canplaythrough', () => {
        console.log('Audio ready to play')
      })
      
      audioElement.addEventListener('error', (e) => {
        console.error('Audio error:', e)
      })
      
      return audioElement
    }
    return null
  })

  // Function to play audio with user interaction fallback
  const playNotificationSound = async () => {
    if (!audio) {
      console.log("No audio element available")
      return
    }

    try {
      console.log("Attempting to play audio...")
      
      // Reset audio to beginning
      audio.currentTime = 0
      
      // Try to play the audio
      await audio.play()
      console.log("Audio played successfully")
    } catch (error: any) {
      console.error("Audio play failed:", error)
      
      // If autoplay is blocked, try to create a new audio context
      if (error.name === 'NotAllowedError') {
        console.log("Autoplay blocked, trying alternative method...")
        
        // Create a new audio element and try to play it
        const newAudio = new Audio("/ring.mp3")
        newAudio.volume = 0.7
        
        try {
          await newAudio.play()
          console.log("Alternative audio method worked")
        } catch (altError: any) {
          console.error("Alternative audio method also failed:", altError)
        }
      }
    }
  }

  // Enable audio on first user interaction
  const enableAudio = () => {
    if (audio && !audioEnabled) {
      audio.play().then(() => {
        audio.pause()
        audio.currentTime = 0
        setAudioEnabled(true)
        console.log("Audio enabled for future notifications")
      }).catch((error: any) => {
        console.log("Could not enable audio:", error)
      })
    }
  }

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }

    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }

    fetchUserData()
    fetchTasks()
  }, [router])

  // Set up reminder checking interval when tasks are loaded
  useEffect(() => {
    if (tasks.length === 0) return

    console.log("Setting up notification interval for", tasks.length, "tasks")

    // Set up reminder checking interval - check more frequently for better accuracy
    const reminderInterval = setInterval(() => {
      console.log("Running scheduled reminder check...")
      checkForDueReminders()
    }, 5000) // Check every 5 seconds for better accuracy

    // Also check immediately for any overdue tasks
    checkForOverdueTasks()

    return () => {
      console.log("Clearing notification interval")
      clearInterval(reminderInterval)
    }
  }, [tasks]) // Re-create interval when tasks change

  const checkForOverdueTasks = () => {
    const now = new Date()
    const overdueTasks = tasks.filter((task) => 
      task.status === "pending" && 
      new Date(task.reminderTime) < now && 
      !task.reminderSent
    )

    console.log(`Found ${overdueTasks.length} overdue tasks`)

    overdueTasks.forEach((task) => {
      // Trigger notification for overdue tasks
      triggerReminder(task)
      // Mark as reminder sent
      setTasks((prevTasks) => prevTasks.map((t) => (t._id === task._id ? { ...t, reminderSent: true } : t)))
      updateReminderSentStatus(task._id)
    })
  }

  const checkForDueReminders = () => {
    const now = new Date()
    const pendingTasks = tasks.filter((task) => task.status === "pending")

    console.log(`Checking ${pendingTasks.length} pending tasks for reminders...`)

    pendingTasks.forEach((task) => {
      const reminderTime = new Date(task.reminderTime)
      const timeDiff = now.getTime() - reminderTime.getTime()

      console.log(`Task "${task.title}": ${timeDiff}ms from due time, reminderSent: ${task.reminderSent}`)

      // If reminder time has passed and it's within the last 5 minutes (to avoid spam)
      // Also check if we haven't already sent a reminder for this task
      if (timeDiff >= 0 && timeDiff <= 300000 && !task.reminderSent) {
        console.log(`Triggering reminder for task: ${task.title}`)
        triggerReminder(task)
        // Mark as reminder sent locally to avoid duplicate notifications
        setTasks((prevTasks) => prevTasks.map((t) => (t._id === task._id ? { ...t, reminderSent: true } : t)))
        
        // Also update the database to persist the reminder sent status
        updateReminderSentStatus(task._id)
      }
    })
  }

  const updateReminderSentStatus = async (taskId: string) => {
    try {
      const token = localStorage.getItem("token")
      await fetch(`/api/tasks/${taskId}/reminder-sent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
    } catch (error: any) {
      console.error("Error updating reminder sent status:", error)
    }
  }

  const triggerReminder = (task: Task) => {
    console.log(`🔔 Triggering reminder for task: ${task.title}`)
    
    // Play audio notification
    playNotificationSound()

    // Show visual notification alert
    setNotificationAlert({
      title: `🔔 Task Reminder: ${task.title}`,
      description: task.description || "You have a task due now!"
    })

    // Auto-hide the alert after 10 seconds
    setTimeout(() => setNotificationAlert(null), 10000)

    // Show browser notification
    if ("Notification" in window && Notification.permission === "granted") {
      console.log("Showing browser notification...")
      new Notification(`🔔 Task Reminder: ${task.title}`, {
        body: task.description || "You have a task due now!",
        icon: "/favicon.ico",
        tag: task._id,
        requireInteraction: true,
        silent: false, // Ensure sound plays even if audio element fails
      })
    } else {
      console.log("Browser notifications not available or not granted")
    }

    // Show alert as fallback
    console.log("Showing alert fallback...")
    alert(
      `🔔 TASK REMINDER!\n\n${task.title}\n${task.description || ""}\n\nDue: ${new Date(task.reminderTime).toLocaleString()}`,
    )
  }

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
    }
  }

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/tasks", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const tasksData = await response.json()
        setTasks(tasksData)
      }
    } catch (error) {
      console.error("Error fetching tasks:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsCreatingTask(true)

    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          reminderTime: localToUTCISOString(formData.reminderTime),
        }),
      })

      if (response.ok) {
        setFormData({ title: "", description: "", priority: "medium", reminderTime: "" })
        setIsCreateDialogOpen(false)
        fetchTasks()
      } else {
        const data = await response.json()
        setError(data.error || "Failed to create task")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setIsCreatingTask(false)
    }
  }

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTask) return

    setUpdatingTaskId(editingTask._id)

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/tasks/${editingTask._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          reminderTime: localToUTCISOString(formData.reminderTime),
        }),
      })

      if (response.ok) {
        setEditingTask(null)
        setFormData({ title: "", description: "", priority: "medium", reminderTime: "" })
        fetchTasks()
      }
    } catch (error) {
      console.error("Error updating task:", error)
    } finally {
      setUpdatingTaskId(null)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return

    setDeletingTaskId(taskId)
    
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        fetchTasks()
      }
    } catch (error) {
      console.error("Error deleting task:", error)
    } finally {
      setDeletingTaskId(null)
    }
  }

  const handleCompleteTask = async (taskId: string) => {
    setCompletingTaskId(taskId)
    
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "completed" }),
      })

      if (response.ok) {
        fetchTasks()
        // Switch to completed tab to show the completed task
        setActiveTab("completed")
      }
    } catch (error) {
      console.error("Error completing task:", error)
    } finally {
      setCompletingTaskId(null)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    router.push("/")
  }

  const openEditDialog = (task: Task) => {
    setEditingTask(task)
    setFormData({
      title: task.title,
      description: task.description,
      priority: task.priority,
      reminderTime: utcToLocalInputValue(task.reminderTime),
    })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusColor = (status: string) => {
    return status === "completed"
      ? "bg-green-100 text-green-800 border-green-200"
      : "bg-blue-100 text-blue-800 border-blue-200"
  }

  const isTaskOverdue = (task: Task) => {
    if (task.status === "completed") return false
    const now = new Date()
    const reminderTime = new Date(task.reminderTime)
    return now > reminderTime
  }

  const getTimeUntilReminder = (reminderTime: string) => {
    const now = new Date()
    const reminder = new Date(reminderTime)
    const diff = reminder.getTime() - now.getTime()

    if (diff < 0) return "Overdue"

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const pendingTasks = tasks.filter((task) => task.status === "pending")
  const completedTasks = tasks.filter((task) => task.status === "completed")
  const overdueTasks = pendingTasks.filter(isTaskOverdue)

  // Debug function to test notification system
  const debugNotificationSystem = () => {
    console.log("=== Notification System Debug ===")
    console.log("Audio element:", audio)
    console.log("Audio enabled:", audioEnabled)
    console.log("Tasks loaded:", tasks.length)
    console.log("Pending tasks:", tasks.filter(t => t.status === "pending").length)
    console.log("Current time:", new Date().toLocaleString())
    
    const pendingTasks = tasks.filter(t => t.status === "pending")
    pendingTasks.forEach(task => {
      const reminderTime = new Date(task.reminderTime)
      const timeDiff = reminderTime.getTime() - new Date().getTime()
      console.log(`Task "${task.title}": Due in ${Math.round(timeDiff/1000)}s, reminderSent: ${task.reminderSent}`)
    })
  }

  // Create a test task that's due in the next minute
  const createTestTask = async () => {
    setIsCreatingTestTask(true)
    
    const testTime = new Date()
    testTime.setMinutes(testTime.getMinutes() + 1) // Due in 1 minute
    
    const testTask = {
      title: "Test Task - Due in 1 minute",
      description: "This is a test task to verify notifications work",
      priority: "high" as "low" | "medium" | "high",
      reminderTime: testTime.toISOString().slice(0, 16), // Format for datetime-local input
    }

    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(testTask),
      })

      if (response.ok) {
        console.log("Test task created successfully")
        fetchTasks() // Refresh tasks
      } else {
        console.error("Failed to create test task")
      }
    } catch (error) {
      console.error("Error creating test task:", error)
    } finally {
      setIsCreatingTestTask(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <CheckCircle className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading your tasks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notification Alert */}
      {notificationAlert && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md">
          <Alert className="border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <div className="font-semibold">{notificationAlert.title}</div>
              <div className="text-sm mt-1">{notificationAlert.description}</div>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          {/* Desktop Header */}
          <div className="hidden md:flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">TaskMaster</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
              <div className="flex items-center space-x-2 text-xs">
                <Bell className={`h-3 w-3 ${audioEnabled ? 'text-green-500' : 'text-gray-400'}`} />
                <span className={audioEnabled ? 'text-green-600' : 'text-gray-500'}>
                  {audioEnabled ? 'Audio Enabled' : 'Click to Enable Audio'}
                </span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  enableAudio() // Enable audio first
                  setTimeout(() => {
                    triggerReminder({
                      _id: "test",
                      title: "Test Notification",
                      description: "This is a test notification to verify the system is working.",
                      priority: "medium",
                      status: "pending",
                      reminderTime: new Date().toISOString(),
                      createdAt: new Date().toISOString(),
                    })
                  }, 100) // Small delay to ensure audio is enabled
                }}
              >
                <Bell className="h-4 w-4 mr-2" />
                Test Notification
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={debugNotificationSystem}
              >
                Debug
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={createTestTask}
                disabled={isCreatingTestTask}
              >
                {isCreatingTestTask ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600 mr-1"></div>
                    Creating...
                  </>
                ) : (
                  "Create Test Task"
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>

          {/* Mobile Header */}
          <div className="md:hidden">
            {/* Top row - Logo and Logout */}
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-6 w-6 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">TaskMaster</h1>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Second row - Welcome message and audio status */}
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
              <div className="flex items-center space-x-2 text-xs">
                <Bell className={`h-3 w-3 ${audioEnabled ? 'text-green-500' : 'text-gray-400'}`} />
                <span className={audioEnabled ? 'text-green-600' : 'text-gray-500'}>
                  {audioEnabled ? 'Audio On' : 'Audio Off'}
                </span>
              </div>
            </div>

            {/* Third row - Action buttons */}
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  enableAudio() // Enable audio first
                  setTimeout(() => {
                    triggerReminder({
                      _id: "test",
                      title: "Test Notification",
                      description: "This is a test notification to verify the system is working.",
                      priority: "medium",
                      status: "pending",
                      reminderTime: new Date().toISOString(),
                      createdAt: new Date().toISOString(),
                    })
                  }, 100) // Small delay to ensure audio is enabled
                }}
                className="text-xs"
              >
                <Bell className="h-3 w-3 mr-1" />
                Test
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={debugNotificationSystem}
                className="text-xs"
              >
                Debug
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={createTestTask}
                className="text-xs"
              >
                Test Task
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Total Tasks</CardTitle>
              <Calendar className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-2xl font-bold">{tasks.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Pending</CardTitle>
              <Clock className="h-3 w-3 md:h-4 md:w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-2xl font-bold text-blue-600">{pendingTasks.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-3 w-3 md:h-4 md:w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-2xl font-bold text-green-600">{completedTasks.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Overdue</CardTitle>
              <AlertCircle className="h-3 w-3 md:h-4 md:w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-2xl font-bold text-red-600">{overdueTasks.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Create Task Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Task Management</h2>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                onClick={enableAudio} // Enable audio on first interaction
              >
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Create New Task</span>
                <span className="sm:hidden">Create Task</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription>Add a new task with reminder settings</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Task Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter task title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter task description (optional)"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: "low" | "medium" | "high") => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">🟢 Low Priority</SelectItem>
                      <SelectItem value="medium">🟡 Medium Priority</SelectItem>
                      <SelectItem value="high">🔴 High Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reminderTime">Reminder Date & Time *</Label>
                  <Input
                    id="reminderTime"
                    type="datetime-local"
                    value={formData.reminderTime}
                    onChange={(e) => setFormData({ ...formData, reminderTime: e.target.value })}
                    required
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isCreatingTask}
                >
                  {isCreatingTask ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating Task...
                    </>
                  ) : (
                    "Create Task"
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tasks Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pending" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
              <Clock className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Pending Tasks</span>
              <span className="sm:hidden">Pending</span>
              <span className="ml-1">({pendingTasks.length})</span>
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
              <CheckCircle className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Completed Tasks</span>
              <span className="sm:hidden">Completed</span>
              <span className="ml-1">({completedTasks.length})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6">
            {pendingTasks.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No pending tasks</h3>
                  <p className="text-gray-600 mb-4">Create your first task to get started</p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Task
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {pendingTasks.map((task) => (
                  <Card
                    key={task._id}
                    className={`hover:shadow-lg transition-all duration-200 ${isTaskOverdue(task) ? "border-red-200 bg-red-50" : "hover:shadow-lg"}`}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base md:text-lg flex items-center gap-2">
                          {isTaskOverdue(task) && <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-red-500" />}
                          {task.title}
                        </CardTitle>
                        <div className="flex space-x-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => openEditDialog(task)}
                            disabled={deletingTaskId === task._id}
                          >
                            <Edit className="h-3 w-3 md:h-4 md:w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteTask(task._id)}
                            disabled={deletingTaskId === task._id}
                          >
                            {deletingTaskId === task._id ? (
                              <div className="animate-spin rounded-full h-3 w-3 md:h-4 md:w-4 border-b-2 border-red-500"></div>
                            ) : (
                              <Trash2 className="h-3 w-3 md:h-4 md:w-4 text-red-500" />
                            )}
                          </Button>
                        </div>
                      </div>
                      {task.description && <CardDescription className="text-xs md:text-sm">{task.description}</CardDescription>}
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                          {task.priority === "high" ? "🔴" : task.priority === "medium" ? "🟡" : "🟢"} {task.priority}
                        </Badge>
                        {isTaskOverdue(task) && (
                          <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">⚠️ Overdue</Badge>
                        )}
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-xs md:text-sm text-gray-600">
                          <Bell className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                          <span className="font-medium">Due:</span>
                          <span className="ml-1">{new Date(task.reminderTime).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center text-xs md:text-sm">
                          <Clock className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                          <span className={`font-medium ${isTaskOverdue(task) ? "text-red-600" : "text-blue-600"}`}>
                            {getTimeUntilReminder(task.reminderTime)}
                          </span>
                        </div>
                      </div>

                      <Button
                        onClick={() => handleCompleteTask(task._id)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white text-xs md:text-sm"
                        size="sm"
                        disabled={completingTaskId === task._id}
                      >
                        {completingTaskId === task._id ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 md:h-4 md:w-4 border-b-2 border-white mr-2"></div>
                            <span className="hidden sm:inline">Completing...</span>
                            <span className="sm:hidden">...</span>
                          </>
                        ) : (
                          <>
                            <Check className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                            <span className="hidden sm:inline">Mark as Completed</span>
                            <span className="sm:hidden">Complete</span>
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            {completedTasks.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <CheckCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No completed tasks yet</h3>
                  <p className="text-gray-600">Complete some tasks to see them here</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {completedTasks.map((task) => (
                  <Card key={task._id} className="hover:shadow-lg transition-shadow bg-green-50 border-green-200">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base md:text-lg flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                          {task.title}
                        </CardTitle>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteTask(task._id)}
                          disabled={deletingTaskId === task._id}
                        >
                          {deletingTaskId === task._id ? (
                            <div className="animate-spin rounded-full h-3 w-3 md:h-4 md:w-4 border-b-2 border-red-500"></div>
                          ) : (
                            <Trash2 className="h-3 w-3 md:h-4 md:w-4 text-red-500" />
                          )}
                        </Button>
                      </div>
                      {task.description && <CardDescription className="text-xs md:text-sm">{task.description}</CardDescription>}
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                          {task.priority === "high" ? "🔴" : task.priority === "medium" ? "🟡" : "🟢"} {task.priority}
                        </Badge>
                        <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">✅ Completed</Badge>
                      </div>

                      <div className="flex items-center text-xs md:text-sm text-gray-600">
                        <Calendar className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                        <span className="font-medium">Was due:</span>
                        <span className="ml-1">{new Date(task.reminderTime).toLocaleString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Edit Task Dialog */}
        <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
              <DialogDescription>Update your task details</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateTask} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Task Title *</Label>
                <Input
                  id="edit-title"
                  placeholder="Enter task title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  placeholder="Enter task description (optional)"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: "low" | "medium" | "high") => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">🟢 Low Priority</SelectItem>
                    <SelectItem value="medium">🟡 Medium Priority</SelectItem>
                    <SelectItem value="high">🔴 High Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-reminderTime">Reminder Date & Time *</Label>
                <Input
                  id="edit-reminderTime"
                  type="datetime-local"
                  value={formData.reminderTime}
                  onChange={(e) => setFormData({ ...formData, reminderTime: e.target.value })}
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={editingTask ? updatingTaskId === editingTask._id : false}
              >
                {editingTask && updatingTaskId === editingTask._id ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating Task...
                  </>
                ) : (
                  "Update Task"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

