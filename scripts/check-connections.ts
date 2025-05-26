import { prisma } from '../lib/prisma';

async function checkConnections() {
  try {
    console.log('🔍 Checking database connections...\n');
    
    // Test basic connection
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connection successful');
    
    // Check current connections
    const connections = await prisma.$queryRaw`
      SELECT 
        count(*) as total_connections,
        count(*) FILTER (WHERE state = 'active') as active_connections,
        count(*) FILTER (WHERE state = 'idle') as idle_connections
      FROM pg_stat_activity 
      WHERE datname = current_database()
    ` as any[];
    
    console.log('📊 Connection Statistics:');
    console.log(`   Total connections: ${connections[0].total_connections}`);
    console.log(`   Active connections: ${connections[0].active_connections}`);
    console.log(`   Idle connections: ${connections[0].idle_connections}`);
    
    // Check connection details
    const connectionDetails = await prisma.$queryRaw`
      SELECT 
        pid,
        usename,
        application_name,
        client_addr,
        state,
        query_start,
        state_change
      FROM pg_stat_activity 
      WHERE datname = current_database()
      ORDER BY state_change DESC
    ` as any[];
    
    console.log('\n📋 Active Connections:');
    connectionDetails.forEach((conn, index) => {
      console.log(`   ${index + 1}. PID: ${conn.pid}, User: ${conn.usename}, App: ${conn.application_name}, State: ${conn.state}`);
    });
    
    // Test a simple query
    const userCount = await prisma.user.count();
    console.log(`\n✅ Test query successful: ${userCount} users in database`);
    
  } catch (error) {
    console.error('❌ Database connection error:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

checkConnections()
  .catch((e) => {
    console.error('❌ Script failed:', e);
    process.exit(1);
  }); 