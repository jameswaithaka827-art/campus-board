"use client";

import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { PRO_FEATURES } from "@/lib/entitlements";

function PesapalCheckout({ amountKsh }: { amountKsh: number }) {
 const [status,setStatus]=useState(""); const [busy,setBusy]=useState(false);
 async function pay(){setBusy(true);setStatus("");try{const r=await fetch("/api/payments/pesapal/submit",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({amountKsh})});const d=await r.json().catch(()=>({}));if(r.ok&&d.redirectUrl){window.location.href=d.redirectUrl;return;}setStatus(d.error||"Pesapal checkout is not ready yet.");}finally{setBusy(false)}}
 return <div className="mt-3 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.05] p-4"><div className="text-sm font-semibold text-emerald-200">Pay with Pesapal</div><p className="mt-1 text-xs text-slate-500">Choose M-PESA, card, or Airtel Money on Pesapal's secure page. Pro activates once payment is confirmed server-side.</p><button onClick={pay} disabled={busy} className="mt-3 w-full rounded-xl border border-emerald-400/20 px-4 py-2.5 text-sm font-semibold text-emerald-200 disabled:opacity-50">{busy?"Opening Pesapal…":`Pay KSh ${amountKsh} with Pesapal`}</button>{status&&<p className="mt-3 text-xs text-slate-400">{status}</p>}</div>;}

export default function PricingPage(){
 const {data:session}=useSession(); const [loading,setLoading]=useState(false); const proPriceKsh=399;
 // null while loading = render nothing yet, avoids a flash of the wrong plan state
 const [freeMode,setFreeMode]=useState<boolean|null>(null);

 useEffect(()=>{
   fetch("/api/config").then(r=>r.json()).then(d=>setFreeMode(!!d.freeMode)).catch(()=>setFreeMode(true));
 },[]);

 async function handleSubscribe(){ if(!session){signIn(undefined,{callbackUrl:'/pricing'});return;} setLoading(true); try{const res=await fetch('/api/stripe/checkout',{method:'POST'}); const data=await res.json(); if(data.url)window.location.href=data.url;}finally{setLoading(false);} }

 if (freeMode === null) return null;

 if (freeMode) {
   return (
     <main className="min-h-screen bg-slate-950 text-slate-100 px-4 py-12">
       <div className="mx-auto max-w-5xl">
         <div className="text-center">
           <p className="text-sm text-brand-300">James AI</p>
           <h1 className="mt-1 text-4xl font-bold">A better workspace for serious study</h1>
           <p className="mt-3 text-slate-400 max-w-2xl mx-auto">
             James AI is currently free for everyone{session?.user ? "" : " — sign up and every feature below is already included"}.
             No card, no Pesapal, no subscription required.
           </p>
         </div>

         <div className="mt-6 mx-auto max-w-2xl rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center text-sm text-emerald-200">
           Everything on this page — including the features listed under "Pro" — is included free while James AI is in early access.
         </div>

         <div className="mt-10 grid gap-6 md:grid-cols-2">
           <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
             <div className="text-sm text-slate-500">Free</div>
             <div className="mt-2 text-4xl font-bold">$0</div>
             <p className="mt-2 text-sm text-slate-400">For getting started.</p>
             <div className="mt-6 space-y-3 text-sm text-slate-300">
               <div>✓ 20 AI actions / month</div>
               <div>✓ Notes, planner and reminders</div>
               <div>✓ 1 photo attachment in AI chat</div>
               <div>✓ Course and tuition access</div>
             </div>
             <button disabled className="mt-7 w-full rounded-xl border border-white/10 py-3 text-sm">
               Current starting plan
             </button>
           </section>

           <section className="rounded-3xl border border-brand-500/40 bg-brand-500/5 p-7 shadow-2xl shadow-brand-950/30">
             <div className="flex items-center justify-between">
               <div className="text-sm text-brand-300">Pro</div>
               <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs text-emerald-200">Included free right now</span>
             </div>
             <div className="mt-2 text-4xl font-bold">
               $0<span className="text-lg font-normal text-slate-500"> for now</span>
             </div>
             <p className="mt-2 text-sm text-slate-400">
               Normally $5/mo (or KSh {proPriceKsh} via Pesapal) — free while James AI is in early access.
             </p>
             <div className="mt-6 space-y-3 text-sm text-slate-200">
               {PRO_FEATURES.map((x) => (
                 <div key={x}>✓ {x}</div>
               ))}
             </div>
             <button
               disabled
               className="mt-7 w-full rounded-xl bg-emerald-600/80 py-3 text-sm font-semibold cursor-default"
             >
               Already included — nothing to do
             </button>
             <p className="mt-3 text-[11px] text-slate-500">
               Paid billing isn't enabled on this deployment. When it's turned back on, existing accounts keep their
               current access until you choose to change plans.
             </p>
           </section>
         </div>

         <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-sm text-slate-400">
           <strong className="text-slate-200">What Pro unlocks:</strong> more AI capacity, current web research,
           multi-photo study help, higher study limits and deeper analytics — all already active on every account.
         </div>
       </div>
     </main>
   );
 }

 // FREE_MODE=false — real checkout, unchanged from the original.
 return <main className="min-h-screen bg-slate-950 text-slate-100 px-4 py-12"><div className="mx-auto max-w-5xl"><div className="text-center"><p className="text-sm text-brand-300">James AI Pro</p><h1 className="mt-1 text-4xl font-bold">A better workspace for serious study</h1><p className="mt-3 text-slate-400 max-w-2xl mx-auto">Keep the core workspace free. Pro gives heavier AI usage, image analysis and advanced learning tools.</p></div><div className="mt-10 grid gap-6 md:grid-cols-2"><section className="rounded-3xl border border-white/10 bg-white/[0.03] p-7"><div className="text-sm text-slate-500">Free</div><div className="mt-2 text-4xl font-bold">$0</div><p className="mt-2 text-sm text-slate-400">For getting started.</p><div className="mt-6 space-y-3 text-sm text-slate-300"><div>✓ 20 AI actions / month</div><div>✓ Notes, planner and reminders</div><div>✓ 1 photo attachment in AI chat</div><div>✓ Course and tuition access</div></div><button disabled className="mt-7 w-full rounded-xl border border-white/10 py-3 text-sm">Current starting plan</button></section><section className="rounded-3xl border border-brand-500/40 bg-brand-500/5 p-7 shadow-2xl shadow-brand-950/30"><div className="flex items-center justify-between"><div className="text-sm text-brand-300">Pro</div><span className="rounded-full bg-brand-500/15 px-2.5 py-1 text-xs text-brand-200">Recommended</span></div><div className="mt-2 text-4xl font-bold">$5<span className="text-lg font-normal text-slate-500">/mo</span></div><p className="mt-2 text-sm text-slate-400">For students and educators who use James AI heavily.</p><div className="mt-6 space-y-3 text-sm text-slate-200">{PRO_FEATURES.map(x=><div key={x}>✓ {x}</div>)}</div><button onClick={handleSubscribe} disabled={loading} className="mt-7 w-full rounded-xl bg-brand-600 py-3 text-sm font-semibold disabled:opacity-50">{loading?'Opening secure checkout…':'Upgrade to Pro'}</button><PesapalCheckout amountKsh={proPriceKsh}/><p className="mt-3 text-[11px] text-slate-500">Website: Stripe and Pesapal are supported paths when configured. Android/iOS digital Pro purchases must follow the stores' billing policies.</p></section></div><div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-sm text-slate-400"><strong className="text-slate-200">What Pro unlocks:</strong> more AI capacity, current web research, multi-photo study help, higher study limits and deeper analytics. Access is granted from the server after the subscription provider confirms the purchase.</div></div></main>;
}
