"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import GoogleSignInButton from "@/app/login/google-sign-in";

export default function SignupPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl">
        <p className="text-sm text-brand-300">Create your account</p>
        <h1 className="text-3xl font-bold mt-1">Join James AI</h1>
        <p className="text-sm text-white/50 mt-2 mb-7">Already have an account? <Link href="/login" className="text-brand-400 hover:underline">Sign in</Link></p>

        <GoogleSignInButton callbackUrl="/dashboard" />

        <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-5 space-y-3 text-sm">
          <p className="font-medium">Why Google first?</p>
          <p className="text-white/50">James AI only creates new accounts after Google verifies the identity and email. Consumer Gmail accounts must be genuine Google accounts; approved university Google Workspace domains can also be allowed by the administrator.</p>
          <p className="text-white/50">After Google verification, James AI asks you to create a strong backup password. The app can generate one for you.</p>
        </div>

        <p className="text-xs text-white/30 text-center mt-6">By continuing, you agree to your institution's rules and James AI's terms and privacy policy.</p>
      </div>
    </main>
  );
}
