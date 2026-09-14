import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enforceSameOrigin } from "@/lib/request-security";
import { requireActiveVerifiedUser } from "@/lib/require-user";
import { rateLimit } from "@/lib/rate-limit";

async function member(roomId:string,userId:string){return prisma.communityRoomMember.findUnique({where:{roomId_userId:{roomId,userId}}});}
export async function GET(_req: NextRequest,{params}:{params:Promise<{id:string}>}){
 const gate=await requireActiveVerifiedUser(); if(!gate.ok)return gate.response; const session=gate.session; const guard=rateLimit(`roommsg:${session.user.id}`,30,60_000); if(!guard.allowed)return NextResponse.json({error:'You are sending messages too quickly.'},{status:429}); const {id}=await params;
 const room=await prisma.communityRoom.findUnique({where:{id}}); if(!room)return NextResponse.json({error:'Room not found'},{status:404});
 await prisma.communityRoomMember.upsert({where:{roomId_userId:{roomId:id,userId:session.user.id}},update:{lastSeenAt:new Date()},create:{roomId:id,userId:session.user.id}});
 const messages=await prisma.communityMessage.findMany({where:{roomId:id},orderBy:{createdAt:'desc'},take:80,include:{user:{select:{id:true,name:true,avatarUrl:true}}}});
 return NextResponse.json({room,messages:messages.reverse()});
}
export async function POST(req: NextRequest,{params}:{params:Promise<{id:string}>}){
 const origin=enforceSameOrigin(req); if(origin)return origin;
 const gate=await requireActiveVerifiedUser(); if(!gate.ok)return gate.response; const session=gate.session; const guard=rateLimit(`roommsg:${session.user.id}`,30,60_000); if(!guard.allowed)return NextResponse.json({error:'You are sending messages too quickly.'},{status:429}); const {id}=await params;
 const room=await prisma.communityRoom.findUnique({where:{id}}); if(!room)return NextResponse.json({error:'Room not found'},{status:404});
 const m=await member(id,session.user.id); if(!m)return NextResponse.json({error:'Join the room first.'},{status:403});
 const body=await req.json().catch(()=>null); const content=typeof body?.content==='string'?body.content.trim().slice(0,1000):''; if(!content)return NextResponse.json({error:'Message is empty.'},{status:400});
 const message=await prisma.communityMessage.create({data:{roomId:id,userId:session.user.id,content},include:{user:{select:{id:true,name:true,avatarUrl:true}}}});
 await prisma.communityRoomMember.update({where:{id:m.id},data:{lastSeenAt:new Date()}});
 return NextResponse.json({message},{status:201});
}
