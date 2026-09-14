import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enforceSameOrigin } from "@/lib/request-security";
import { requireActiveVerifiedUser } from "@/lib/require-user";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest){
  const origin=enforceSameOrigin(req); if(origin)return origin;
  const gate=await requireActiveVerifiedUser(); if(!gate.ok)return gate.response; const session=gate.session;
  const guard=rateLimit(`connect:${session.user.id}`, 20, 60_000); if(!guard.allowed)return NextResponse.json({error:"Too many connection requests. Try again soon."},{status:429});
  const body=await req.json().catch(()=>null); const receiverId=typeof body?.receiverId==='string'?body.receiverId:'';
  if(!receiverId||receiverId===session.user.id)return NextResponse.json({error:"Invalid student"},{status:400});
  const blocked=await prisma.userBlock.findFirst({where:{OR:[{blockerId:session.user.id,blockedId:receiverId},{blockerId:receiverId,blockedId:session.user.id}]}}); if(blocked)return NextResponse.json({error:"Connection unavailable"},{status:403});
  const reversed=await prisma.studentConnection.findUnique({where:{requesterId_receiverId:{requesterId:receiverId,receiverId:session.user.id}}});
  if(reversed?.status==='pending') { const updated=await prisma.studentConnection.update({where:{id:reversed.id},data:{status:'accepted'}}); return NextResponse.json({connection:updated}); }
  const existing=await prisma.studentConnection.findUnique({where:{requesterId_receiverId:{requesterId:session.user.id,receiverId}}});
  if(existing)return NextResponse.json({connection:existing});
  const created=await prisma.studentConnection.create({data:{requesterId:session.user.id,receiverId,status:'pending'}}); return NextResponse.json({connection:created},{status:201});
}
export async function PATCH(req: NextRequest){
  const origin=enforceSameOrigin(req); if(origin)return origin;
  const gate=await requireActiveVerifiedUser(); if(!gate.ok)return gate.response; const session=gate.session;
  const body=await req.json().catch(()=>null); const id=typeof body?.id==='string'?body.id:''; const status=typeof body?.status==='string'?body.status:'';
  if(!id||!['accepted','declined','blocked'].includes(status))return NextResponse.json({error:"Invalid action"},{status:400});
  const conn=await prisma.studentConnection.findUnique({where:{id}}); if(!conn||conn.receiverId!==session.user.id)return NextResponse.json({error:"Forbidden"},{status:403});
  const updated=await prisma.studentConnection.update({where:{id},data:{status}}); return NextResponse.json({connection:updated});
}
