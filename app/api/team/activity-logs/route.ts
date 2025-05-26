import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';

interface Activity {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
  action: string;
  actionType: 'auth' | 'data' | 'admin' | 'system';
  icon: string;
  timestamp: Date;
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    location?: string;
    details: string;
  };
}

const getActivitiesFromDatabase = async (companyId: string): Promise<Activity[]> => {
  const activities: Activity[] = [];

  try {
    // Get recent sessions (login activities)
    const sessions = await prisma.session.findMany({
      where: {
        user: {
          companyId: companyId
        },
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      include: {
        user: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    });

    // Add login activities
    sessions.forEach(session => {
      activities.push({
        id: `session-${session.id}`,
        user: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          avatar: session.user.image
        },
        action: 'User logged in',
        actionType: 'auth',
        icon: 'LogIn',
        timestamp: session.createdAt,
        metadata: {
          ipAddress: session.ipAddress || undefined,
          userAgent: session.userAgent || undefined,
          details: 'Successful authentication'
        }
      });
    });

    // Get saved properties activities
    const savedProperties = await prisma.savedProperty.findMany({
      where: {
        user: {
          companyId: companyId
        },
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      },
      include: {
        user: true,
        property: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    });

    // Add property save activities
    savedProperties.forEach(saved => {
      activities.push({
        id: `saved-${saved.id}`,
        user: {
          id: saved.user.id,
          name: saved.user.name,
          email: saved.user.email,
          avatar: saved.user.image
        },
        action: 'Property saved',
        actionType: 'data',
        icon: 'Bookmark',
        timestamp: saved.createdAt,
        metadata: {
          details: `Saved property at ${saved.property.address}`
        }
      });
    });

    // Get invitations (admin activities)
    const invitations = await prisma.invitation.findMany({
      where: {
        admin: {
          companyId: companyId
        },
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      },
      include: {
        admin: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    });

    // Add invitation activities
    invitations.forEach(invitation => {
      activities.push({
        id: `invitation-${invitation.id}`,
        user: {
          id: invitation.admin.id,
          name: invitation.admin.name,
          email: invitation.admin.email,
          avatar: invitation.admin.image
        },
        action: 'User invited',
        actionType: 'admin',
        icon: 'UserPlus',
        timestamp: invitation.createdAt,
        metadata: {
          details: `Invited ${invitation.email} to join team`
        }
      });
    });

    // Get reports generated
    const reports = await prisma.report.findMany({
      where: {
        user: {
          companyId: companyId
        },
        generatedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      },
      include: {
        user: true
      },
      orderBy: {
        generatedAt: 'desc'
      },
      take: 50
    });

    // Add report generation activities
    reports.forEach(report => {
      activities.push({
        id: `report-${report.id}`,
        user: {
          id: report.user.id,
          name: report.user.name,
          email: report.user.email,
          avatar: report.user.image
        },
        action: 'Report generated',
        actionType: 'system',
        icon: 'FileText',
        timestamp: report.generatedAt,
        metadata: {
          details: `Generated ${report.type} report: ${report.name}`
        }
      });
    });

    // Get saved search filters
    const searchFilters = await prisma.savedSearchFilter.findMany({
      where: {
        user: {
          companyId: companyId
        },
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      },
      include: {
        user: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    });

    // Add search filter activities
    searchFilters.forEach(filter => {
      activities.push({
        id: `filter-${filter.id}`,
        user: {
          id: filter.user.id,
          name: filter.user.name,
          email: filter.user.email,
          avatar: filter.user.image
        },
        action: 'Search filter saved',
        actionType: 'data',
        icon: 'Search',
        timestamp: filter.createdAt,
        metadata: {
          details: `Saved search filter: ${filter.name}`
        }
      });
    });

    // Sort all activities by timestamp (most recent first)
    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  } catch (error) {
    console.error('Error fetching activities from database:', error);
    return [];
  }
};

export async function GET(request: NextRequest) {
  try {
    // Get session from Better Auth
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get the user's company
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { company: true }
    });

    if (!user?.companyId) {
      return NextResponse.json({ error: 'User not associated with a company' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const actionType = searchParams.get('actionType') || 'all';
    const dateFilter = searchParams.get('dateFilter') || 'all';

    let activities = await getActivitiesFromDatabase(user.companyId);

    // Apply filters
    if (search) {
      activities = activities.filter(
        (activity) =>
          activity.user.name.toLowerCase().includes(search.toLowerCase()) ||
          activity.action.toLowerCase().includes(search.toLowerCase()) ||
          activity.user.email.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (actionType !== 'all') {
      activities = activities.filter((activity) => activity.actionType === actionType);
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      activities = activities.filter((activity) => activity.timestamp >= filterDate);
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedActivities = activities.slice(startIndex, endIndex);

    return NextResponse.json({
      activities: paginatedActivities,
      pagination: {
        page,
        limit,
        total: activities.length,
        totalPages: Math.ceil(activities.length / limit),
        hasMore: endIndex < activities.length,
      },
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 