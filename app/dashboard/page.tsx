"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Building, ArrowUpRight, Search, Bookmark, Download, Users } from "lucide-react";
import Link from "next/link";

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
}

// Mock data for dashboard stats and recents
const stats = [
  { title: "Searches This Month", value: "42" },
  { title: "Properties Saved", value: "16" },
  { title: "Exports Created", value: "7" },
];

const recentProperties = [
  {
    id: "1",
    address: "123 Main St, New York, NY 10001",
    type: "Commercial",
    owner: "ABC Properties LLC",
  },
  {
    id: "2",
    address: "456 Market Ave, San Francisco, CA 94103",
    type: "Residential",
    owner: "XYZ Holdings Inc",
  },
  {
    id: "3",
    address: "789 Oak Blvd, Chicago, IL 60601",
    type: "Mixed-Use",
    owner: "Midwest Development Group",
  },
];

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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          {/* Loading skeleton */}
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          
          {/* Stats Loading */}
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-12" />
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Recent Activity Loading */}
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2].map((i) => (
              <Card key={i} className="col-span-1">
                <CardHeader>
                  <Skeleton className="h-5 w-32 mb-1" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="flex items-center space-x-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-[200px]" />
                          <Skeleton className="h-3 w-[150px]" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
            Here&apos;s what&apos;s happening with your PlotBook account today.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-3">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-normal font-cal-sans">{stat.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-medium font-cal-sans">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Recent Properties */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="font-cal-sans font-normal">Recent Properties</CardTitle>
              <CardDescription>Properties you&apos;ve recently viewed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentProperties.map((property) => (
                  <div key={property.id} className="flex items-start space-x-3">
                    <div className="rounded-full bg-gray-100 p-2">
                      <MapPin className="h-4 w-4 text-[#1E1433]" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{property.address}</p>
                      <div className="flex text-sm text-muted-foreground gap-2">
                        <Badge variant="secondary" className="flex items-center gap-1 h-5">
                          <Building className="h-3 w-3" />
                          {property.type}
                        </Badge>
                        <span>•</span>
                        <span>{property.owner}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/dashboard/search/${property.id}`}>
                        <ArrowUpRight className="h-4 w-4 text-[#D2966E]" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="font-cal-sans font-normal">Quick Actions</CardTitle>
              <CardDescription>Commonly used features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { title: "New Search", href: "/dashboard/search", icon: <Search className="h-5 w-5" /> },
                  { title: "View Saved", href: "/dashboard/saved", icon: <Bookmark className="h-5 w-5" /> },
                  { title: "Create Export", href: "/dashboard/exports", icon: <Download className="h-5 w-5" /> },
                  { title: "Team Access", href: "/dashboard/team", icon: <Users className="h-5 w-5" /> },
                ].map((action, index) => (
                  <Button 
                    key={index} 
                    variant="outline" 
                    className="h-auto py-6 flex flex-col items-center justify-center" 
                    asChild
                  >
                    <Link href={action.href}>
                      <div className="rounded-full bg-background p-2 shadow-sm mb-2 border border-input">
                        {action.icon}
                      </div>
                      <span className="text-sm font-normal font-cal-sans">{action.title}</span>
                    </Link>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
} 