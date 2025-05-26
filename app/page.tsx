"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useUser();

  useEffect(() => {
    if (!loading && user) {
      // Redirect to the first available tab based on permissions
      if (user.canAccessDashboard) {
        router.replace('/dashboard');
      } else if (user.canAccessSavedProperties) {
        router.replace('/saved-properties');
      } else if (user.canAccessTeamManagement) {
        router.replace('/team');
      } else {
        // If no permissions, redirect to sign in
        router.replace('/signin');
      }
    } else if (!loading && !user) {
      router.replace('/signin');
    }
  }, [user, loading, router]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
