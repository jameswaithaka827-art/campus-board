import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enforceSameOrigin } from "@/lib/request-security";
import { requireActiveVerifiedUser } from "@/lib/require-user";
export async function POST(req: NextRequest){
 const origin=enforceSameOrigin(req); if(origin)return origin; const gate=await requireActiveVerifiedUser(); if(!gate.ok)return gate.response; const session=gate.session;
 const body=await req.json().catch(()=>null); const roomId=typeof body?.roomId==='string'?body.roomId:null; if(!roomId)return NextResponse.json({error:'roomId required'},{status:400});
 const membership=await prisma.communityRoomMember.findUnique({where:{roomId_userId:{roomId,userId:session.user.id}}}); if(!membership)return NextResponse.json({error:'Not a member'},{status:403});
 await prisma.communityRoomMember.update({where:{id:membership.id},data:{lastSeenAt:new Date()}});
 const cutoff=new Date(Date.now()-90_000); const online=await prisma.communityRoomMember.count({where:{roomId,lastSeenAt:{gte:cutoff}}}); return NextResponse.json({online});
}
