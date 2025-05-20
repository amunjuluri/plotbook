"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"

interface User {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image?: string | null
  createdAt: Date
  updatedAt: Date
}

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    checkAuth()
  }, [])
  
  const checkAuth = async () => {
    try {
      const session = await authClient.getSession()
      if (!session.data?.user) {
        router.push("/signin")
        return
      }
      console.log(session.data.user)
      setUser(session.data.user)
    } catch (error) {
      console.error("Not Authorized",error)
      router.push("/signin")
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await authClient.signOut()
    router.push("/signin")
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Sign Out
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Welcome, {user?.name}!</h2>
          <p className="text-gray-600">Email: {user?.email}</p>
          <p className="text-gray-600">User ID: {user?.id}</p>
        </div>
      </div>
    </div>
  )
}