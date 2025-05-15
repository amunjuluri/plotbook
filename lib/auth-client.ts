import { createAuthClient } from "better-auth/client";
import { adminClient } from "better-auth/client/plugins";


export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",

    plugins: [
        adminClient()
    ]
})

//this will be used by react components
