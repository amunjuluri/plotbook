import { PrismaClient } from "@/generated/prisma";
import { auth } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

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
  // Generate coordinates within ~10 miles of city center
  const latOffset = (Math.random() - 0.5) * 0.3; // ~10 miles
  const lngOffset = (Math.random() - 0.5) * 0.3;
  
  return {
    lat: parseFloat((city.latitude + latOffset).toFixed(6)),
    lng: parseFloat((city.longitude + lngOffset).toFixed(6))
  };
}

async function main() {
  console.log('🌱 Starting database seed...');

  try {
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await prisma.wealthBreakdown.deleteMany();
    await prisma.propertyTransaction.deleteMany();
    await prisma.propertyOwnership.deleteMany();
    await prisma.savedProperty.deleteMany();
    await prisma.property.deleteMany();
    await prisma.owner.deleteMany();
    await prisma.city.deleteMany();
    await prisma.county.deleteMany();
    await prisma.state.deleteMany();

    // 1. Create States
    console.log('🏛️ Creating states...');
    const stateRecords = await Promise.all(
      US_STATES.map(state =>
        prisma.state.create({
          data: {
            name: state.name,
            code: state.code,
            region: state.region,
          },
        })
      )
    );
    console.log(`✅ Created ${stateRecords.length} states`);

    // 2. Create Counties
    console.log('🏘️ Creating counties...');
    const countyRecords = [];
    for (const county of SAMPLE_COUNTIES) {
      const state = stateRecords.find(s => s.code === county.state);
      if (state) {
        const countyRecord = await prisma.county.create({
          data: {
            name: county.name,
            fipsCode: county.fipsCode,
            stateId: state.id,
            population: county.population,
            area: randomFloat(100, 5000),
            medianIncome: randomFloat(40000, 120000),
          },
        });
        countyRecords.push(countyRecord);
      }
    }
    console.log(`✅ Created ${countyRecords.length} counties`);

    // 3. Create Cities
    console.log('🏙️ Creating cities...');
    const cityRecords = [];
    for (const city of MAJOR_CITIES) {
      const state = stateRecords.find(s => s.code === city.state);
      const county = countyRecords.find(c => c.stateId === state?.id);
      
      if (state) {
        const cityRecord = await prisma.city.create({
          data: {
            name: city.name,
            stateId: state.id,
            countyId: county?.id,
            latitude: city.lat,
            longitude: city.lng,
            population: city.population,
            area: randomFloat(50, 500),
            medianIncome: randomFloat(45000, 150000),
            zipCodes: city.zipCodes,
          },
        });
        cityRecords.push(cityRecord);
      }
    }
    console.log(`✅ Created ${cityRecords.length} cities`);

    // 4. Create Owners
    console.log('👥 Creating property owners...');
    const ownerRecords = [];
    
    // Create individual owners
    for (let i = 0; i < 500; i++) {
      const firstName = randomChoice(FIRST_NAMES);
      const lastName = randomChoice(LAST_NAMES);
      const netWorth = randomFloat(100000, 50000000);
      
      const owner = await prisma.owner.create({
        data: {
          type: 'individual',
          firstName,
          lastName,
          dateOfBirth: new Date(randomInt(1940, 1990), randomInt(0, 11), randomInt(1, 28)),
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
          phone: `+1${randomInt(2000000000, 9999999999)}`,
          estimatedNetWorth: netWorth,
          wealthConfidence: randomFloat(0.6, 0.95),
          wealthLastUpdated: new Date(),
          wealthSources: ['wealth_engine', 'public_records'],
          occupation: randomChoice(['Engineer', 'Doctor', 'Lawyer', 'Business Owner', 'Executive', 'Consultant']),
          industry: randomChoice(['Technology', 'Healthcare', 'Finance', 'Real Estate', 'Manufacturing']),
          dataSource: 'mock_data',
          isVerified: Math.random() > 0.3,
        },
      });
      ownerRecords.push(owner);
    }

    // Create entity owners
    for (let i = 0; i < 100; i++) {
      const entityName = randomChoice(COMPANY_NAMES);
      const netWorth = randomFloat(1000000, 500000000);
      
      const owner = await prisma.owner.create({
        data: {
          type: 'entity',
          entityName,
          entityType: randomChoice(['corporation', 'llc', 'partnership', 'trust']),
          ein: `${randomInt(10, 99)}-${randomInt(1000000, 9999999)}`,
          email: `contact@${entityName.toLowerCase().replace(/\s+/g, '')}.com`,
          estimatedNetWorth: netWorth,
          wealthConfidence: randomFloat(0.7, 0.9),
          wealthLastUpdated: new Date(),
          wealthSources: ['pitchbook', 'sec_filings'],
          industry: randomChoice(['Real Estate', 'Investment', 'Development', 'Holdings']),
          dataSource: 'mock_data',
          isVerified: Math.random() > 0.2,
        },
      });
      ownerRecords.push(owner);
    }
    console.log(`✅ Created ${ownerRecords.length} owners`);

    // 5. Create Wealth Breakdowns
    console.log('💰 Creating wealth breakdowns...');
    let wealthBreakdownCount = 0;
    for (const owner of ownerRecords) {
      if (owner.estimatedNetWorth && owner.estimatedNetWorth > 0) {
        const categories = WEALTH_CATEGORIES.slice(0, randomInt(3, 6));
        let remainingPercentage = 100;
        
        for (let i = 0; i < categories.length; i++) {
          const category = categories[i];
          const percentage = i === categories.length - 1 
            ? remainingPercentage 
            : randomFloat(10, remainingPercentage - (categories.length - i - 1) * 5);
          
          const amount = (owner.estimatedNetWorth * percentage) / 100;
          
          await prisma.wealthBreakdown.create({
            data: {
              ownerId: owner.id,
              category,
              amount,
              percentage,
              confidence: randomFloat(0.6, 0.9),
              lastUpdated: new Date(),
              dataSource: 'wealth_engine',
            },
          });
          
          remainingPercentage -= percentage;
          wealthBreakdownCount++;
        }
      }
    }
    console.log(`✅ Created ${wealthBreakdownCount} wealth breakdowns`);

    // 6. Create Properties
    console.log('🏠 Creating properties...');
    const propertyRecords = [];
    
    for (const city of cityRecords) {
      const propertiesInCity = randomInt(50, 200);
      
      for (let i = 0; i < propertiesInCity; i++) {
        const coords = generateRandomCoordinates(city);
        const propertyType = randomChoice(PROPERTY_TYPES);
        const buildingType = randomChoice(BUILDING_TYPES);
        const currentValue = randomFloat(100000, 5000000);
        
        const property = await prisma.property.create({
          data: {
            address: `${randomInt(100, 9999)} ${randomChoice(['Main', 'Oak', 'Pine', 'Elm', 'Maple'])} ${randomChoice(['St', 'Ave', 'Blvd', 'Dr', 'Ln'])}`,
            streetNumber: randomInt(100, 9999).toString(),
            streetName: `${randomChoice(['Main', 'Oak', 'Pine', 'Elm', 'Maple'])} ${randomChoice(['St', 'Ave', 'Blvd', 'Dr', 'Ln'])}`,
            zipCode: randomChoice(city.zipCodes),
            latitude: coords.lat,
            longitude: coords.lng,
            propertyType,
            buildingType,
            yearBuilt: propertyType === 'land' ? null : randomInt(1950, 2023),
            squareFootage: propertyType === 'land' ? null : randomInt(800, 5000),
            lotSize: randomFloat(0.1, 2.0),
            bedrooms: propertyType === 'residential' ? randomInt(1, 6) : null,
            bathrooms: propertyType === 'residential' ? randomFloat(1, 4) : null,
            stories: propertyType === 'residential' ? randomInt(1, 3) : null,
            currentValue,
            assessedValue: currentValue * randomFloat(0.8, 1.2),
            taxAmount: currentValue * randomFloat(0.01, 0.03),
            lastSalePrice: currentValue * randomFloat(0.7, 1.1),
            lastSaleDate: new Date(randomInt(2015, 2023), randomInt(0, 11), randomInt(1, 28)),
            stateId: city.stateId,
            countyId: city.countyId,
            cityId: city.id,
            dataSource: randomChoice(['zillow', 'county_records', 'mls']),
            confidence: randomFloat(0.8, 0.98),
          },
        });
        propertyRecords.push(property);
      }
    }
    console.log(`✅ Created ${propertyRecords.length} properties`);

    // 7. Create Property Ownerships
    console.log('🔗 Creating property ownerships...');
    let ownershipCount = 0;
    for (const property of propertyRecords) {
      const numOwners = Math.random() > 0.8 ? 2 : 1; // 20% chance of joint ownership
      const selectedOwners: string[] = [];
      
      for (let i = 0; i < numOwners; i++) {
        let owner;
        do {
          owner = randomChoice(ownerRecords);
        } while (selectedOwners.includes(owner.id));
        selectedOwners.push(owner.id);
        
        const ownershipPercent = numOwners === 1 ? 100 : (i === 0 ? randomFloat(50, 80) : 100 - selectedOwners.length + 1);
        
        await prisma.propertyOwnership.create({
          data: {
            propertyId: property.id,
            ownerId: owner.id,
            ownershipType: randomChoice(OWNERSHIP_TYPES),
            ownershipPercent,
            startDate: property.lastSaleDate || new Date(randomInt(2010, 2023), randomInt(0, 11), randomInt(1, 28)),
            isActive: true,
          },
        });
        ownershipCount++;
      }
    }
    console.log(`✅ Created ${ownershipCount} property ownerships`);

    // 8. Create Property Transactions
    console.log('💸 Creating property transactions...');
    let transactionCount = 0;
    for (const property of propertyRecords.slice(0, 1000)) { // Limit to first 1000 for performance
      const numTransactions = randomInt(1, 4);
      
      for (let i = 0; i < numTransactions; i++) {
        const transactionDate = new Date(
          randomInt(2015, 2023),
          randomInt(0, 11),
          randomInt(1, 28)
        );
        
        const buyer = randomChoice(ownerRecords);
        const seller = randomChoice(ownerRecords);
        
        if (buyer.id !== seller.id) {
          await prisma.propertyTransaction.create({
            data: {
              propertyId: property.id,
              transactionType: randomChoice(['sale', 'purchase', 'refinance']),
              amount: randomFloat(property.currentValue! * 0.7, property.currentValue! * 1.3),
              date: transactionDate,
              buyerId: buyer.id,
              sellerId: seller.id,
              documentType: randomChoice(['deed', 'mortgage', 'lien']),
              recordingDate: new Date(transactionDate.getTime() + randomInt(1, 30) * 24 * 60 * 60 * 1000),
            },
          });
          transactionCount++;
        }
      }
    }
    console.log(`✅ Created ${transactionCount} property transactions`);

    // 9. Create Data Sources
    console.log('🔌 Creating data sources...');
    const dataSources = [
      {
        name: 'Zillow API',
        type: 'api',
        url: 'https://api.zillow.com',
        isActive: true,
        rateLimit: 1000,
      },
      {
        name: 'Here.com Maps',
        type: 'api', 
        url: 'https://api.here.com',
        isActive: true,
        rateLimit: 2000,
      },
      {
        name: 'PitchBook',
        type: 'api',
        url: 'https://api.pitchbook.com',
        isActive: true,
        rateLimit: 500,
      },
      {
        name: 'Wealth Engine',
        type: 'api',
        url: 'https://api.wealthengine.com',
        isActive: true,
        rateLimit: 300,
      },
      {
        name: 'ReportAll.com',
        type: 'api',
        url: 'https://api.reportall.com',
        isActive: true,
        rateLimit: 800,
      },
      {
        name: 'ZoomInfo',
        type: 'api',
        url: 'https://api.zoominfo.com',
        isActive: true,
        rateLimit: 1200,
      },
      {
        name: 'Fast People Search',
        type: 'api',
        url: 'https://api.fastpeoplesearch.com',
        isActive: true,
        rateLimit: 600,
      },
      {
        name: 'County Records',
        type: 'file',
        url: null,
        isActive: true,
        rateLimit: null,
      },
      {
        name: 'MLS Data',
        type: 'file',
        url: null,
        isActive: true,
        rateLimit: null,
      },
      {
        name: 'SEC Filings',
        type: 'api',
        url: 'https://api.sec.gov',
        isActive: true,
        rateLimit: 100,
      },
      {
        name: 'Public Records',
        type: 'file',
        url: null,
        isActive: true,
        rateLimit: null,
      },
      {
        name: 'Mock Data Generator',
        type: 'manual',
        url: null,
        isActive: true,
        rateLimit: null,
      },
    ];

    let dataSourceCount = 0;
    for (const source of dataSources) {
      await prisma.dataSource.create({
        data: {
          name: source.name,
          type: source.type,
          url: source.url,
          isActive: source.isActive,
          rateLimit: source.rateLimit,
          lastSync: new Date(randomInt(2023, 2024), randomInt(0, 11), randomInt(1, 28)),
        },
      });
      dataSourceCount++;
    }
    console.log(`✅ Created ${dataSourceCount} data sources`);

    console.log('🎉 Database seeding completed successfully!');
    console.log(`
📊 Summary:
- States: ${stateRecords.length}
- Counties: ${countyRecords.length}
- Cities: ${cityRecords.length}
- Owners: ${ownerRecords.length}
- Properties: ${propertyRecords.length}
- Ownerships: ${ownershipCount}
- Transactions: ${transactionCount}
- Wealth Breakdowns: ${wealthBreakdownCount}
- Data Sources: ${dataSourceCount}
    `);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
