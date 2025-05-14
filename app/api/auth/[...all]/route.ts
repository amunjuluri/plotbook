import {auth} from "@/lib/auth"
import { toNextJsHandler } from "better-auth/next-js"
// toNextJsHandler converts Better-Auth's routes to work with Next.js
// [...all] catches all routes that start with /api/auth
// Routes this creates:

// POST /api/auth/sign-up - Register new users
// POST /api/auth/sign-in - Login users
// POST /api/auth/sign-out - Logout users
// GET /api/auth/session - Check if user is logged in

export const { POST, GET } = toNextJsHandler(auth)