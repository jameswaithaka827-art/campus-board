import { assertSameOrigin } from "@/lib/request-security";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { issueEmailVerificationCode } from "@/lib/email-verification";
export async function POST(req: NextRequest){
  const origin=assertSameOrigin(req); if(!origin.ok)return NextResponse.json({error:origin.reason},{status:403});
  const session=await getServerSession(authOptions); if(!session?.user?.id)return NextResponse.json({error:"Unauthorized"},{status:401});
  const user=await prisma.user.findUnique({where:{id:session.user.id},select:{email:true,emailVerificationCompletedAt:true}}); if(!user)return NextResponse.json({error:"Account not found"},{status:404});
  if(user.emailVerificationCompletedAt)return NextResponse.json({ok:true,alreadyVerified:true});
  let result;
  try {
    result = await issueEmailVerificationCode(session.user.id,user.email);
  } catch (err) {
    console.error("Failed to send verification email:", err);
    return NextResponse.json({error:"Could not send the verification email. Check SMTP settings."},{status:500});
  }
  if(result.cooldown)return NextResponse.json({error:"A code was already sent recently. Please wait before requesting another."},{status:429});
  return NextResponse.json({ok:true});
}
