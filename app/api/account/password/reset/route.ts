import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { assertSameOrigin } from "@/lib/request-security";
import { consumePasswordReset } from "@/lib/password-reset";
import { passwordError } from "@/lib/password-policy";
import { recordSecurityEvent } from "@/lib/security-events";
export async function POST(req:NextRequest){const origin=assertSameOrigin(req);if(!origin.ok)return NextResponse.json({error:origin.reason},{status:403});const b=await req.json().catch(()=>({}));const token=typeof b.token==='string'?b.token:'';const password=typeof b.password==='string'?b.password:'';const confirm=typeof b.confirmPassword==='string'?b.confirmPassword:'';if(!token||password!==confirm)return NextResponse.json({error:'Invalid reset request.'},{status:400});const error=passwordError(password);if(error)return NextResponse.json({error},{status:400});const hash=await bcrypt.hash(password,12);const result=await consumePasswordReset(token,hash);if(!result.ok)return NextResponse.json({error:'Reset link is invalid or expired.'},{status:400});return NextResponse.json({ok:true});}
