"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Eye, EyeOff, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function SignUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [invitationChecked, setInvitationChecked] = useState(false);
  const [invitationEmail, setInvitationEmail] = useState<string | null>(null);
  const [validatingToken, setValidatingToken] = useState(true);

  // Get token from URL
  const token = searchParams.get('token');

  // Validate invitation token on page load
  useEffect(() => {
    if (!token) {
      setValidatingToken(false);
      setError("An invitation token is required to sign up.");
      return;
    }

    const validateToken = async () => {
      try {
        const response = await fetch(`/api/invitations/validate?token=${token}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Invalid or expired invitation");
        }

        // Set the email from the invitation
        setInvitationEmail(data.email);
        setInvitationChecked(true);
      } catch (err) {
        console.error("Token validation error:", err);
        setError("Invalid or expired invitation link");
      } finally {
        setValidatingToken(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;

    // Check if the email matches the invitation email
    if (invitationEmail && email !== invitationEmail) {
      setError("Email must match the invitation email");
      setLoading(false);
      return;
    }

    try {
      // First, check if user already exists using server-side action
      const checkUserResponse = await fetch('/api/check-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const checkUserData = await checkUserResponse.json();
      
      if (checkUserData.exists) {
        throw new Error("user_exists");
      }
      
      // If user doesn't exist, proceed with signup
      await authClient.signUp.email({
        email,
        password,
        name,
      });

      // Mark the invitation as accepted
      if (token) {
        await fetch('/api/invitations/accept', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });
      }
      
      // Success case
      toast.success("Account created successfully! Please sign in.");
      router.push("/signin");
    } catch (err) {
      console.error("Signup Error:", err);
      
      // Handle specific error types
      let errorMessage = "Failed to create account. Please try again.";
      
      if (err instanceof Error) {
        if (err.message === "user_exists" || err.message.includes("exists")) {
          errorMessage = "This email is already registered. Please sign in instead.";
        } else if (err.message.includes("password")) {
          errorMessage = "Password doesn't meet requirements. Please try a stronger password.";
        }
      }
      
      // Set the error state for the alert
      setError(errorMessage);
      
      // Also show as a toast notification
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // If we're still validating the token or there's no valid invitation, show a loading/error state
  if (validatingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F7F7F7' }}>
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
          <h2 className="text-xl font-semibold">Validating invitation...</h2>
          <p className="text-gray-600 mt-2">Please wait while we validate your invitation.</p>
        </div>
      </div>
    );
  }

  // If token validation failed, show error
  if (!invitationChecked && token) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F7F7F7' }}>
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-600" />
          <h2 className="text-xl font-semibold">Invalid Invitation</h2>
          <p className="text-gray-600 mt-2">{error || "Your invitation link is invalid or has expired."}</p>
          <Button 
            className="mt-6"
            style={{ backgroundColor: '#1E1433' }}
            onClick={() => router.push('/')}
          >
            Go to Homepage
          </Button>
        </div>
      </div>
    );
  }

  // Standard signup form shown only for valid invitations
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
              Complete your registration to join PlotBook
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
                  value={invitationEmail || ""}
                  onChange={(e) => invitationEmail && setInvitationEmail(e.target.value)}
                  readOnly={!!invitationEmail}
                  className="w-full h-12 px-4 text-base rounded-lg border-gray-200 focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all"
                />
                {invitationEmail && (
                  <p className="text-xs text-gray-500 mt-1">
                    This email is associated with your invitation and cannot be changed
                  </p>
                )}
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
                    minLength={8}
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
                  className="font-semibold text-purple-700 hover:text-purple-900 transition-colors duration-200" 
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
