"use client";
import { useEffect, useState } from "react";
import StatCard from "@/components/ui/StatCard";
import Badge, { paymentStatusTone } from "@/components/ui/Badge";
import SectionHeader from "@/components/ui/SectionHeader";
import EmptyState from "@/components/ui/EmptyState";
import Card from "@/components/ui/Card";

type User={id:string;email:string;name:string|null;role:string|null;accountStatus:string;createdAt:string;lastLoginAt:string|null;emailVerificationCompletedAt:string|null;subscriptionStatus:string|null};
type Stats={total:number;active:number;pending:number;suspended:number;students:number;lecturers:number;audit:number};
type Log={id:string;action:string;targetUserId:string|null;metadata:string|null;createdAt:string;adminUser:{email:string}};
type Report={id:string;reason:string;details:string|null;createdAt:string;reporter:{email:string;name:string|null};reported:{id:string;email:string;name:string|null}};
type Verification={id:string;submittedAt:string;user:{id:string;name:string|null;email:string}};
type Transaction={id:string;provider:string;type:string;reference:string;amountKsh:number;status:string;createdAt:string;user:{email:string;name:string|null}};
type Finance={grossPaidKsh:number;pendingKsh:number;failedKsh:number;activePro:number;recent:Transaction[]};

export default function AdminPanel(){
 const [stats,setStats]=useState<Stats|null>(null),[securityEvents,setSecurityEvents]=useState<any[]>([]),[users,setUsers]=useState<User[]>([]),[logs,setLogs]=useState<Log[]>([]),[reports,setReports]=useState<Report[]>([]),[verifications,setVerifications]=useState<Verification[]>([]),[finance,setFinance]=useState<Finance|null>(null),[q,setQ]=useState(""),[loading,setLoading]=useState(true),[error,setError]=useState("");
 async function load(){
  setLoading(true);setError("");
  const responses=await Promise.all([fetch('/api/admin/stats'),fetch('/api/admin/users?q='+encodeURIComponent(q)),fetch('/api/admin/audit'),fetch('/api/admin/security'),fetch('/api/admin/community/reports'),fetch('/api/admin/verifications'),fetch('/api/admin/finance')]);
  const data=await Promise.all(responses.map(r=>r.json().catch(()=>({})))); const [a,b,c,d,e,f,g]=data;
  if(responses.some(r=>!r.ok)) setError(a.error||b.error||c.error||d.error||e.error||f.error||g.error||'Could not load admin data');
  else {setStats(a);setUsers(b.users||[]);setLogs(c.logs||[]);setSecurityEvents(d.events||[]);setReports(e.reports||[]);setVerifications(f.verifications||[]);setFinance(g)}
  setLoading(false);
 }
 useEffect(()=>{void load()},[]);
 async function act(userId:string,action:string,role?:string){const res=await fetch('/api/admin/users',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId,action,role})});const data=await res.json().catch(()=>({}));if(!res.ok){setError(data.error||'Action failed');return}void load()}
 async function resolveReport(id:string){const res=await fetch('/api/admin/community/reports',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,status:'resolved'})});const data=await res.json().catch(()=>({}));if(!res.ok)setError(data.error||'Could not resolve report');else void load()}
 return <div className="mt-9 space-y-7">
  {error&&<div className="rounded-xl border border-rust-500/25 bg-rust-500/10 p-4 text-sm text-rust-400">{error}</div>}

  <div className="grid sm:grid-cols-2 lg:grid-cols-7 gap-3">{[['Users',stats?.total],['Active',stats?.active],['Pending',stats?.pending],['Suspended',stats?.suspended],['Students',stats?.students],['Lecturers',stats?.lecturers],['Admin actions',stats?.audit]].map(([l,v])=><StatCard key={String(l)} label={String(l)} value={v!=null?String(v):'—'} />)}</div>

  <Card>
    <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between mb-4">
      <div><h2 className="font-semibold text-lg">User management</h2><p className="text-sm text-[#8a8578] mt-1">Suspend accounts, restore access and assign institution roles.</p></div>
      <div className="flex gap-2"><input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')void load()}} placeholder="Search name or email" className="rounded-lg bg-black/20 border border-white/10 px-3 py-2 text-sm min-w-0"/><button onClick={()=>void load()} className="rounded-lg border border-white/10 px-4 py-2 text-sm hover:bg-white/5">Search</button></div>
    </div>
    <div className="overflow-x-auto -mx-5"><table className="w-full text-sm"><thead className="text-[#6b6759]"><tr><th className="text-left px-5 py-3">User</th><th className="text-left px-5 py-3">Role</th><th className="text-left px-5 py-3">Status</th><th className="text-left px-5 py-3">Verification</th><th className="text-right px-5 py-3">Access</th></tr></thead><tbody>{loading?<tr><td colSpan={5} className="p-8 text-center text-[#6b6759]">Loading admin data…</td></tr>:users.map(u=><tr key={u.id} className="border-t border-white/5"><td className="px-5 py-3"><div className="font-medium">{u.name||'Unnamed user'}</div><div className="text-[#6b6759] text-xs">{u.email}</div></td><td className="px-5 py-3"><select value={u.role||'student'} onChange={e=>void act(u.id,'setRole',e.target.value)} className="bg-black/30 border border-white/10 rounded-lg px-2 py-1"><option value="student">student</option><option value="teacher">teacher</option><option value="lecturer">lecturer</option><option value="business">business</option><option value="doctor">doctor</option><option value="gym">gym</option><option value="admin">admin</option></select></td><td className="px-5 py-3"><Badge tone={u.accountStatus==='active'?'success':u.accountStatus==='suspended'?'danger':'warning'}>{u.accountStatus}</Badge></td><td className="px-5 py-3"><Badge tone={u.emailVerificationCompletedAt?'success':'neutral'}>{u.emailVerificationCompletedAt?'Verified':'Pending'}</Badge></td><td className="px-5 py-3 text-right">{u.accountStatus==='suspended'?<button onClick={()=>void act(u.id,'activate')} className="text-acacia-300 hover:underline">Activate</button>:<button onClick={()=>void act(u.id,'suspend')} className="text-rust-400 hover:underline">Suspend</button>}</td></tr>)}</tbody></table></div>
  </Card>

  <Card>
    <SectionHeader eyebrow="Identity checks" title="School ID verification queue" />
    <p className="text-sm text-[#8a8578] -mt-3 mb-4">Approve or reject student verification. The uploaded ID is deleted after the decision.</p>
    <div className="divide-y divide-white/5 -mx-5">{verifications.map(v=><div key={v.id} className="px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"><div><div className="font-medium">{v.user.name||'Unnamed student'}</div><div className="text-xs text-[#8a8578] mt-1">{v.user.email} · submitted {new Date(v.submittedAt).toLocaleString()}</div><a href={`/api/admin/verifications/${v.id}/document`} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-acacia-300 hover:underline">Open private ID for review</a></div><div className="flex gap-2"><button onClick={()=>void (async()=>{const r=await fetch('/api/admin/verifications',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:v.id,action:'approve'})});const d=await r.json();if(!r.ok)setError(d.error||'Approval failed');else void load()})()} className="rounded-lg bg-acacia-500 px-3 py-2 text-xs font-semibold text-[#f4efe4] hover:bg-acacia-600">Approve</button><button onClick={()=>void (async()=>{const reason=prompt('Reason for rejection?')||'';if(!reason)return;const r=await fetch('/api/admin/verifications',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:v.id,action:'reject',reason})});const d=await r.json();if(!r.ok)setError(d.error||'Rejection failed');else void load()})()} className="rounded-lg border border-rust-500/25 px-3 py-2 text-xs text-rust-400 hover:bg-rust-500/10">Reject</button></div></div>)}{!verifications.length&&<EmptyState title="No pending school ID reviews." className="mx-5 mb-1" />}</div>
  </Card>

  <Card>
    <SectionHeader eyebrow="Trust and safety" title="Community safety queue" />
    <p className="text-sm text-[#8a8578] -mt-3 mb-4">Open reports from study rooms and student networking.</p>
    <div className="divide-y divide-white/5 -mx-5">{reports.map(r=><div key={r.id} className="px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"><div><div className="font-medium">{r.reason}</div><div className="text-xs text-[#8a8578] mt-1">Reported: {r.reported.name||r.reported.email} · By: {r.reporter.name||r.reporter.email}</div>{r.details&&<div className="text-sm text-[#c9c4b4] mt-2">{r.details}</div>}</div><button onClick={()=>void resolveReport(r.id)} className="rounded-lg border border-white/10 px-3 py-2 text-xs hover:bg-white/5">Resolve</button></div>)}{!reports.length&&<EmptyState title="No open community reports." className="mx-5 mb-1" />}</div>
  </Card>

  <Card>
    <SectionHeader eyebrow="Revenue" title="Finance & subscriptions" />
    <p className="text-sm text-[#8a8578] -mt-3 mb-4">Gross paid, pending payments and active Pro accounts across connected providers.</p>
    <div className="grid gap-3 sm:grid-cols-4 mb-5">
      <StatCard label="Gross paid" value={`KSh ${finance?.grossPaidKsh ?? '—'}`} />
      <StatCard label="Pending" value={`KSh ${finance?.pendingKsh ?? '—'}`} />
      <StatCard label="Failed" value={`KSh ${finance?.failedKsh ?? '—'}`} />
      <StatCard label="Active Pro" value={String(finance?.activePro ?? '—')} />
    </div>
    <p className="mini-label mb-2">Recent transactions</p>
    <div className="divide-y divide-white/5 -mx-5">{finance?.recent?.length ? finance.recent.map(t=><div key={t.id} className="px-5 py-3 flex items-center justify-between gap-3 text-sm"><div><div className="font-medium">{t.user.name||t.user.email}</div><div className="text-xs text-[#6b6759] mt-0.5">{t.provider} · {t.reference}</div></div><div className="flex items-center gap-3"><span style={{ fontVariantNumeric: "tabular-nums" }}>KSh {t.amountKsh}</span><Badge tone={paymentStatusTone(t.status)}>{t.status}</Badge></div></div>) : <EmptyState title="No transactions yet." className="mx-5 mb-1" />}</div>
  </Card>

  <Card>
    <SectionHeader eyebrow="Oversight" title="Admin audit log" />
    <p className="text-sm text-[#8a8578] -mt-3 mb-4">Recent changes made from the control center.</p>
    <div className="divide-y divide-white/5 -mx-5">{logs.map(l=><div key={l.id} className="px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2"><div><div className="font-medium">{l.action}</div><div className="text-xs text-[#8a8578] mt-1">Target: {l.targetUserId||'—'} · By: {l.adminUser.email}</div></div><time className="text-xs text-[#6b6759]">{new Date(l.createdAt).toLocaleString()}</time></div>)}{!logs.length&&!loading&&<EmptyState title="No admin actions recorded yet." className="mx-5 mb-1" />}</div>
  </Card>

  <Card>
    <SectionHeader eyebrow="Monitoring" title="Security activity" />
    <p className="text-sm text-[#8a8578] -mt-3 mb-4">Recent sign-in and verification signals for investigation.</p>
    <div className="divide-y divide-white/5 -mx-5">{securityEvents.slice(0,20).map(e=><div key={e.id} className="px-5 py-4 flex justify-between gap-3"><div><div className="font-medium text-sm">{e.type}</div><div className="text-xs text-[#8a8578] mt-1">User: {e.user?.email||e.userId||'—'}</div></div><time className="text-xs text-[#6b6759]">{new Date(e.createdAt).toLocaleString()}</time></div>)}{!securityEvents.length&&!loading&&<EmptyState title="No recent security events." className="mx-5 mb-1" />}</div>
  </Card>
 </div>
}
