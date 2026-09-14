import "next-auth";
import "next-auth/jwt";
import type { DefaultSession } from "next-auth";
declare module "next-auth" {
  interface Session { user: { id: string; needsPasswordSetup?: boolean; needsEmailVerification?: boolean; role?: string | null; } & DefaultSession["user"]; }
}
declare module "next-auth/jwt" {
  interface JWT { id?: string; sessionVersion?: number; needsPasswordSetup?: boolean; needsEmailVerification?: boolean; role?: string | null; }
}
