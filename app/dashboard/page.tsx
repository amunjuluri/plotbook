"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { OnboardingTutorial } from "@/components/OnboardingTutorial";
import { OnboardingTrigger } from "@/components/ui/onboarding-trigger";
import { useOnboarding } from "@/hooks/useOnboarding";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { StatsCard } from "@/components/ui/stats-card";
import { EnhancedMapSearch, PropertyLocation } from "@/components/EnhancedMapSearch";
import { Building, Users, DollarSign, Bookmark } from "lucide-react";
import { toast } from "sonner";

interface DashboardStats {
  totalProperties: string;
  totalOwners: string;
  totalValue: string;
  savedProperties: string;
  totalStates: number;
  totalCities: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<PropertyLocation | null>(null);
  const [totalPropertiesOnMap, setTotalPropertiesOnMap] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const { showOnboarding, isCompleted, startOnboarding, setShowOnboarding } = useOnboarding();
  const [userPermissions, setUserPermissions] = useState<{
    canAccessDashboard?: boolean;
    canAccessSavedProperties?: boolean;
    canAccessTeamManagement?: boolean;
  }>({});

  useEffect(() => {
    const checkAuth = async () => {
      // Show initial loading toast
      const loadingToast = toast.loading("Loading dashboard...", {
        description: "Verifying permissions and fetching data"
      });

      try {
        const session = await authClient.getSession();
        if (!session.data?.user) {
          toast.dismiss(loadingToast);
          toast.error("Authentication required", {
            description: "Please sign in to access the dashboard"
          });
          router.push("/signin");
          return;
        }
        
        const user = session.data.user as any; // Type assertion for permissions
        
        // Set user permissions
        setUserPermissions({
          canAccessDashboard: user.canAccessDashboard,
          canAccessSavedProperties: user.canAccessSavedProperties,
          canAccessTeamManagement: user.canAccessTeamManagement
        });
        
        // Check backend permission
        const permissionResponse = await fetch('/api/user/check-permission', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ permission: 'canAccessDashboard' }),
        });
        
        const permissionData = await permissionResponse.json();
        setHasPermission(permissionData.hasPermission);
        
        if (!permissionData.hasPermission) {
          toast.dismiss(loadingToast);
          toast.error("Access denied", {
            description: "You don't have permission to access the dashboard"
          });
          router.push('/saved-properties');
          return;
        }
        
        // Update loading toast
        toast.dismiss(loadingToast);
        const statsToast = toast.loading("Loading dashboard statistics...", {
          description: "Fetching property data from database"
        });
        
        // User is authenticated and has permission, fetch dashboard stats
        await fetchDashboardStats();
        
        toast.dismiss(statsToast);
        toast.success("Dashboard loaded successfully!", {
          description: "All data has been loaded and is ready to explore",
          duration: 3000
        });
        
        // Check if onboarding should be shown (only for first-time users)
        const onboardingCompleted = localStorage.getItem('plotbook_onboarding_completed');
        if (!onboardingCompleted || onboardingCompleted !== 'true') {
          // Show onboarding after a brief delay to let the dashboard load
          setTimeout(() => {
            startOnboarding();
          }, 1500);
        }
        
      } catch (error) {
        console.error("Auth error:", error);
        toast.dismiss(loadingToast);
        toast.error("Failed to load dashboard", {
          description: "An error occurred while loading the dashboard"
        });
        router.push("/signin");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const fetchDashboardStats = async () => {
    try {
      setStatsLoading(true);
      const response = await fetch('/api/dashboard/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast.error("Failed to load statistics", {
        description: "Using fallback data. Please refresh to try again."
      });
      // Fallback to show error state or default values
      setStats({
        totalProperties: "0",
        totalOwners: "0", 
        totalValue: "$0",
        savedProperties: "0",
        totalStates: 0,
        totalCities: 0
      });
    } finally {
      setStatsLoading(false);
    }
  };

  const handlePropertySelect = (property: PropertyLocation) => {
    setSelectedProperty(property);
    toast.success("Property selected", {
      description: `${property.address} - ${property.formattedValue}`,
      duration: 2000
    });
    console.log("Selected property:", property);
  };

  const handlePropertiesChange = (properties: PropertyLocation[]) => {
    setTotalPropertiesOnMap(properties.length);
    if (properties.length > 0) {
      toast.info(`Map updated`, {
        description: `Showing ${properties.length} properties in current view`,
        duration: 2000
      });
    }
    console.log("Properties on map:", properties.length);
  };

  if (loading || hasPermission === null) {
    return (
      <DashboardLayout>
        <div className="p-6 space-y-6">
          {/* Loading skeleton for stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
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
      <div className="p-6 space-y-6">
        {/* Header with Help Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Welcome back! Here's your property intelligence overview.</p>
          </div>
          <OnboardingTrigger 
            onStartOnboarding={startOnboarding}
            variant="outline"
            size="sm"
          />
        </div>

        {/* Stats Cards Row - Real data from database */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {statsLoading ? (
            // Loading state for stats
            [...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))
          ) : (
            <>
              <StatsCard 
                title="Total Properties" 
                value={stats?.totalProperties || "0"} 
                change="Live from database" 
                trend="neutral"
                icon={<Building className="h-6 w-6" />}
              />
              <StatsCard 
                title="Property Owners" 
                value={stats?.totalOwners || "0"} 
                change="Live from database" 
                trend="neutral"
                icon={<Users className="h-6 w-6" />}
              />
              <StatsCard 
                title="Total Value" 
                value={stats?.totalValue || "$0"} 
                change="Live from database" 
                trend="neutral"
                icon={<DollarSign className="h-6 w-6" />}
              />
              <StatsCard 
                title="Saved Properties" 
                value={stats?.savedProperties || "0"} 
                change="Your saved items" 
                trend="neutral"
                icon={<Bookmark className="h-6 w-6" />}
              />
            </>
          )}
        </div>

        {/* Enhanced Property Explorer with Real Data */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-h3 font-cal-sans font-semibold text-gray-900 mb-2">
                  Property Explorer
                </h2>
                <p className="text-gray-600">
                  Explore {stats?.totalProperties || "thousands of"} properties across {stats?.totalStates || "all"} states and {stats?.totalCities || "major"} cities
                </p>
                {totalPropertiesOnMap > 0 && (
                  <p className="text-sm text-blue-600 mt-1">
                    Showing {totalPropertiesOnMap} properties on map
                  </p>
                )}
              </div>
              {stats && (
                <div className="text-right text-sm text-gray-500">
                  <div>Database: Live</div>
                  <div>Last updated: Just now</div>
                  {selectedProperty && (
                    <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                      <div className="text-blue-700 font-medium">Selected:</div>
                      <div className="text-blue-600 text-xs">
                        {selectedProperty.address}
                      </div>
                      <div className="text-blue-600 text-xs">
                        {selectedProperty.formattedValue} • {selectedProperty.propertyType}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="h-[600px]">
            <EnhancedMapSearch 
              onPropertySelect={handlePropertySelect}
              onPropertiesChange={handlePropertiesChange}
            />
          </div>
        </div>
      </div>
      
      {/* Onboarding Tutorial */}
      <OnboardingTutorial
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        userPermissions={userPermissions}
      />
    </DashboardLayout>
  );
}