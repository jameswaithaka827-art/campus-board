import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { requireEnv } from "@/lib/env";
import { isAllowedGoogleAccount } from "@/lib/google-policy";
import { issueEmailVerificationCode } from "@/lib/email-verification";
import { issueLoginCode, verifyLoginCode } from "@/lib/login-verification";
import { recordSecurityEvent } from "@/lib/security-events";

const DUMMY_HASH = "$2a$10$CwTycUXWue0Thq9StjUM0uJ8G1S0i7yYQF9x2xM9F0f9x0.J5uK5W";

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.toLowerCase().trim();
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 320) return null;
  return email;
}

const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    name: "Password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
      code: { label: "Login code", type: "text" },
    },
    async authorize(credentials) {
      const email = normalizeEmail(credentials?.email);
      const password = typeof credentials?.password === "string" ? credentials.password : "";
      const code = typeof credentials?.code === "string" ? credentials.code.trim() : "";
      if (!email || password.length === 0 || password.length > 200) return null;

      const { allowed } = rateLimit(`login:${email}`, 8, 10 * 60_000);
      if (!allowed) throw new Error("Too many login attempts. Try again later.");

      const user = await prisma.user.findUnique({ where: { email } });
      const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
      if (!user || !valid) return null;
      if (user.accountStatus !== "active" || !user.emailVerificationCompletedAt) throw new Error("This account has not completed email verification.");
      if (!user.googleId || !user.emailVerifiedAt) {
        throw new Error("This account must be verified with Google before password login is available.");
      }

      // Password is correct at this point. Second factor: a one-time code
      // sent to the account's email, required before a session is created.
      if (!code) {
        const { allowed: codeAllowed } = rateLimit(`login-code:${email}`, 5, 10 * 60_000);
        if (!codeAllowed) throw new Error("Too many code requests. Try again later.");
        await issueLoginCode(user.id, user.email);
        // A specific, recognizable error the login page watches for to
        // switch to the code-entry step — not a real failure.
        throw new Error("LOGIN_CODE_REQUIRED");
      }

      const result = await verifyLoginCode(user.id, code);
      if (!result.ok) {
        if (result.reason === "expired") throw new Error("That code expired. Request a new one.");
        if (result.reason === "locked") throw new Error("Too many incorrect codes. Request a new one.");
        throw new Error("Incorrect code.");
      }

      await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
      await recordSecurityEvent({ userId: user.id, type: "login_password" });
      return { id: user.id, email: user.email, name: user.name ?? undefined };
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: { prompt: "select_account", response_type: "code" },
      },
    })
  );
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login" },
  providers,
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== "google") return true;

      const email = normalizeEmail(profile?.email);
      const emailVerified =
        (profile as { email_verified?: boolean } | undefined)?.email_verified === true;
      const hostedDomain =
        (profile as { hd?: string } | undefined)?.hd;

      if (!email || !profile?.sub || !isAllowedGoogleAccount({ email, emailVerified, hostedDomain })) {
        return false;
      }

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing && !["active", "pending_verification"].includes(existing.accountStatus)) return false;
      if (existing?.googleId && existing.googleId !== profile.sub) return false;
      return true;
    },

    async jwt({ token, user, account, profile }) {
      if (user?.id) token.id = user.id;

      if (account?.provider === "google") {
        const email = normalizeEmail(profile?.email);
        const googleId = typeof profile?.sub === "string" ? profile.sub : null;
        const emailVerified =
          (profile as { email_verified?: boolean } | undefined)?.email_verified === true;
        const hostedDomain = (profile as { hd?: string } | undefined)?.hd;

        if (!email || !googleId || !isAllowedGoogleAccount({ email, emailVerified, hostedDomain })) {
          throw new Error("Google account could not be verified.");
        }

        const byGoogleId = await prisma.user.findUnique({ where: { googleId } });
        const byEmail = await prisma.user.findUnique({ where: { email } });
        if (byGoogleId && byGoogleId.email !== email) {
          throw new Error("This Google account is already linked to a different James AI account.");
        }
        if (byEmail?.googleId && byEmail.googleId !== googleId) {
          throw new Error("This email is already linked to a different Google account.");
        }
        if (byEmail?.accountStatus !== undefined && !["active", "pending_verification"].includes(byEmail.accountStatus)) {
          throw new Error("This account is not active.");
        }

        const existing = byGoogleId ?? byEmail;
        const name = typeof profile?.name === "string" ? profile.name.trim().slice(0, 200) : null;
        // Google's OAuth profile includes `picture` at runtime; NextAuth's
        // generic `Profile` type doesn't declare it, hence the cast.
        const googlePicture = (profile as { picture?: unknown } | undefined)?.picture;
        const picture = typeof googlePicture === "string" ? googlePicture : null;
        const dbUser = existing
          ? await prisma.user.update({
              where: { id: existing.id },
              data: {
                googleId,
                emailVerifiedAt: existing.emailVerifiedAt ?? new Date(),
                name: existing.name ?? name,
                avatarUrl: existing.avatarUrl ?? picture,
                lastLoginAt: new Date(),
              },
            })
          : await prisma.user.create({
              data: {
                email,
                passwordHash: null,
                googleId,
                emailVerifiedAt: new Date(),
                emailVerificationCompletedAt: new Date(),
                accountStatus: "active",
                name,
                avatarUrl: picture,
                role: "student",
                lastLoginAt: new Date(),
              },
            });

        if (!dbUser.emailVerificationCompletedAt) {
          try { await issueEmailVerificationCode(dbUser.id, dbUser.email); } catch (error) {
            console.error("Verification email delivery failed", error);
          }
        }

        await recordSecurityEvent({ userId: dbUser.id, type: "login_google" });
        token.id = dbUser.id;
      }

      if (token.id) {
        const current = await prisma.user.findUnique({
          where: { id: String(token.id) },
          select: { sessionVersion: true, accountStatus: true, passwordHash: true, emailVerificationCompletedAt: true, role: true },
        });
        if (!current || !["active", "pending_verification"].includes(current.accountStatus)) return {};
        if (typeof token.sessionVersion === "number" && token.sessionVersion !== current.sessionVersion) {
          return {};
        }
        token.sessionVersion = current.sessionVersion;
        token.needsPasswordSetup = !current.passwordHash;
        token.needsEmailVerification = !current.emailVerificationCompletedAt;
        token.role = current.role;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user && token.id) session.user.id = String(token.id);
      if (session.user) {
        session.user.needsPasswordSetup = token.needsPasswordSetup === true;
        session.user.needsEmailVerification = token.needsEmailVerification === true;
        session.user.role = typeof token.role === "string" ? token.role : null;
      }
      return session;
    },
  },
  secret: requireEnv("NEXTAUTH_SECRET"),
};
