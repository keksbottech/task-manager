"use client"

import { useState, useEffect } from "react"

// Global audio instance that can be accessed throughout the app
let globalAudio: HTMLAudioElement | null = null

export default function NotificationHandler() {
  const [audio] = useState(() => {
    if (typeof window !== "undefined") {
      if (!globalAudio) {
        globalAudio = new Audio("/ring.mp3")
        globalAudio.volume = 0.7
        globalAudio.preload = "auto"
        
        // Add error handling
        globalAudio.addEventListener('error', (e: Event) => {
          console.error('Audio loading error:', e)
        })
        
        // Add to window object for global access
        ;(window as any).notificationAudio = globalAudio
      }
      return globalAudio
    }
    return null
  })

  useEffect(() => {
    // Request notification permission when component mounts
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }
  }, [])

  // Component doesn't need to render anything, it just handles audio setup
  return null
}

// Export the global audio instance for use in other components
export const getNotificationAudio = () => globalAudio
