"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { DashboardLayout } from '@/components/DashboardLayout';
import { TeamDashboard } from '@/components/team/TeamDashboard';
import { Loader2, Shield, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function TeamPage() {
  const router = useRouter();
  const { user, loading } = useUser();
  const [mounted, setMounted] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin');
    }
  }, [user, loading, router]);

  // Check backend permission
  useEffect(() => {
    const checkPermission = async () => {
      if (!user) return;
      
      try {
        const response = await fetch('/api/user/check-permission', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ permission: 'canAccessTeamManagement' }),
        });
        
        const data = await response.json();
        setHasPermission(data.hasPermission);
        
        if (!data.hasPermission) {
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Error checking permission:', error);
        router.push('/dashboard');
      }
    };

    if (user && mounted) {
      checkPermission();
    }
  }, [user, mounted, router]);

  if (!mounted || loading || hasPermission === null) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading team dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!hasPermission) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <Card className="max-w-md w-full">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
              <p className="text-gray-600 mb-6">
                You don't have permission to access the team management dashboard.
              </p>
              <Button onClick={() => router.push('/dashboard')} className="w-full">
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Team Dashboard Component */}
          <TeamDashboard />
        </div>
      </div>
    </DashboardLayout>
  );
} 