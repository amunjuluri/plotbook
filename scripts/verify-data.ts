import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

async function verifyData() {
  console.log('🔍 Verifying database data...\n');

  try {
    // Check States
    const stateCount = await prisma.state.count();
    const sampleStates = await prisma.state.findMany({ take: 5 });
    console.log(`📍 States: ${stateCount} total`);
    console.log('Sample states:', sampleStates.map(s => `${s.name} (${s.code})`).join(', '));
    console.log();

    // Check Counties
    const countyCount = await prisma.county.count();
    const sampleCounties = await prisma.county.findMany({ 
      take: 5,
      include: { state: true }
    });
    console.log(`🏘️ Counties: ${countyCount} total`);
    console.log('Sample counties:', sampleCounties.map(c => `${c.name}, ${c.state.code}`).join(', '));
    console.log();

    // Check Cities
    const cityCount = await prisma.city.count();
    const sampleCities = await prisma.city.findMany({ 
      take: 5,
      include: { state: true }
    });
    console.log(`🏙️ Cities: ${cityCount} total`);
    console.log('Sample cities:', sampleCities.map(c => `${c.name}, ${c.state.code} (${c.latitude}, ${c.longitude})`).join(', '));
    console.log();

    // Check Owners
    const ownerCount = await prisma.owner.count();
    const individualOwners = await prisma.owner.count({ where: { type: 'individual' } });
    const entityOwners = await prisma.owner.count({ where: { type: 'entity' } });
    const sampleOwners = await prisma.owner.findMany({ take: 5 });
    console.log(`👥 Owners: ${ownerCount} total (${individualOwners} individuals, ${entityOwners} entities)`);
    console.log('Sample owners:', sampleOwners.map(o => 
      o.type === 'individual' 
        ? `${o.firstName} ${o.lastName} ($${o.estimatedNetWorth?.toLocaleString()})`
        : `${o.entityName} ($${o.estimatedNetWorth?.toLocaleString()})`
    ).join(', '));
    console.log();

    // Check Properties
    const propertyCount = await prisma.property.count();
    const propertyTypes = await prisma.property.groupBy({
      by: ['propertyType'],
      _count: { propertyType: true }
    });
    const sampleProperties = await prisma.property.findMany({ 
      take: 5,
      include: { city: true, state: true }
    });
    console.log(`🏠 Properties: ${propertyCount} total`);
    console.log('By type:', propertyTypes.map(p => `${p.propertyType}: ${p._count.propertyType}`).join(', '));
    console.log('Sample properties:', sampleProperties.map(p => 
      `${p.address}, ${p.city?.name}, ${p.state.code} ($${p.currentValue?.toLocaleString()})`
    ).join(', '));
    console.log();

    // Check Property Ownerships
    const ownershipCount = await prisma.propertyOwnership.count();
    const activeOwnerships = await prisma.propertyOwnership.count({ where: { isActive: true } });
    console.log(`🔗 Property Ownerships: ${ownershipCount} total (${activeOwnerships} active)`);
    console.log();

    // Check Transactions
    const transactionCount = await prisma.propertyTransaction.count();
    const transactionTypes = await prisma.propertyTransaction.groupBy({
      by: ['transactionType'],
      _count: { transactionType: true }
    });
    console.log(`💸 Transactions: ${transactionCount} total`);
    console.log('By type:', transactionTypes.map(t => `${t.transactionType}: ${t._count.transactionType}`).join(', '));
    console.log();

    // Check Wealth Breakdowns
    const wealthCount = await prisma.wealthBreakdown.count();
    const wealthCategories = await prisma.wealthBreakdown.groupBy({
      by: ['category'],
      _count: { category: true }
    });
    console.log(`💰 Wealth Breakdowns: ${wealthCount} total`);
    console.log('By category:', wealthCategories.map(w => `${w.category}: ${w._count.category}`).join(', '));
    console.log();

    // Check Data Sources
    const dataSourceCount = await prisma.dataSource.count();
    const activeDataSources = await prisma.dataSource.count({ where: { isActive: true } });
    const dataSourceTypes = await prisma.dataSource.groupBy({
      by: ['type'],
      _count: { type: true }
    });
    const sampleDataSources = await prisma.dataSource.findMany({ take: 5 });
    console.log(`🔌 Data Sources: ${dataSourceCount} total (${activeDataSources} active)`);
    console.log('By type:', dataSourceTypes.map(d => `${d.type}: ${d._count.type}`).join(', '));
    console.log('Sample sources:', sampleDataSources.map(d => `${d.name} (${d.type})`).join(', '));
    console.log();

    // Sample wealth analysis
    const topOwners = await prisma.owner.findMany({
      where: { estimatedNetWorth: { not: null } },
      orderBy: { estimatedNetWorth: 'desc' },
      take: 5,
      include: { wealthBreakdown: true }
    });
    console.log('🏆 Top 5 Wealthiest Owners:');
    topOwners.forEach((owner, index) => {
      const name = owner.type === 'individual' 
        ? `${owner.firstName} ${owner.lastName}`
        : owner.entityName;
      console.log(`${index + 1}. ${name}: $${owner.estimatedNetWorth?.toLocaleString()} (${owner.wealthBreakdown.length} wealth categories)`);
    });
    console.log();

    // Geographic distribution
    const propertiesByState = await prisma.property.groupBy({
      by: ['stateId'],
      _count: { stateId: true },
      orderBy: { _count: { stateId: 'desc' } },
      take: 5
    });
    
    const stateNames = await Promise.all(
      propertiesByState.map(async (p) => {
        const state = await prisma.state.findUnique({ where: { id: p.stateId } });
        return { name: state?.name, code: state?.code, count: p._count.stateId };
      })
    );
    
    console.log('🗺️ Top 5 States by Property Count:');
    stateNames.forEach((state, index) => {
      console.log(`${index + 1}. ${state.name} (${state.code}): ${state.count} properties`);
    });

    console.log('\n✅ Database verification completed successfully!');

  } catch (error) {
    console.error('❌ Error verifying data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyData(); 