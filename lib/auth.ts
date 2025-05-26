import {betterAuth} from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { prisma } from "@/lib/prisma"
import { admin } from "better-auth/plugins"

interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  role?: string;
  companyId?: string;
  canAccessDashboard?: boolean;
  canAccessSavedProperties?: boolean;
  canAccessTeamManagement?: boolean;
}

interface UserFromAuth {
  email: string;
  name?: string; 
  [key: string]: any;
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  user: {
    additionalFields: {
      role: { type: "string" },
      companyId: { type: "string" }, // companyId is optional in Prisma schema for User
      canAccessDashboard: { type: "boolean" },
      canAccessSavedProperties: { type: "boolean" },
      canAccessTeamManagement: { type: "boolean" },
    },
  },
  emailAndPassword: {
    enabled: true,
    // onUserCreate is called by Better Auth *before* the user is saved to the DB.
    // It should ensure all fields required by the DB (not set by BetterAuth core) are present.
    onUserCreate: async (user: UserFromAuth /*, ctx: AuthContext */) => {
      console.log("!!! PLOTBOOK_AUTH_DEBUG: Minimal onUserCreate hook STARTED !!!");
      console.log(`!!! PLOTBOOK_AUTH_DEBUG: User object received by onUserCreate: ${JSON.stringify(user)} !!!`);
      const now = new Date();
      
      // Ensure basic fields that Better Auth might not set by default are present.
      // Better Auth should handle email, name (if passed), and password hashing.
      const defaultsToEnsure = {
        role: user.role || 'user',
        emailVerified: user.emailVerified || false,
        canAccessDashboard: user.canAccessDashboard === undefined ? true : user.canAccessDashboard,
        canAccessSavedProperties: user.canAccessSavedProperties === undefined ? true : user.canAccessSavedProperties,
        canAccessTeamManagement: user.canAccessTeamManagement === undefined ? false : user.canAccessTeamManagement,
        createdAt: user.createdAt || now,
        updatedAt: user.updatedAt || now,
        // companyId will be set by our custom API route, so it can be undefined here.
        // name should be passed in `user` if provided in signup form
      };

      const finalUserData = { ...user, ...defaultsToEnsure };
      console.log(`!!! PLOTBOOK_AUTH_DEBUG: User data returned by onUserCreate: ${JSON.stringify(finalUserData)} !!!`);
      return finalUserData;
    },
  },
  plugins: [
    admin({
      defaultRole: "user",
      adminRole: "admin",
    }),
  ],
});
