"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Eye, EyeOff, AlertCircle } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;

    try {
      await authClient.signUp.email({
        email,
        password,
        name,
      });

      router.push("/signin");
    } catch (err) {
      console.error("Signup Error:", err);
      setError("Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#F7F7F7' }}>
      {/* Left side - Simplified branding */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-gradient-to-br"
          style={{
            backgroundImage: "linear-gradient(135deg, #1E1433 0%, #432C5F 50%, #9D8CB4 100%)"
          }}
        />
        
        <div className="relative z-10 flex flex-col justify-center w-full p-12 xl:p-20 text-white">
          <div className="max-w-lg">
            <h1 className="text-6xl xl:text-7xl font-bold mb-6">
              <span style={{ color: '#D2966E' }}>Plot</span>Book
            </h1>
            <p className="text-2xl xl:text-3xl font-light mb-8 leading-relaxed">
              Property intelligence made simple
            </p>
            <p className="text-lg opacity-80 leading-relaxed">
              Access comprehensive property data and owner insights in one powerful platform. 
              Make informed decisions with real-time analytics and mapping tools.
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Clean sign up form */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-8">
        <div className="w-full max-w-md mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold mb-3">
              <span style={{ color: '#D2966E' }}>Plot</span>
              <span style={{ color: '#1E1433' }}>Book</span>
            </h1>
            <h2 className="text-2xl font-semibold mb-2" style={{ color: '#1E1433' }}>
              Create your account
            </h2>
            <p className="text-gray-600">
              Start your journey with PlotBook today
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
                <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                  Full Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter your full name"
                  required
                  className="w-full h-12 px-4 text-base rounded-lg border-gray-200 focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all"
                />
              </div>

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
                    placeholder="Create a strong password"
                    required
                    className="w-full h-12 px-4 pr-12 text-base rounded-lg border-gray-200 focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Must be at least 8 characters with uppercase and lowercase letters
                </p>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-base font-semibold text-white transition-all duration-200 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                style={{ 
                  backgroundColor: '#1E1433',
                  ...(loading ? {} : {
                    '&:hover': { backgroundColor: '#432C5F' }
                  })
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating your account...
                  </>
                ) : (
                  "Get Started"
                )}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <a 
                  href="/signin" 
                  className="font-semibold transition-colors duration-200" 
                  style={{ color: '#9D8CB4' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#432C5F'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#9D8CB4'}
                >
                  Sign in instead
                </a>
              </p>
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-gray-500">
            By creating an account, you agree to our{" "}
            <a href="/terms" className="underline hover:text-gray-700">Terms of Service</a>
            {" "}and{" "}
            <a href="/privacy" className="underline hover:text-gray-700">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}