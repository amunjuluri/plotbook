import {betterAuth} from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { PrismaClient } from "@/generated/prisma"
import { admin } from "better-auth/plugins"

const prisma = new PrismaClient()

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  // Ensure the user role and tab permissions are included in the session
  user: {
    additionalFields: {
      role: {
        type: "string"
      },
      canAccessDashboard: {
        type: "boolean"
      },
      canAccessSavedProperties: {
        type: "boolean"
      },
      canAccessTeamManagement: {
        type: "boolean"
      }
    }
  },

  emailAndPassword:{
    enabled: true
  },
  plugins: [
    admin({
      defaultRole: "user",
      adminRole: "admin"
    }) 
  ]
  
})
