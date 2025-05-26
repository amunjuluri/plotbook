"use client";

import { useState, useEffect } from 'react';
import { authClient } from '@/lib/auth-client';

interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  role?: string;
  companyId?: string;
  createdAt: Date;
  updatedAt: Date;
  canAccessDashboard?: boolean;
  canAccessSavedProperties?: boolean;
  canAccessTeamManagement?: boolean;
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const session = await authClient.getSession();
        if (session.data?.user) {
          // Use session data directly if it has all the fields we need
          const sessionUser = session.data.user as User;
          if (sessionUser.canAccessDashboard !== undefined) {
            setUser(sessionUser);
          } else {
            // Fallback to API call only if session doesn't have permission data
            const userResponse = await fetch('/api/user/me', {
              cache: 'no-store',
              headers: {
                'Cache-Control': 'no-cache'
              }
            });
            
            if (userResponse.ok) {
              const userData = await userResponse.json();
              setUser(userData.user);
            } else {
              setUser(sessionUser);
            }
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        setError('Failed to fetch user');
        console.error('Error fetching user:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const isAdmin = user?.role === 'admin';
  const isAuthenticated = !!user;

  return {
    user,
    loading,
    error,
    isAdmin,
    isAuthenticated,
    refetch: async () => {
      setLoading(true);
      try {
        // Always fetch fresh data from API when explicitly requested
        const userResponse = await fetch('/api/user/me', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData.user);
        } else {
          // Fallback to auth client
          const session = await authClient.getSession();
          if (session.data?.user) {
            setUser(session.data.user as User);
          } else {
            setUser(null);
          }
        }
      } catch (err) {
        setError('Failed to refresh user session');
        console.error('Error refreshing user:', err);
      } finally {
        setLoading(false);
      }
    }
  };
} 