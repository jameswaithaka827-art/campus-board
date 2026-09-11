import { NextRequest, NextResponse } from "next/server";
import { assertSameOrigin } from "@/lib/request-security";
import { rateLimit } from "@/lib/rate-limit";
import { issuePasswordReset } from "@/lib/password-reset";
export async function POST(req:NextRequest){const origin=assertSameOrigin(req);if(!origin.ok)return NextResponse.json({error:origin.reason},{status:403});const body=await req.json().catch(()=>({}));const email=typeof body.email==='string'?body.email.toLowerCase().trim():'';if(!/^\S+@\S+\.\S+$/.test(email))return NextResponse.json({ok:true});const gate=rateLimit(`password-reset:${email}`,3,15*60_000);if(!gate.allowed)return NextResponse.json({error:'Too many requests. Try again later.'},{status:429});try{await issuePasswordReset(email);}catch(error){console.error(error);}return NextResponse.json({ok:true});}
