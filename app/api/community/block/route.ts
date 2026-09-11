import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enforceSameOrigin } from "@/lib/request-security";
import { requireActiveVerifiedUser } from "@/lib/require-user";
export async function POST(req: NextRequest){
 const origin=enforceSameOrigin(req); if(origin)return origin; const gate=await requireActiveVerifiedUser(); if(!gate.ok)return gate.response; const session=gate.session;
 const body=await req.json().catch(()=>null); const blockedId=typeof body?.blockedId==='string'?body.blockedId:''; if(!blockedId||blockedId===session.user.id)return NextResponse.json({error:'Invalid student.'},{status:400});
 const target=await prisma.user.findUnique({where:{id:blockedId},select:{id:true}}); if(!target)return NextResponse.json({error:'Student not found.'},{status:404});
 await prisma.userBlock.upsert({where:{blockerId_blockedId:{blockerId:session.user.id,blockedId}},update:{},create:{blockerId:session.user.id,blockedId}});
 await prisma.studentConnection.deleteMany({where:{OR:[{requesterId:session.user.id,receiverId:blockedId},{requesterId:blockedId,receiverId:session.user.id}]}});
 return NextResponse.json({ok:true});
}
