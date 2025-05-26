import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';

// Define default roles and their permissions
const DEFAULT_ROLES = [
  {
    id: 'admin',
    name: 'Admin',
    description: 'Full system access with all permissions',
    color: 'red',
    permissions: [
      'view_map_search',
      'view_saved_properties',
      'view_dashboard',
      'view_team',
      'save_properties',
      'export_data',
      'view_property_details',
      'access_database',
      'invite_users',
      'manage_roles',
      'edit_user_profiles',
      'system_settings',
      'generate_reports',
      'view_analytics'
    ]
  },
  {
    id: 'manager',
    name: 'Manager',
    description: 'Team management and advanced data access',
    color: 'purple',
    permissions: [
      'view_map_search',
      'view_saved_properties',
      'view_dashboard',
      'save_properties',
      'export_data',
      'view_property_details',
      'invite_users',
      'generate_reports',
      'view_analytics'
    ]
  },
  {
    id: 'engineer',
    name: 'Engineer',
    description: 'Technical access with data and development permissions',
    color: 'blue',
    permissions: [
      'view_map_search',
      'view_saved_properties',
      'view_dashboard',
      'save_properties',
      'export_data',
      'view_property_details',
      'access_database',
      'generate_reports'
    ]
  },
  {
    id: 'designer',
    name: 'Designer',
    description: 'Design and user experience focused permissions',
    color: 'green',
    permissions: [
      'view_map_search',
      'view_saved_properties',
      'view_dashboard',
      'save_properties',
      'view_property_details',
      'generate_reports'
    ]
  },
  {
    id: 'analyst',
    name: 'Analyst',
    description: 'Data analysis and reporting permissions',
    color: 'yellow',
    permissions: [
      'view_map_search',
      'view_saved_properties',
      'view_dashboard',
      'save_properties',
      'export_data',
      'view_property_details',
      'generate_reports',
      'view_analytics'
    ]
  },
  {
    id: 'user',
    name: 'User',
    description: 'Basic user permissions for standard functionality',
    color: 'gray',
    permissions: [
      'view_map_search',
      'view_saved_properties',
      'view_dashboard',
      'save_properties',
      'view_property_details'
    ]
  }
];

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and is an admin
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Get the user's company
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { company: true }
    });

    if (!user?.companyId) {
      return NextResponse.json(
        { error: 'User not associated with a company' },
        { status: 400 }
      );
    }

    // Get user counts for each role in the company
    const userCounts = await prisma.user.groupBy({
      by: ['role'],
      where: { companyId: user.companyId },
      _count: {
        role: true
      }
    });

    // Create a map of role counts
    const roleCountMap = userCounts.reduce((acc, item) => {
      if (item.role) {
        acc[item.role] = item._count.role;
      }
      return acc;
    }, {} as Record<string, number>);

    // Add user counts to default roles
    const rolesWithCounts = DEFAULT_ROLES.map(role => ({
      ...role,
      userCount: roleCountMap[role.id] || 0
    }));

    return NextResponse.json({
      roles: rolesWithCounts
    });

  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch roles' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 