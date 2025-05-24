"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { MapSearch, PropertyLocation } from "@/components/MapSearch";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await authClient.getSession();
        if (!session.data?.user) {
          router.push("/signin");
          return;
        }
        // User is authenticated, no need to store user data
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
        {/* Map Search Section - takes full space */}
        <div className="flex-1 w-full h-full overflow-hidden">
          <MapSearch onLocationSelect={handleLocationSelect} />
        </div>
      </div>
    </DashboardLayout>
  );
} 