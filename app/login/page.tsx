"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import GoogleSignInButton from "./google-sign-in";

function ForgotPassword(){
  const [email,setEmail]=useState(""); const [status,setStatus]=useState("");
  async function send(){setStatus(""); const r=await fetch("/api/account/password/reset-request",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email})}); setStatus(r.ok?"If an eligible account exists, a reset link has been sent.":"Please try again later.");}
  return <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-4"><div className="text-sm font-medium">Forgot your password?</div><div className="mt-2 flex gap-2"><input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="your@gmail.com" className="min-w-0 flex-1 rounded-xl bg-black/20 border border-white/10 px-3 py-2 text-sm"/><button onClick={send} className="rounded-xl border border-white/10 px-3 py-2 text-xs">Email reset</button></div>{status&&<p className="mt-2 text-[11px] text-slate-500">{status}</p>}</div>
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [needsCode, setNeedsCode] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", { redirect: false, email, password, code: needsCode ? code : undefined });
    setLoading(false);
    if (res?.error === "LOGIN_CODE_REQUIRED") {
      setNeedsCode(true);
      return;
    }
    if (res?.error) {
      setError(res.error === "CredentialsSignin" ? "Invalid email or password." : res.error);
      return;
    }
    router.push("/dashboard");
  }

  async function resendCode() {
    setLoading(true);
    setError("");
    setCode("");
    const res = await signIn("credentials", { redirect: false, email, password });
    setLoading(false);
    if (res?.error && res.error !== "LOGIN_CODE_REQUIRED") {
      setError("Could not resend the code. " + (res.error === "CredentialsSignin" ? "Check your password." : res.error));
    }
  }

  return (
    <main className="min-h-screen grid lg:grid-cols-2">
      <section className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-brand-700/30 via-black to-black border-r border-white/10">
        <div className="text-lg font-semibold">James AI</div>
        <div>
          <p className="text-brand-300 text-sm">Student workspace</p>
          <h1 className="text-5xl font-bold leading-tight mt-3">Study smarter.<br />Plan better.<br />Keep moving.</h1>
          <p className="text-white/50 max-w-md mt-5">A secure workspace for students and education teams.</p>
        </div>
        <p className="text-xs text-white/30">Your Google identity is verified before a James AI account is created.</p>
      </section>

      <section className="flex items-center justify-center px-6 py-12">
        <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-7 shadow-2xl">
          <p className="text-sm text-brand-300">Welcome back</p>
          <h2 className="text-3xl font-bold mt-1">Sign in to James AI</h2>
          <p className="text-sm text-white/50 mt-2 mb-7">New here? <Link href="/signup" className="text-brand-400 hover:underline">Create an account</Link></p>

          <GoogleSignInButton />
          <div className="my-5 flex items-center gap-3 text-xs text-white/35"><div className="h-px flex-1 bg-white/10" />or use password<div className="h-px flex-1 bg-white/10" /></div>

          {!needsCode ? (
            <>
              <label className="block text-sm text-white/70 mb-2">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className="w-full mb-4 rounded-xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-brand-500" required />
              <label className="block text-sm text-white/70 mb-2">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" className="w-full mb-5 rounded-xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-brand-500" required />
            </>
          ) : (
            <>
              <div className="mb-4 rounded-xl border border-brand-500/20 bg-brand-500/5 p-4 text-sm text-white/70">
                We sent a 6-digit code to <span className="text-white">{email}</span>. Enter it below to finish signing in.
              </div>
              <label className="block text-sm text-white/70 mb-2">Login code</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                autoComplete="one-time-code"
                autoFocus
                className="w-full mb-3 rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-center text-2xl tracking-[0.5em] outline-none focus:border-brand-500"
              />
              <button type="button" onClick={resendCode} disabled={loading} className="text-xs text-brand-400 hover:underline mb-5 disabled:opacity-50">
                Didn't get it? Resend code
              </button>
            </>
          )}
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
          <button type="submit" disabled={loading || (needsCode && code.length !== 6)} className="w-full rounded-xl bg-brand-600 py-3 font-semibold disabled:opacity-50">
            {loading ? "Signing in…" : needsCode ? "Confirm code" : "Sign in"}
          </button>
          {needsCode && (
            <button type="button" onClick={() => { setNeedsCode(false); setCode(""); setError(""); }} className="w-full text-center text-xs text-white/40 hover:underline mt-3">
              ← Use a different account
            </button>
          )}
          <p className="text-xs text-white/35 text-center mt-5">New accounts must complete Google verification first.</p>
        </form>
      <ForgotPassword />
      </section>
    </main>
  );
}
