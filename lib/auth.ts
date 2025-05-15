import {betterAuth} from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { PrismaClient } from "@/generated/prisma"
import { admin } from "better-auth/plugins"

const prisma = new PrismaClient()

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  // Ensure the user role is included in the session
  user: {
    additionalFields: {
      role: {
        type: "string"
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
