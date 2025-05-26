"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Building, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { MapSearch } from "@/components/MapSearch";

interface PropertyData {
  address: string;
  latitude: number;
  longitude: number;
  type: string;
  zoning: string;
  parcelId: string;
  owner: string;
  lastSale: {
    date: string;
    amount: string;
  };
  area: string;
  yearBuilt: string;
}

function PropertyPageContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [propertyData, setPropertyData] = useState<PropertyData | null>(null);
  
  // Get lat/lng from URL query parameters
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  useEffect(() => {
    const fetchPropertyData = async () => {
      if (!lat || !lng) return;

      try {
        setLoading(true);
        // In a real app, you would fetch property data from your API
        // This is simulated data for demonstration
        
        // Simulating API call with timeout
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Get address from reverse geocoding
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
        );
        const data = await response.json();
        
        const address = data.features?.[0]?.place_name || "Unknown Address";
        
        setPropertyData({
          address,
          latitude: parseFloat(lat),
          longitude: parseFloat(lng),
          type: "Commercial", // Placeholder - would come from your data
          zoning: "B-1",
          parcelId: "12345-67890",
          owner: "ABC Properties LLC",
          lastSale: {
            date: "2022-04-15",
            amount: "$2,450,000"
          },
          area: "12,500 sq ft",
          yearBuilt: "1998",
        });
      } catch (error) {
        console.error("Error fetching property data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPropertyData();
  }, [lat, lng]);

  if (!lat || !lng) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" asChild className="mr-2">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-medium tracking-tight font-cal-sans">Property Not Found</h1>
          </div>
          <p>No property coordinates provided. Please select a property from the map.</p>
          <Button asChild>
            <Link href="/dashboard">Go Back to Search</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="icon" asChild className="mr-2">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32 mb-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full mb-4" />
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </CardContent>
          </Card>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32 mb-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32 mb-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" asChild className="mr-2">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-medium tracking-tight font-cal-sans">
          Property Details
        </h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Map and Location */}
        <Card>
          <CardHeader>
            <CardTitle className="font-cal-sans font-normal">Location</CardTitle>
            <CardDescription>{propertyData?.address}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <MapSearch 
                onLocationSelect={() => {}} 
                initialLocation={propertyData ? 
                  { latitude: propertyData.latitude, longitude: propertyData.longitude, address: propertyData.address } 
                  : undefined
                }
              />
            </div>
            <div className="flex items-center gap-2 mt-4">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>
                Coordinates: {propertyData?.latitude.toFixed(6)}, {propertyData?.longitude.toFixed(6)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Property Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-cal-sans font-normal">Property Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-muted-foreground">Property Type</dt>
                  <dd className="font-medium">
                    <Badge variant="secondary" className="mt-1">
                      <Building className="h-3 w-3 mr-1" />
                      {propertyData?.type}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Zoning</dt>
                  <dd className="font-medium">{propertyData?.zoning}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Parcel ID</dt>
                  <dd className="font-medium">{propertyData?.parcelId}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Owner</dt>
                  <dd className="font-medium">{propertyData?.owner}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Last Sale</dt>
                  <dd className="font-medium">
                    {propertyData?.lastSale.date} ({propertyData?.lastSale.amount})
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Area</dt>
                  <dd className="font-medium">{propertyData?.area}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Year Built</dt>
                  <dd className="font-medium">{propertyData?.yearBuilt}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="font-cal-sans font-normal">Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline">Save Property</Button>
                <Button variant="outline">Generate Report</Button>
                <Button variant="outline">Contact Owner</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function PropertyPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="icon" asChild className="mr-2">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32 mb-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full mb-4" />
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </CardContent>
          </Card>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32 mb-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    }>
      <PropertyPageContent />
    </Suspense>
  );
} 