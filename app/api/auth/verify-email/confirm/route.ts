import { assertSameOrigin } from "@/lib/request-security";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { verifyEmailCode } from "@/lib/email-verification";
export async function POST(req:NextRequest){
  const origin=assertSameOrigin(req); if(!origin.ok)return NextResponse.json({error:origin.reason},{status:403});
  const session=await getServerSession(authOptions); if(!session?.user?.id)return NextResponse.json({error:"Unauthorized"},{status:401});
  const body=await req.json().catch(()=>({})); const result=await verifyEmailCode(session.user.id,typeof body.code==='string'?body.code:'');
  if(result.ok)return NextResponse.json({ok:true});
  const status=result.reason==='locked'?429:result.reason==='expired'?410:400;
  return NextResponse.json({error:result.reason==='locked'?"Too many attempts. Request a new code.":result.reason==='expired'?"That code has expired. Request a new one.":"Invalid verification code."},{status});
}
