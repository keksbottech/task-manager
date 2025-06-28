import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Clock, Users, Zap } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">TaskMaster</h1>
          </div>
          <div className="space-x-4">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Manage Your Tasks with <span className="text-blue-600">Smart Reminders</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Stay organized and never miss a deadline with our intelligent task management system. Create tasks, set
            reminders, and get notified at the perfect time.
          </p>
          <div className="space-x-4">
            <Link href="/signup">
              <Button size="lg" className="px-8 py-3">
                Start Managing Tasks
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="px-8 py-3 bg-transparent">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">Everything You Need to Stay Productive</h3>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Our comprehensive task management solution helps you organize, prioritize, and complete your work
            efficiently.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <CheckCircle className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Task Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Create, edit, and organize your tasks with an intuitive interface designed for productivity.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Clock className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <CardTitle>Smart Reminders</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Set custom reminder times and receive notifications exactly when you need them.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Users className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <CardTitle>User Authentication</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Secure login system to keep your tasks private and accessible from anywhere.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Zap className="h-12 w-12 text-orange-600 mx-auto mb-4" />
              <CardTitle>Real-time Sync</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Your tasks are automatically saved and synchronized across all your devices.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <CheckCircle className="h-6 w-6" />
            <span className="text-xl font-bold">TaskMaster</span>
          </div>
          <p className="text-gray-400">© 2025 TaskMaster. Built with Next.js and MongoDB.</p>
        </div>
      </footer>
    </div>
  )
}
