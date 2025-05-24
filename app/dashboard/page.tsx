"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { MapSearch, PropertyLocation } from "@/components/MapSearch";

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await authClient.getSession();
        if (!session.data?.user) {
          router.push("/signin");
          return;
        }
        setUser(session.data.user as User);
      } catch (error) {
        console.error("Auth error:", error);
        router.push("/signin");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLocationSelect = (location: PropertyLocation) => {
    // Here you can add additional logic when a location is selected
    console.log("Selected location:", location);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          {/* Loading skeleton */}
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          
          {/* Map Loading Skeleton */}
          <div className="flex-1 min-h-0">
            <Skeleton className="h-[500px] w-full" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="w-full h-full flex flex-col bg-white">
        {/* Minimal Welcome Section */}
        <div className="px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h1 className="text-lg font-medium text-gray-900">Welcome back, {user?.name}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Search for properties on the map
          </p>
        </div>

        {/* Map Search Section - takes remaining space */}
        <div className="flex-1 w-full h-full overflow-hidden">
          <MapSearch onLocationSelect={handleLocationSelect} />
        </div>
      </div>
    </DashboardLayout>
  );
} 