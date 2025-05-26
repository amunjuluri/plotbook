"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Eye, EyeOff, AlertCircle, LogIn } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

type User = {
  id: string
  name: string
  email: string
  role?: string
}

export default function SignInPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    // Show loading toast
    const loadingToast = toast.loading("Signing you in...", {
      description: "Please wait while we verify your credentials"
    })

    try {
      await authClient.signIn.email({
        email,
        password,
      })
      
      // Get the user data including role
      const session = await authClient.getSession()
      
      if (session.data?.user as User | undefined) {
        // Dismiss loading toast and show success
        toast.dismiss(loadingToast)
        toast.success("Welcome back!", {
          description: "You have been successfully signed in.",
          duration: 3000,
        })
        
        // Small delay to show the success message
        setTimeout(() => {
          router.push("/dashboard")
        }, 1000)
      }
    } catch (err) {
      console.error("Signin error", err)
      
      // Dismiss loading toast and show error
      toast.dismiss(loadingToast)
      
      let errorMessage = "Invalid email or password. Please try again."
      
      if (err instanceof Error) {
        if (err.message.includes("Invalid credentials")) {
          errorMessage = "Invalid email or password. Please check your credentials."
        } else if (err.message.includes("Account not found")) {
          errorMessage = "No account found with this email. Please sign up first."
        } else if (err.message.includes("Too many attempts")) {
          errorMessage = "Too many failed attempts. Please try again later."
        }
      }
      
      setError(errorMessage)
      toast.error("Sign in failed", {
        description: errorMessage,
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#F7F7F7' }}>
      {/* Left side - Beautiful branding */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-gradient-to-br"
          style={{
            backgroundImage: "linear-gradient(135deg, #1E1433 0%, #432C5F 50%, #9D8CB4 100%)"
          }}
        />
        
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full blur-xl"></div>
          <div className="absolute bottom-40 right-20 w-48 h-48 bg-white rounded-full blur-2xl"></div>
          <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-white rounded-full blur-lg"></div>
        </div>
        
        <div className="relative z-10 flex flex-col justify-center w-full p-12 xl:p-20 text-white">
          <div className="max-w-lg">
            <h1 className="text-6xl xl:text-7xl font-bold mb-6">
              <span>plotbook.</span>
            </h1>
            <p className="text-2xl xl:text-3xl font-light mb-8 leading-relaxed">
              Welcome back to property intelligence
            </p>
            <p className="text-lg opacity-80 leading-relaxed mb-8">
              Access your dashboard to explore
            </p>
            
            {/* Feature highlights */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                <span className="text-sm opacity-90">Property analytics</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                <span className="text-sm opacity-90">Interactive mapping tools</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                <span className="text-sm opacity-90">Owner and transaction insights</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Modern sign in form */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-8">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-4xl font-bold">
              <span style={{ color: '#D2966E' }}>Plot</span>
              <span style={{ color: '#1E1433' }}>Book</span>
            </h1>
          </div>

          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3" style={{ color: '#1E1433' }}>
              Welcome back
            </h2>
            <p className="text-gray-600 text-lg">
              Sign in to your PlotBook account
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            {error && (
              <Alert variant="destructive" className="mb-6 border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  required
                  className="w-full h-12 px-4 text-base rounded-lg border-gray-200 focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    required
                    className="w-full h-12 px-4 pr-12 text-base rounded-lg border-gray-200 focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500 hover:text-gray-700 transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>
                
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-base font-semibold text-white transition-all duration-200 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:transform-none disabled:hover:shadow-md"
                style={{ 
                  backgroundColor: loading ? '#9CA3AF' : '#1E1433',
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing you in...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-5 w-5" />
                    Sign In
                  </>
                )}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <Link 
                  href="/signup" 
                  className="font-semibold text-purple-700 hover:text-purple-900 transition-colors duration-200"
                >
                  Sign up here
                </Link>
              </p>
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-gray-500">
            By signing in, you agree to our{" "}
            <Link href="/signin" className="underline hover:text-gray-700">Terms of Service</Link>
            {" "}and{" "}
            <Link href="/signin" className="underline hover:text-gray-700">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  )
}