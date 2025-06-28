# TaskMaster - Smart Task Management

A modern task management application with intelligent reminders and notifications.

## Features

- **Task Management**: Create, edit, delete, and complete tasks
- **Priority Levels**: Set low, medium, or high priority for tasks
- **Smart Reminders**: Set due dates and times for tasks
- **Notification System**: Multiple notification types when tasks are due

## Notification System

The app includes a comprehensive notification system that triggers when tasks become due:

### Notification Types

1. **Audio Notification**: Plays a ring sound (`/public/ring.mp3`)
2. **Browser Notification**: Native browser notifications (requires permission)
3. **Visual Alert**: In-app notification banner
4. **Fallback Alert**: Browser alert dialog

### How It Works

- **Real-time Checking**: The app checks for due tasks every 10 seconds
- **Overdue Detection**: Tasks that are already overdue when the page loads will trigger notifications
- **Duplicate Prevention**: Each task can only trigger one notification (tracked via `reminderSent` flag)
- **Persistent State**: Notification status is saved to the database

### Testing Notifications

Use the "Test Notification" button in the header to manually trigger a notification and verify the system is working.

### Browser Permissions

The app will request notification permission when you first visit. Grant permission to receive browser notifications.

## Setup

1. Install dependencies: `npm install`
2. Set up MongoDB connection
3. Run the development server: `npm run dev`
4. Open [http://localhost:3000](http://localhost:3000)

## Troubleshooting

If notifications aren't working:

1. Check browser console for error messages
2. Ensure notification permissions are granted
3. Verify the audio file exists at `/public/ring.mp3`
4. Try the "Test Notification" button to verify the system

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
