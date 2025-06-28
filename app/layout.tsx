import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import NotificationHandler from "@/components/notification-handler"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "TaskMaster - Smart Task Management",
  description: "Manage your tasks with intelligent reminders and notifications",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <NotificationHandler />
      </body>
    </html>
  )
}
