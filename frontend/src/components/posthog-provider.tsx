'use client'

import { PostHogProvider as PHProvider } from 'posthog-js/react'

const options = {
  api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  defaults: '2026-05-30',
} as const

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <PHProvider apiKey={process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN as string} options={options}>
      {children}
    </PHProvider>
  )
}
