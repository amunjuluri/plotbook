import { PrismaClient } from "@/generated/prisma";
import { auth } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  try {
    // Get Better Auth context for password hashing
    const ctx = await auth.$context;

    // Admin user data
    const adminEmail = "admin@plotbook.com";
    const adminPassword = "Admin123!@#";
    const adminName = "Admin User";

    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      console.log("✅ Admin user already exists:", adminEmail);
      return;
    }

    // Hash the password using Better Auth's password hashing
    const hashedPassword = await ctx.password.hash(adminPassword);

    // Generate unique IDs
    const userId = uuidv4();
    const accountId = uuidv4();

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        id: userId,
        name: adminName,
        email: adminEmail,
        emailVerified: true, // Admin should be pre-verified
        role: "admin", // Set admin role
        createdAt: new Date(),
        updatedAt: new Date(),
        banned: false,
      },
    });

    // Create credential account for the admin user
    await prisma.account.create({
      data: {
        id: accountId,
        accountId: "credential", // Better Auth uses "credential" for email/password accounts
        providerId: "credential", // Provider ID for email/password authentication
        userId: userId,
        password: hashedPassword, // Store the hashed password
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log("✅ Admin user created successfully!");
    console.log("📧 Email:", adminEmail);
    console.log("🔑 Password:", adminPassword);
    console.log("👤 Role: admin");
    console.log("🆔 User ID:", userId);
    
    console.log("\n⚠️  IMPORTANT: Please change the admin password after first login!");
    console.log("🔐 You can sign in at: /signin");

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log("🔌 Database connection closed");
  });
