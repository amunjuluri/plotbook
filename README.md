# PlotBook

A comprehensive property intelligence platform for real estate professionals.

## Features

- **Property Search & Discovery**: Advanced search with filters for location, property type, value ranges, and more
- **Owner Intelligence**: Detailed property ownership data with wealth analysis
- **Team Management**: Role-based access control with admin dashboard for team oversight
- **Saved Properties**: Bookmark and organize properties of interest
- **Data Visualization**: Interactive maps and analytics dashboards
- **Multi-tenant Architecture**: Company-based data isolation and team management

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: Better Auth with role-based access control
- **UI Components**: Radix UI, Framer Motion
- **Maps**: Leaflet with OpenStreetMap

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd plotbook
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your database connection and other required variables.

4. Set up the database:
```bash
npx prisma migrate dev
```

5. Seed the database with sample data:
```bash
npm run db:seed
```

6. Start the development server:
```bash
npm run dev
```

## Database Seeding

The application includes a comprehensive seeding system that creates realistic sample data for development and testing.

### Running the Seed Command

```bash
npm run db:seed
```

### What Gets Created

The seed command creates a complete dataset including:

#### **Companies & Team Management**
- **3 Companies**: Luri Labs, PropTech Solutions, Urban Analytics
- **9 Team Members** across different roles and companies
- **3 Sample Invitations** (pending and expired)

#### **Geographic Data**
- **51 US States** with regional classifications
- **16 Major Counties** across key metropolitan areas
- **31 Major Cities** with coordinates and demographic data

#### **Property & Ownership Data**
- **100 Property Owners** (individuals and entities)
- **500 Properties** across all major cities with realistic details
- **Property Transactions** with historical sales data
- **Wealth Breakdowns** for property owners across multiple categories

#### **User Features**
- **Saved Properties** for team members
- **Data Sources** configuration
- **Better Auth Integration** with hashed passwords

### Default Login Credentials

After seeding, you can log in with these accounts:

| Role | Email | Password | Company |
|------|-------|----------|---------|
| Admin | anand@lurilabs.com | password123 | Luri Labs |
| Manager | sarah@lurilabs.com | password123 | Luri Labs |
| Engineer | michael@lurilabs.com | password123 | Luri Labs |
| Designer | emily@lurilabs.com | password123 | Luri Labs |
| Analyst | david@lurilabs.com | password123 | Luri Labs |
| User | jessica@lurilabs.com | password123 | Luri Labs |

### Team Management Features

The seeded data enables full testing of the team management system:

- **Role-Based Access**: Different permission levels for each role
- **Company Isolation**: Multi-tenant data separation
- **Admin Dashboard**: Team overview, member management, activity logs
- **Invitation System**: Pending and expired invitation examples
- **Permission Matrix**: 14 granular permissions across 4 categories

### Resetting Data

To reset and reseed the database:

```bash
npx prisma migrate reset
npm run db:seed
```

**⚠️ Warning**: This will delete all existing data.

### Customizing Seed Data

The seed file (`prisma/seed.ts`) can be customized to:
- Add more companies or team members
- Modify property data ranges
- Adjust geographic coverage
- Change default passwords (recommended for production)

## Development

### Database Commands

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Reset database
npx prisma migrate reset

# Seed database
npm run db:seed

# Open Prisma Studio
npx prisma studio
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
npm run db:seed      # Seed database with sample data
```

## Project Structure

```
plotbook/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── team/              # Team management pages
│   └── ...
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── team/             # Team management components
│   └── ...
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
├── prisma/               # Database schema and migrations
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Database seeding script
└── ...
```

## Authentication & Authorization

The application uses Better Auth for authentication with role-based access control:

### Roles & Permissions

| Role | Description | Key Permissions |
|------|-------------|-----------------|
| **Admin** | Full system access | All permissions, team management |
| **Manager** | Team oversight | Most permissions, limited admin features |
| **Engineer** | Technical access | Data access, export capabilities |
| **Designer** | UI/UX focused | Property access, limited data export |
| **Analyst** | Data analysis | Reports, analytics, property details |
| **User** | Basic access | Property search, save properties |

### Permission Categories

1. **Navigation**: Map search, saved properties, dashboard, team access
2. **Data**: Save properties, export data, property details, database access  
3. **Management**: Invite users, manage roles, edit profiles, system settings
4. **Reports**: Generate reports, view analytics

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

[License information]
