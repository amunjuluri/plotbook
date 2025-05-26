"use client";

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Users, 
  Settings, 
  Activity, 
  UserPlus,
  Shield,
  UserCheck,
  Building2,
  Clock,
  Mail,
  Send
} from 'lucide-react';
import { TeamMembersTab } from './TeamMembersTab';
import { ActivityLogsTab } from './ActivityLogsTab';
import { toast } from 'sonner';

interface TeamStats {
  totalMembers: number;
  activeMembers: number;
  pendingInvitations: number;
  totalRoles: number;
}

export function TeamDashboard() {
  const [activeTab, setActiveTab] = useState('members');
  const [stats, setStats] = useState<TeamStats>({
    totalMembers: 0,
    activeMembers: 0,
    pendingInvitations: 0,
    totalRoles: 0
  });
  const [loading, setLoading] = useState(true);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);

  useEffect(() => {
    fetchTeamStats();
  }, []);

  const fetchTeamStats = async () => {
    try {
      const response = await fetch('/api/team/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching team stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setInviteLoading(true);
    try {
      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: inviteEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation');
      }

      toast.success('Invitation sent successfully!');
      setInviteEmail('');
      setInviteModalOpen(false);
      fetchTeamStats(); // Refresh stats to update pending invitations count
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('An unknown error occurred');
      }
    } finally {
      setInviteLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Members',
      value: stats.totalMembers,
      icon: Users,
      description: 'Team members'
    },
    {
      title: 'Active Users',
      value: stats.activeMembers,
      icon: UserCheck,
      description: 'Active in last 30 days'
    },
    {
      title: 'Pending Invites',
      value: stats.pendingInvitations,
      icon: Clock,
      description: 'Awaiting response'
    },
    {
      title: 'Roles',
      value: stats.totalRoles,
      icon: Shield,
      description: 'Permission levels'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
                Team Management
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                Manage team members, roles, and permissions
              </p>
            </div>
          </div>
          
          <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg w-full sm:w-auto">
                <UserPlus className="h-4 w-4 mr-2" />
                <span className="hidden xs:inline">Invite Member</span>
                <span className="xs:hidden">Invite</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md mx-4 sm:mx-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                  </div>
                  Invite Team Member
                </DialogTitle>
                <DialogDescription className="text-sm">
                  Send an invitation email to add a new team member to your organization.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleInvite}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="colleague@company.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      required
                      disabled={inviteLoading}
                      className="w-full"
                    />
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs sm:text-sm text-blue-800">
                      <strong>Note:</strong> The invited user will receive an email with instructions to join your team.
                    </p>
                  </div>
                </div>
                <DialogFooter className="gap-2 flex-col sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setInviteModalOpen(false)}
                    disabled={inviteLoading}
                    className="w-full sm:w-auto order-2 sm:order-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={inviteLoading || !inviteEmail.trim()}
                    className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto order-1 sm:order-2"
                  >
                    {inviteLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Invitation
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {statCards.map((stat) => {
            const IconComponent = stat.icon;
            const isPendingInvites = stat.title === 'Pending Invites';
            
            return (
              <Card 
                key={stat.title} 
                className={`border border-gray-200 transition-all duration-200 ${
                  isPendingInvites 
                    ? 'hover:border-blue-300 hover:shadow-md cursor-pointer' 
                    : 'hover:shadow-sm'
                }`}
                onClick={isPendingInvites ? () => setInviteModalOpen(true) : undefined}
              >
                <CardContent className="p-3 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1 min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">
                        {stat.title}
                      </p>
                      <div className="text-lg sm:text-2xl font-semibold text-gray-900">
                        {loading ? (
                          <div className="w-6 h-4 sm:w-8 sm:h-6 bg-gray-200 rounded animate-pulse"></div>
                        ) : (
                          <span className={isPendingInvites && stat.value > 0 ? 'text-blue-600' : ''}>
                            {stat.value}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {stat.description}
                        {isPendingInvites && stat.value > 0 && (
                          <span className="text-blue-600 ml-1 hidden sm:inline">• Click to invite more</span>
                        )}
                      </p>
                    </div>
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ml-2 ${
                      isPendingInvites && stat.value > 0 
                        ? 'bg-blue-100' 
                        : 'bg-gray-100'
                    }`}>
                      <IconComponent className={`h-4 w-4 sm:h-5 sm:w-5 ${
                        isPendingInvites && stat.value > 0 
                          ? 'text-blue-600' 
                          : 'text-gray-600'
                      }`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Dashboard Tabs */}
        <Card className="border border-gray-200">
          <CardHeader className="border-b border-gray-100 p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg font-semibold text-gray-900">
              Team Dashboard
            </CardTitle>
            <CardDescription className="text-sm text-gray-600">
              Manage your team and monitor activity
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="border-b border-gray-100">
                <TabsList className="grid w-full grid-cols-2 bg-transparent p-0 h-auto">
                  <TabsTrigger 
                    value="members" 
                    className="flex items-center gap-1 sm:gap-2 py-2 sm:py-3 px-2 sm:px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-blue-50"
                  >
                    <Users className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-medium truncate">
                      <span className="hidden sm:inline">Members & Permissions</span>
                      <span className="sm:hidden">Members</span>
                    </span>
                    <Badge variant="secondary" className="ml-auto text-xs hidden xs:flex">
                      {stats.totalMembers}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="activity" 
                    className="flex items-center gap-1 sm:gap-2 py-2 sm:py-3 px-2 sm:px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-blue-50"
                  >
                    <Activity className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-medium">Activity</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="p-4 sm:p-6">
                <TabsContent value="members" className="mt-0">
                  <TeamMembersTab 
                    onStatsUpdate={fetchTeamStats} 
                    onInvite={() => setInviteModalOpen(true)}
                  />
                </TabsContent>

                <TabsContent value="activity" className="mt-0">
                  <ActivityLogsTab />
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

