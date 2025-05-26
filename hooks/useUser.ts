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
          setUser(session.data.user as User);
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
      const session = await authClient.getSession();
      if (session.data?.user) {
        setUser(session.data.user as User);
      }
      setLoading(false);
    }
  };
} 