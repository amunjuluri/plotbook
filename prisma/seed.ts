import { PrismaClient } from "@/generated/prisma";
import { auth } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";

const prisma = new PrismaClient();

// Company data
const COMPANIES = [
  {
    name: 'Luri Labs',
    domain: 'lurilabs.com',
    industry: 'Technology',
    size: 'Small (1-50 employees)',
    logo: null
  },
  {
    name: 'PropTech Solutions',
    domain: 'proptech.com',
    industry: 'Real Estate Technology',
    size: 'Medium (51-200 employees)',
    logo: null
  },
  {
    name: 'Urban Analytics',
    domain: 'urbananalytics.com',
    industry: 'Data Analytics',
    size: 'Small (1-50 employees)',
    logo: null
  }
];

// Team members data with Better Auth compatible structure
const TEAM_MEMBERS = [
  {
    name: 'Anand Munjuluri',
    email: 'anand@lurilabs.com',
    role: 'admin',
    emailVerified: true,
    image: null,
    companyName: 'Luri Labs',
    password: 'password123'
  },
  {
    name: 'Sarah Chen',
    email: 'sarah@lurilabs.com',
    role: 'manager',
    emailVerified: true,
    image: null,
    companyName: 'Luri Labs',
    password: 'password123'
  },
  {
    name: 'Michael Rodriguez',
    email: 'michael@lurilabs.com',
    role: 'engineer',
    emailVerified: true,
    image: null,
    companyName: 'Luri Labs',
    password: 'password123'
  },
  {
    name: 'Emily Johnson',
    email: 'emily@lurilabs.com',
    role: 'designer',
    emailVerified: true,
    image: null,
    companyName: 'Luri Labs',
    password: 'password123'
  },
  {
    name: 'David Park',
    email: 'david@lurilabs.com',
    role: 'analyst',
    emailVerified: true,
    image: null,
    companyName: 'Luri Labs',
    password: 'password123'
  },
  {
    name: 'Jessica Williams',
    email: 'jessica@lurilabs.com',
    role: 'user',
    emailVerified: false,
    image: null,
    companyName: 'Luri Labs',
    password: 'password123'
  },
  // PropTech Solutions team
  {
    name: 'Robert Thompson',
    email: 'robert@proptech.com',
    role: 'admin',
    emailVerified: true,
    image: null,
    companyName: 'PropTech Solutions',
    password: 'password123'
  },
  {
    name: 'Lisa Anderson',
    email: 'lisa@proptech.com',
    role: 'manager',
    emailVerified: true,
    image: null,
    companyName: 'PropTech Solutions',
    password: 'password123'
  },
  // Urban Analytics team
  {
    name: 'James Wilson',
    email: 'james@urbananalytics.com',
    role: 'admin',
    emailVerified: true,
    image: null,
    companyName: 'Urban Analytics',
    password: 'password123'
  }
];

// Sample invitations
const SAMPLE_INVITATIONS = [
  {
    email: 'alex@lurilabs.com',
    invitedByEmail: 'anand@lurilabs.com',
    status: 'pending'
  },
  {
    email: 'maria@lurilabs.com',
    invitedByEmail: 'anand@lurilabs.com',
    status: 'pending'
  },
  {
    email: 'john@proptech.com',
    invitedByEmail: 'robert@proptech.com',
    status: 'expired'
  }
];

// US States data with regions
const US_STATES = [
  // Northeast
  { name: 'Connecticut', code: 'CT', region: 'Northeast' },
  { name: 'Maine', code: 'ME', region: 'Northeast' },
  { name: 'Massachusetts', code: 'MA', region: 'Northeast' },
  { name: 'New Hampshire', code: 'NH', region: 'Northeast' },
  { name: 'Rhode Island', code: 'RI', region: 'Northeast' },
  { name: 'Vermont', code: 'VT', region: 'Northeast' },
  { name: 'New Jersey', code: 'NJ', region: 'Northeast' },
  { name: 'New York', code: 'NY', region: 'Northeast' },
  { name: 'Pennsylvania', code: 'PA', region: 'Northeast' },
  
  // Midwest
  { name: 'Illinois', code: 'IL', region: 'Midwest' },
  { name: 'Indiana', code: 'IN', region: 'Midwest' },
  { name: 'Michigan', code: 'MI', region: 'Midwest' },
  { name: 'Ohio', code: 'OH', region: 'Midwest' },
  { name: 'Wisconsin', code: 'WI', region: 'Midwest' },
  { name: 'Iowa', code: 'IA', region: 'Midwest' },
  { name: 'Kansas', code: 'KS', region: 'Midwest' },
  { name: 'Minnesota', code: 'MN', region: 'Midwest' },
  { name: 'Missouri', code: 'MO', region: 'Midwest' },
  { name: 'Nebraska', code: 'NE', region: 'Midwest' },
  { name: 'North Dakota', code: 'ND', region: 'Midwest' },
  { name: 'South Dakota', code: 'SD', region: 'Midwest' },
  
  // South
  { name: 'Delaware', code: 'DE', region: 'South' },
  { name: 'Florida', code: 'FL', region: 'South' },
  { name: 'Georgia', code: 'GA', region: 'South' },
  { name: 'Maryland', code: 'MD', region: 'South' },
  { name: 'North Carolina', code: 'NC', region: 'South' },
  { name: 'South Carolina', code: 'SC', region: 'South' },
  { name: 'Virginia', code: 'VA', region: 'South' },
  { name: 'District of Columbia', code: 'DC', region: 'South' },
  { name: 'West Virginia', code: 'WV', region: 'South' },
  { name: 'Alabama', code: 'AL', region: 'South' },
  { name: 'Kentucky', code: 'KY', region: 'South' },
  { name: 'Mississippi', code: 'MS', region: 'South' },
  { name: 'Tennessee', code: 'TN', region: 'South' },
  { name: 'Arkansas', code: 'AR', region: 'South' },
  { name: 'Louisiana', code: 'LA', region: 'South' },
  { name: 'Oklahoma', code: 'OK', region: 'South' },
  { name: 'Texas', code: 'TX', region: 'South' },
  
  // West
  { name: 'Arizona', code: 'AZ', region: 'West' },
  { name: 'Colorado', code: 'CO', region: 'West' },
  { name: 'Idaho', code: 'ID', region: 'West' },
  { name: 'Montana', code: 'MT', region: 'West' },
  { name: 'Nevada', code: 'NV', region: 'West' },
  { name: 'New Mexico', code: 'NM', region: 'West' },
  { name: 'Utah', code: 'UT', region: 'West' },
  { name: 'Wyoming', code: 'WY', region: 'West' },
  { name: 'Alaska', code: 'AK', region: 'West' },
  { name: 'California', code: 'CA', region: 'West' },
  { name: 'Hawaii', code: 'HI', region: 'West' },
  { name: 'Oregon', code: 'OR', region: 'West' },
  { name: 'Washington', code: 'WA', region: 'West' },
];

// Major cities with coordinates
const MAJOR_CITIES = [
  // California
  { name: 'Los Angeles', state: 'CA', lat: 34.0522, lng: -118.2437, population: 3971883, zipCodes: ['90001', '90002', '90210', '90211'] },
  { name: 'San Francisco', state: 'CA', lat: 37.7749, lng: -122.4194, population: 873965, zipCodes: ['94102', '94103', '94104', '94105'] },
  { name: 'San Diego', state: 'CA', lat: 32.7157, lng: -117.1611, population: 1423851, zipCodes: ['92101', '92102', '92103', '92104'] },
  { name: 'San Jose', state: 'CA', lat: 37.3382, lng: -121.8863, population: 1021795, zipCodes: ['95110', '95111', '95112', '95113'] },
  
  // New York
  { name: 'New York', state: 'NY', lat: 40.7128, lng: -74.0060, population: 8336817, zipCodes: ['10001', '10002', '10003', '10004'] },
  { name: 'Buffalo', state: 'NY', lat: 42.8864, lng: -78.8784, population: 278349, zipCodes: ['14201', '14202', '14203', '14204'] },
  { name: 'Rochester', state: 'NY', lat: 43.1566, lng: -77.6088, population: 211328, zipCodes: ['14601', '14602', '14603', '14604'] },
  
  // Texas
  { name: 'Houston', state: 'TX', lat: 29.7604, lng: -95.3698, population: 2320268, zipCodes: ['77001', '77002', '77003', '77004'] },
  { name: 'Dallas', state: 'TX', lat: 32.7767, lng: -96.7970, population: 1343573, zipCodes: ['75201', '75202', '75203', '75204'] },
  { name: 'Austin', state: 'TX', lat: 30.2672, lng: -97.7431, population: 978908, zipCodes: ['73301', '73344', '78701', '78702'] },
  { name: 'San Antonio', state: 'TX', lat: 29.4241, lng: -98.4936, population: 1547253, zipCodes: ['78201', '78202', '78203', '78204'] },
  
  // Florida
  { name: 'Miami', state: 'FL', lat: 25.7617, lng: -80.1918, population: 467963, zipCodes: ['33101', '33102', '33109', '33111'] },
  { name: 'Tampa', state: 'FL', lat: 27.9506, lng: -82.4572, population: 399700, zipCodes: ['33601', '33602', '33603', '33604'] },
  { name: 'Orlando', state: 'FL', lat: 28.5383, lng: -81.3792, population: 307573, zipCodes: ['32801', '32802', '32803', '32804'] },
  { name: 'Jacksonville', state: 'FL', lat: 30.3322, lng: -81.6557, population: 949611, zipCodes: ['32099', '32201', '32202', '32203'] },
  
  // Illinois
  { name: 'Chicago', state: 'IL', lat: 41.8781, lng: -87.6298, population: 2746388, zipCodes: ['60601', '60602', '60603', '60604'] },
  
  // Pennsylvania
  { name: 'Philadelphia', state: 'PA', lat: 39.9526, lng: -75.1652, population: 1584064, zipCodes: ['19101', '19102', '19103', '19104'] },
  { name: 'Pittsburgh', state: 'PA', lat: 40.4406, lng: -79.9959, population: 302971, zipCodes: ['15201', '15202', '15203', '15204'] },
  
  // Arizona
  { name: 'Phoenix', state: 'AZ', lat: 33.4484, lng: -112.0740, population: 1680992, zipCodes: ['85001', '85002', '85003', '85004'] },
  
  // Nevada
  { name: 'Las Vegas', state: 'NV', lat: 36.1699, lng: -115.1398, population: 651319, zipCodes: ['89101', '89102', '89103', '89104'] },
  
  // Washington
  { name: 'Seattle', state: 'WA', lat: 47.6062, lng: -122.3321, population: 749256, zipCodes: ['98101', '98102', '98103', '98104'] },
  
  // Colorado
  { name: 'Denver', state: 'CO', lat: 39.7392, lng: -104.9903, population: 715522, zipCodes: ['80201', '80202', '80203', '80204'] },
  
  // Massachusetts
  { name: 'Boston', state: 'MA', lat: 42.3601, lng: -71.0589, population: 695506, zipCodes: ['02101', '02102', '02103', '02104'] },
  
  // Georgia
  { name: 'Atlanta', state: 'GA', lat: 33.7490, lng: -84.3880, population: 498715, zipCodes: ['30301', '30302', '30303', '30304'] },
  
  // Michigan
  { name: 'Detroit', state: 'MI', lat: 42.3314, lng: -83.0458, population: 639111, zipCodes: ['48201', '48202', '48203', '48204'] },
  
  // North Carolina
  { name: 'Charlotte', state: 'NC', lat: 35.2271, lng: -80.8431, population: 885708, zipCodes: ['28201', '28202', '28203', '28204'] },
  
  // Tennessee
  { name: 'Nashville', state: 'TN', lat: 36.1627, lng: -86.7816, population: 689447, zipCodes: ['37201', '37202', '37203', '37204'] },
  
  // Oregon
  { name: 'Portland', state: 'OR', lat: 45.5152, lng: -122.6784, population: 652503, zipCodes: ['97201', '97202', '97203', '97204'] },
  
  // Ohio
  { name: 'Columbus', state: 'OH', lat: 39.9612, lng: -82.9988, population: 905748, zipCodes: ['43201', '43202', '43203', '43204'] },
  
  // Missouri
  { name: 'Kansas City', state: 'MO', lat: 39.0997, lng: -94.5786, population: 508090, zipCodes: ['64101', '64102', '64105', '64108'] },
  
  // Louisiana
  { name: 'New Orleans', state: 'LA', lat: 29.9511, lng: -90.0715, population: 383997, zipCodes: ['70112', '70113', '70114', '70115'] },
];

// Sample counties for major states
const SAMPLE_COUNTIES = [
  // California
  { name: 'Los Angeles County', state: 'CA', fipsCode: '06037', population: 10014009 },
  { name: 'San Francisco County', state: 'CA', fipsCode: '06075', population: 873965 },
  { name: 'San Diego County', state: 'CA', fipsCode: '06073', population: 3338330 },
  { name: 'Orange County', state: 'CA', fipsCode: '06059', population: 3186989 },
  
  // New York
  { name: 'New York County', state: 'NY', fipsCode: '36061', population: 1694251 },
  { name: 'Kings County', state: 'NY', fipsCode: '36047', population: 2736074 },
  { name: 'Queens County', state: 'NY', fipsCode: '36081', population: 2405464 },
  { name: 'Bronx County', state: 'NY', fipsCode: '36005', population: 1472654 },
  
  // Texas
  { name: 'Harris County', state: 'TX', fipsCode: '48201', population: 4731145 },
  { name: 'Dallas County', state: 'TX', fipsCode: '48113', population: 2613539 },
  { name: 'Tarrant County', state: 'TX', fipsCode: '48439', population: 2110640 },
  { name: 'Bexar County', state: 'TX', fipsCode: '48029', population: 2009324 },
  
  // Florida
  { name: 'Miami-Dade County', state: 'FL', fipsCode: '12086', population: 2716940 },
  { name: 'Broward County', state: 'FL', fipsCode: '12011', population: 1944375 },
  { name: 'Palm Beach County', state: 'FL', fipsCode: '12099', population: 1496770 },
  { name: 'Hillsborough County', state: 'FL', fipsCode: '12057', population: 1459762 },
];

// Property types and building types
const PROPERTY_TYPES = ['residential', 'commercial', 'industrial', 'land'];
const BUILDING_TYPES = ['single_family', 'condo', 'apartment', 'townhouse', 'office', 'retail', 'warehouse', 'vacant_land'];
const OWNERSHIP_TYPES = ['sole', 'joint', 'trust', 'corporate'];

// Wealth categories
const WEALTH_CATEGORIES = ['real_estate', 'stocks', 'bonds', 'business', 'cash', 'other'];

// Sample names for generating owners
const FIRST_NAMES = [
  'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
  'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Christopher', 'Karen', 'Charles', 'Nancy', 'Daniel', 'Lisa',
  'Matthew', 'Betty', 'Anthony', 'Helen', 'Mark', 'Sandra', 'Donald', 'Donna',
  'Steven', 'Carol', 'Paul', 'Ruth', 'Andrew', 'Sharon', 'Joshua', 'Michelle'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas',
  'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White',
  'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young',
  'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores'
];

const COMPANY_NAMES = [
  'Tech Innovations LLC', 'Global Properties Inc', 'Sunrise Investments', 'Metro Development Corp',
  'Pacific Holdings', 'Atlantic Ventures', 'Mountain View Properties', 'Coastal Enterprises',
  'Urban Development Group', 'Skyline Investments', 'Heritage Properties', 'Future Holdings',
  'Prime Real Estate', 'Elite Investments', 'Pinnacle Properties', 'Apex Holdings'
];

// Utility functions
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generateRandomCoordinates(city: any): { lat: number; lng: number } {
  // Generate coordinates within ~5 miles of the city center
  const latOffset = (Math.random() - 0.5) * 0.1; // ~5 miles
  const lngOffset = (Math.random() - 0.5) * 0.1;
  
  // Ensure we have valid base coordinates
  const baseLat = typeof city.lat === 'number' ? city.lat : (typeof city.latitude === 'number' ? city.latitude : 40.7128);
  const baseLng = typeof city.lng === 'number' ? city.lng : (typeof city.longitude === 'number' ? city.longitude : -74.0060);
  
  return {
    lat: parseFloat((baseLat + latOffset).toFixed(6)),
    lng: parseFloat((baseLng + lngOffset).toFixed(6))
  };
}

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Get Better Auth context for password hashing
    const ctx = await auth.$context;

    // Clear existing data in correct order to avoid foreign key constraints
    console.log('🧹 Cleaning existing data...');
    
    await prisma.savedProperty.deleteMany();
    await prisma.savedSearchFilter.deleteMany();
    await prisma.report.deleteMany();
    await prisma.wealthBreakdown.deleteMany();
    await prisma.propertyOwnership.deleteMany();
    await prisma.propertyTransaction.deleteMany();
    await prisma.property.deleteMany();
    await prisma.owner.deleteMany();
    await prisma.city.deleteMany();
    await prisma.county.deleteMany();
    await prisma.state.deleteMany();
    await prisma.invitation.deleteMany();
    await prisma.session.deleteMany();
    await prisma.account.deleteMany();
    await prisma.user.deleteMany();
    await prisma.company.deleteMany();
    await prisma.verification.deleteMany();
    await prisma.dataSource.deleteMany();

    // 1. Create companies
    console.log('🏢 Creating companies...');
    const companies = await Promise.all(
      COMPANIES.map(async (companyData) => {
        return await prisma.company.create({
          data: {
            id: uuidv4(),
            name: companyData.name,
            domain: companyData.domain,
            industry: companyData.industry,
            size: companyData.size,
            logo: companyData.logo,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
      })
    );

    console.log(`✅ Created ${companies.length} companies`);

    // 2. Create users with Better Auth structure
    console.log('👥 Creating team members...');
    const users = await Promise.all(
      TEAM_MEMBERS.map(async (memberData) => {
        const company = companies.find(c => c.name === memberData.companyName);
        if (!company) {
          throw new Error(`Company ${memberData.companyName} not found`);
        }

        const userId = uuidv4();
        const accountId = uuidv4();
        const now = new Date();

        // Hash the password using Better Auth's password hashing
        const hashedPassword = await ctx.password.hash(memberData.password);

        // Create user
        const user = await prisma.user.create({
          data: {
            id: userId,
            name: memberData.name,
            email: memberData.email,
            emailVerified: memberData.emailVerified,
            image: memberData.image,
            role: memberData.role,
            companyId: company.id,
            // Tab permissions based on role
            canAccessDashboard: true, // Everyone can access dashboard
            canAccessSavedProperties: true, // Everyone can access saved properties
            canAccessTeamManagement: memberData.role === 'admin' || memberData.role === 'manager', // Only admins and managers
            createdAt: now,
            updatedAt: now,
            banned: false,
            banExpires: null,
            banReason: null
          }
        });

        // Create account for email/password authentication
        await prisma.account.create({
          data: {
            id: accountId,
            accountId: "credential",
            providerId: "credential",
            userId: userId,
            password: hashedPassword,
            createdAt: now,
            updatedAt: now
          }
        });

        return user;
      })
    );

    console.log(`✅ Created ${users.length} team members`);

    // 3. Create sample invitations
    console.log('📧 Creating sample invitations...');
    const invitations = await Promise.all(
      SAMPLE_INVITATIONS.map(async (invitationData) => {
        const invitedBy = users.find(u => u.email === invitationData.invitedByEmail);
        if (!invitedBy) {
          throw new Error(`User ${invitationData.invitedByEmail} not found`);
        }
        if (!invitedBy.companyId) {
          throw new Error(`User ${invitationData.invitedByEmail} has no companyId`);
        }

        const expiresAt = invitationData.status === 'expired' 
          ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

        return await prisma.invitation.create({
          data: {
            id: uuidv4(),
            email: invitationData.email,
            token: crypto.randomBytes(32).toString('hex'),
            expires: expiresAt,
            status: invitationData.status,
            invitedBy: invitedBy.id,
            companyId: invitedBy.companyId, // Add company ID from the inviter
            createdAt: new Date()
          }
        });
      })
    );

    console.log(`✅ Created ${invitations.length} invitations`);

    // 4. Create states
    console.log('🗺️ Creating states...');
    const states = await Promise.all(
      US_STATES.map(async (stateData) => {
        return await prisma.state.create({
          data: {
            id: uuidv4(),
            name: stateData.name,
            code: stateData.code,
            region: stateData.region,
            createdAt: new Date()
          }
        });
      })
    );

    console.log(`✅ Created ${states.length} states`);

    // 5. Create counties
    console.log('🏛️ Creating counties...');
    const counties = await Promise.all(
      SAMPLE_COUNTIES.map(async (countyData) => {
        const state = states.find(s => s.code === countyData.state);
        if (!state) {
          throw new Error(`State ${countyData.state} not found`);
        }

        return await prisma.county.create({
          data: {
            id: uuidv4(),
            name: countyData.name,
            fipsCode: countyData.fipsCode,
            stateId: state.id,
            population: countyData.population,
            createdAt: new Date()
          }
        });
      })
    );

    console.log(`✅ Created ${counties.length} counties`);

    // 6. Create cities
    console.log('🏙️ Creating cities...');
    const cities = await Promise.all(
      MAJOR_CITIES.map(async (cityData) => {
        const state = states.find(s => s.code === cityData.state);
        if (!state) {
          throw new Error(`State ${cityData.state} not found`);
        }

        const county = counties.find(c => c.stateId === state.id);

        return await prisma.city.create({
          data: {
            id: uuidv4(),
            name: cityData.name,
            stateId: state.id,
            countyId: county?.id,
            latitude: cityData.lat,
            longitude: cityData.lng,
            population: cityData.population,
            zipCodes: cityData.zipCodes,
            createdAt: new Date()
          }
        });
      })
    );

    console.log(`✅ Created ${cities.length} cities`);

    // 7. Create sample owners
    console.log('👤 Creating property owners...');
    const owners = [];
    for (let i = 0; i < 100; i++) {
      const firstName = randomChoice(FIRST_NAMES);
      const lastName = randomChoice(LAST_NAMES);
      const isCompany = Math.random() < 0.2; // 20% chance of being a company

      const owner = await prisma.owner.create({
        data: {
          id: uuidv4(),
          type: isCompany ? 'entity' : 'individual',
          firstName: isCompany ? null : firstName,
          lastName: isCompany ? null : lastName,
          entityName: isCompany ? randomChoice(COMPANY_NAMES) : null,
          entityType: isCompany ? randomChoice(['corporation', 'llc', 'partnership', 'trust']) : null,
          email: isCompany ? null : `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
          phone: Math.random() < 0.7 ? `(${randomInt(200, 999)}) ${randomInt(200, 999)}-${randomInt(1000, 9999)}` : null,
          mailingAddress: `${randomInt(100, 9999)} ${randomChoice(['Main', 'Oak', 'Pine', 'Elm', 'Cedar'])} ${randomChoice(['St', 'Ave', 'Blvd', 'Dr'])}`,
          dateOfBirth: isCompany ? null : new Date(randomInt(1950, 2000), randomInt(0, 11), randomInt(1, 28)),
          ssn: isCompany ? null : `***-**-${randomInt(1000, 9999)}`,
          ein: isCompany ? `${randomInt(10, 99)}-${randomInt(1000000, 9999999)}` : null,
          estimatedNetWorth: randomFloat(100000, 50000000),
          wealthConfidence: randomFloat(0.6, 0.95),
          wealthLastUpdated: new Date(),
          wealthSources: ['mock_data'],
          occupation: isCompany ? null : randomChoice(['Engineer', 'Doctor', 'Lawyer', 'Business Owner', 'Executive', 'Consultant']),
          industry: randomChoice(['Technology', 'Healthcare', 'Finance', 'Real Estate', 'Manufacturing']),
          dataSource: 'mock_data',
          isVerified: Math.random() > 0.3,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      owners.push(owner);

      // Create wealth breakdown for some owners
      if (Math.random() < 0.6) { // 60% chance
        const totalWealth = owner.estimatedNetWorth || 1000000;
        const categories = randomChoice([2, 3, 4, 5]); // Random number of categories
        const selectedCategories = WEALTH_CATEGORIES.sort(() => 0.5 - Math.random()).slice(0, categories);
        
        let remainingWealth = totalWealth;
        for (let j = 0; j < selectedCategories.length; j++) {
          const isLast = j === selectedCategories.length - 1;
          const amount = isLast ? remainingWealth : randomFloat(0.1, 0.4) * remainingWealth;
          
          await prisma.wealthBreakdown.create({
            data: {
              id: uuidv4(),
              ownerId: owner.id,
              category: selectedCategories[j],
              amount: amount,
              percentage: (amount / totalWealth) * 100,
              confidence: randomFloat(0.6, 0.9),
              lastUpdated: new Date(),
              dataSource: 'mock_data'
            }
          });
          
          remainingWealth -= amount;
        }
      }
    }

    console.log(`✅ Created ${owners.length} property owners`);

    // 8. Create properties
    console.log('🏠 Creating properties...');
    const properties = [];
    for (let i = 0; i < 500; i++) {
      const city = randomChoice(cities);
      const state = states.find(s => s.id === city.stateId);
      const county = counties.find(c => c.stateId === state?.id);
      const coords = generateRandomCoordinates(city);
      const propertyType = randomChoice(PROPERTY_TYPES);
      const buildingType = randomChoice(BUILDING_TYPES);
      
      const property = await prisma.property.create({
        data: {
          id: uuidv4(),
          address: `${randomInt(100, 9999)} ${randomChoice(['Main', 'Oak', 'Pine', 'Elm', 'Cedar', 'Maple', 'Washington', 'Lincoln'])} ${randomChoice(['St', 'Ave', 'Blvd', 'Dr', 'Ln', 'Ct'])}`,
          streetNumber: randomInt(100, 9999).toString(),
          streetName: `${randomChoice(['Main', 'Oak', 'Pine', 'Elm', 'Cedar'])} ${randomChoice(['St', 'Ave', 'Blvd', 'Dr'])}`,
          unit: Math.random() < 0.2 ? `Unit ${randomInt(1, 50)}` : null,
          zipCode: randomChoice(city.zipCodes),
          latitude: coords.lat,
          longitude: coords.lng,
          propertyType: propertyType,
          buildingType: buildingType,
          yearBuilt: propertyType !== 'land' ? randomInt(1950, 2023) : null,
          squareFootage: propertyType !== 'land' ? randomInt(800, 5000) : null,
          lotSize: randomFloat(0.1, 2.0),
          bedrooms: propertyType === 'residential' ? randomInt(1, 6) : null,
          bathrooms: propertyType === 'residential' ? randomFloat(1, 4) : null,
          stories: propertyType === 'residential' ? randomInt(1, 3) : null,
          currentValue: randomFloat(200000, 2000000),
          assessedValue: randomFloat(180000, 1800000),
          taxAmount: randomFloat(2000, 25000),
          lastSalePrice: Math.random() < 0.8 ? randomFloat(150000, 1900000) : null,
          lastSaleDate: Math.random() < 0.8 ? new Date(randomInt(2015, 2023), randomInt(0, 11), randomInt(1, 28)) : null,
          stateId: state!.id,
          countyId: county?.id,
          cityId: city.id,
          dataSource: randomChoice(['zillow', 'county_records', 'mls']),
          confidence: randomFloat(0.8, 0.98),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      properties.push(property);

      // Create property ownership
      const owner = randomChoice(owners);
      const ownershipType = randomChoice(OWNERSHIP_TYPES);
      
      await prisma.propertyOwnership.create({
        data: {
          id: uuidv4(),
          propertyId: property.id,
          ownerId: owner.id,
          ownershipType: ownershipType,
          ownershipPercent: ownershipType === 'joint' ? randomFloat(25, 75) : 100,
          startDate: new Date(randomInt(2010, 2023), randomInt(0, 11), randomInt(1, 28)),
          endDate: null,
          isActive: true,
          createdAt: new Date()
        }
      });

      // Create property transactions (some properties)
      if (Math.random() < 0.7) { // 70% of properties have transactions
        const transactionCount = randomInt(1, 3);
        for (let j = 0; j < transactionCount; j++) {
          await prisma.propertyTransaction.create({
            data: {
              id: uuidv4(),
              propertyId: property.id,
              transactionType: randomChoice(['sale', 'purchase', 'refinance']),
              amount: randomFloat(150000, 1900000),
              date: new Date(randomInt(2015, 2023), randomInt(0, 11), randomInt(1, 28)),
              buyerId: Math.random() < 0.5 ? randomChoice(owners).id : null,
              sellerId: Math.random() < 0.5 ? randomChoice(owners).id : null,
              documentType: randomChoice(['deed', 'mortgage', 'lien']),
              recordingDate: new Date(randomInt(2015, 2023), randomInt(0, 11), randomInt(1, 28)),
              createdAt: new Date()
            }
          });
        }
      }
    }

    console.log(`✅ Created ${properties.length} properties`);

    // 9. Create saved properties for users
    console.log('💾 Creating saved properties...');
    const luriLabsUsers = users.filter(u => u.email.includes('lurilabs.com'));
    for (const user of luriLabsUsers) {
      const savedCount = randomInt(3, 15);
      const selectedProperties = properties.sort(() => 0.5 - Math.random()).slice(0, savedCount);
      
      for (const property of selectedProperties) {
        await prisma.savedProperty.create({
          data: {
            id: uuidv4(),
            userId: user.id,
            propertyId: property.id,
            notes: Math.random() < 0.5 ? `Interesting property in ${property.address}` : null,
            tags: Math.random() < 0.3 ? ['investment', 'potential'] : [],
            createdAt: new Date()
          }
        });
      }
    }

    console.log('✅ Created saved properties for users');

    // 10. Create data sources
    console.log('📊 Creating data sources...');
    const dataSources = [
      { name: 'County Assessor Records', type: 'api', url: 'https://countyassessor.com' },
      { name: 'MLS Database', type: 'api', url: 'https://mls.com' },
      { name: 'Public Records', type: 'file', url: null },
      { name: 'Census Bureau', type: 'api', url: 'https://census.gov' }
    ];

    for (const sourceData of dataSources) {
      await prisma.dataSource.create({
        data: {
          id: uuidv4(),
          name: sourceData.name,
          type: sourceData.type,
          url: sourceData.url,
          lastSync: new Date(),
          isActive: true,
          rateLimit: sourceData.type === 'api' ? randomInt(100, 1000) : null,
          createdAt: new Date()
        }
      });
    }

    console.log('✅ Created data sources');

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Companies: ${companies.length}`);
    console.log(`- Team Members: ${users.length}`);
    console.log(`- Invitations: ${invitations.length}`);
    console.log(`- States: ${states.length}`);
    console.log(`- Counties: ${counties.length}`);
    console.log(`- Cities: ${cities.length}`);
    console.log(`- Property Owners: ${owners.length}`);
    console.log(`- Properties: ${properties.length}`);
    console.log(`- Data Sources: ${dataSources.length}`);
    
    console.log('\n🔐 Default Login Credentials:');
    console.log('Admin User: anand@lurilabs.com / password123');
    console.log('Manager User: sarah@lurilabs.com / password123');
    console.log('Engineer User: michael@lurilabs.com / password123');
    console.log('Designer User: emily@lurilabs.com / password123');
    console.log('Analyst User: david@lurilabs.com / password123');
    console.log('Basic User: jessica@lurilabs.com / password123');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  });