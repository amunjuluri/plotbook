"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { InviteEmployeeForm } from "@/components/InviteEmployeeForm";
import { authClient } from "@/lib/auth-client";

export default function InvitationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Check if user is admin on client side
  useEffect(() => {
    async function checkAdmin() {
      try {
        const session = await authClient.getSession();
        if (!session.data?.user || session.data.user.role !== "admin") {
          router.push("/");
        }
      } catch (error) {
        console.error("Auth error:", error);
        router.push("/");
      } finally {
        setLoading(false);
      }
    }

    checkAdmin();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Invite Employees</h1>
          <p className="text-muted-foreground">
            Invite employees to join Plotbook by sending them an email invitation.
          </p>
        </div>
        <div className="mt-8">
          <InviteEmployeeForm />
        </div>
      </div>
    </div>
  );
} 