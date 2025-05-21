"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Building, Search } from "lucide-react";
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
  const [selectedLocation, setSelectedLocation] = useState<PropertyLocation | null>(null);

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
    setSelectedLocation(location);
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
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32 mb-1" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-24" />
              </div>
              <Skeleton className="h-[500px] w-full" />
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div>
          <h1 className="text-2xl font-medium tracking-tight font-cal-sans">Welcome back, {user?.name}</h1>
          <p className="text-muted-foreground mt-1">
            Search for properties using the map below.
          </p>
        </div>

        {/* Map Search Section */}
        <Card>
          <CardHeader>
            <CardTitle className="font-cal-sans font-normal">Property Search</CardTitle>
            <CardDescription>Search for properties by address or location</CardDescription>
          </CardHeader>
          <CardContent>
            <MapSearch onLocationSelect={handleLocationSelect} />
          </CardContent>
        </Card>

        {/* Selected Property Information (shows only when property is selected) */}
        {selectedLocation && (
          <Card>
            <CardHeader>
              <CardTitle className="font-cal-sans font-normal">Selected Property</CardTitle>
              <CardDescription>Details about the selected location</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-start space-x-3">
                <div className="rounded-full bg-gray-100 p-2">
                  <MapPin className="h-4 w-4 text-[#1E1433]" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{selectedLocation.address || "Unknown Address"}</p>
                  <div className="flex text-sm text-muted-foreground gap-2">
                    <Badge variant="secondary" className="flex items-center gap-1 h-5">
                      <Building className="h-3 w-3" />
                      Location
                    </Badge>
                    <span>•</span>
                    <span>Lat: {selectedLocation.latitude.toFixed(6)}, Lng: {selectedLocation.longitude.toFixed(6)}</span>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <Button onClick={() => router.push(`/dashboard/property?lat=${selectedLocation.latitude}&lng=${selectedLocation.longitude}`)}>
                  <Search className="h-4 w-4 mr-2" />
                  View Property Details
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
} 