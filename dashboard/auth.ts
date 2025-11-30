import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import Credentials from "next-auth/providers/credentials"

// Environment variables for auth configuration (with defaults for build time)
const ENABLE_PASSWORD_AUTH = process.env.ENABLE_PASSWORD_AUTH === "true"
const ENABLE_GITHUB_SSO = process.env.ENABLE_GITHUB_SSO === "true"
const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD
const ALLOWED_GITHUB_USERNAME = process.env.ALLOWED_GITHUB_USERNAME

// Validation function that runs at runtime
function validateAuthConfig() {
  // Validate that at least one auth method is enabled
  if (!ENABLE_PASSWORD_AUTH && !ENABLE_GITHUB_SSO) {
    throw new Error(
      "Authentication configuration error: At least one authentication method must be enabled. " +
      "Set ENABLE_PASSWORD_AUTH=true or ENABLE_GITHUB_SSO=true in your environment variables."
    )
  }

  // Validate required environment variables for enabled auth methods
  if (ENABLE_PASSWORD_AUTH && !DASHBOARD_PASSWORD) {
    throw new Error(
      "Authentication configuration error: DASHBOARD_PASSWORD is required when ENABLE_PASSWORD_AUTH=true"
    )
  }

  if (ENABLE_GITHUB_SSO) {
    if (!process.env.AUTH_GITHUB_ID || !process.env.AUTH_GITHUB_SECRET) {
      throw new Error(
        "Authentication configuration error: AUTH_GITHUB_ID and AUTH_GITHUB_SECRET are required when ENABLE_GITHUB_SSO=true"
      )
    }
    if (!ALLOWED_GITHUB_USERNAME) {
      throw new Error(
        "Authentication configuration error: ALLOWED_GITHUB_USERNAME is required when ENABLE_GITHUB_SSO=true"
      )
    }
  }
}

// Build providers array conditionally
const providers = []

// Add GitHub provider if enabled
if (ENABLE_GITHUB_SSO) {
  providers.push(
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
    })
  )
}

// Add Credentials provider if enabled
if (ENABLE_PASSWORD_AUTH) {
  providers.push(
    Credentials({
      name: "Password",
      credentials: {
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.password) {
          return null
        }

        // Validate password
        if (credentials.password === DASHBOARD_PASSWORD) {
          return {
            id: "dashboard-user",
            name: "Dashboard User",
            email: "user@openmemory.local",
          }
        }

        return null
      },
    })
  )
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // For GitHub OAuth, check if username is in allowlist
      if (account?.provider === "github") {
        const githubUsername = (profile as any)?.login
        
        if (githubUsername !== ALLOWED_GITHUB_USERNAME) {
          console.warn(
            `GitHub login attempt from unauthorized user: ${githubUsername}`
          )
          return false
        }
        
        console.log(
          `GitHub login successful for authorized user: ${githubUsername}`
        )
      }
      
      return true
    },
    async jwt({ token, user, account, profile }) {
      // Add custom data to JWT token
      if (account?.provider === "github") {
        token.githubUsername = (profile as any)?.login
      }
      return token
    },
    async session({ session, token }) {
      // Add custom data to session
      if (token.githubUsername) {
        session.user.name = token.githubUsername as string
      }
      return session
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  trustHost: true,
})

// Export auth configuration for use in other files
export const authConfig = {
  enablePasswordAuth: ENABLE_PASSWORD_AUTH,
  enableGithubSSO: ENABLE_GITHUB_SSO,
}
