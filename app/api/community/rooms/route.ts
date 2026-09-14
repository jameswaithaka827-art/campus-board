import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enforceSameOrigin } from "@/lib/request-security";
import { requireActiveVerifiedUser } from "@/lib/require-user";

export async function GET(req: NextRequest){
 const gate=await requireActiveVerifiedUser(); if(!gate.ok)return gate.response; const session=gate.session;
 const mine=new URL(req.url).searchParams.get("mine")==="1";
 const rooms=await prisma.communityRoom.findMany({where:mine?{isPublic:true,members:{some:{userId:session.user.id}}}:{isPublic:true},orderBy:[{isLive:'desc'},{updatedAt:'desc'}],take:50,include:{_count:{select:{members:true,messages:true}}}});
 return NextResponse.json({rooms});
}
export async function POST(req: NextRequest){
 const origin=enforceSameOrigin(req); if(origin)return origin;
 const gate=await requireActiveVerifiedUser(); if(!gate.ok)return gate.response; const session=gate.session;
 if(!['student','teacher','lecturer','admin'].includes(session.user.role||''))return NextResponse.json({error:'Only verified community members can create rooms.'},{status:403});
 const body=await req.json().catch(()=>null); const name=typeof body?.name==='string'?body.name.trim().slice(0,80):''; const topic=typeof body?.topic==='string'?body.topic.trim().slice(0,80):'';
 if(!name||!topic)return NextResponse.json({error:'Name and topic are required.'},{status:400});
 const room=await prisma.communityRoom.create({data:{name,topic,description:typeof body?.description==='string'?body.description.trim().slice(0,240):null,course:typeof body?.course==='string'?body.course.trim().slice(0,120):null,maxMembers:Math.min(100,Math.max(5,Number(body?.maxMembers)||50)),isPublic:true,isLive:true}});
 await prisma.communityRoomMember.create({data:{roomId:room.id,userId:session.user.id}}); return NextResponse.json({room},{status:201});
}
