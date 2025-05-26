"use client"

import { useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"

export default function HomePage() {
  const router = useRouter()

  const checkAuth = useCallback(async () => {
    try {
      const session = await authClient.getSession()
      if (session.data?.user) {
        // User is authenticated, redirect to dashboard
        router.push("/dashboard")
      } else {
        // User is not authenticated, redirect to sign in
        router.push("/signin")
      }
    } catch (error) {
      console.error("Auth check failed:", error)
      router.push("/signin")
    }
  }, [router])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading...</p>
      </div>
    </div>
  )
}