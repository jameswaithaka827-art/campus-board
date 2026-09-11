import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireActiveVerifiedUser } from "@/lib/require-user";
export async function GET(){
 const gate=await requireActiveVerifiedUser(); if(!gate.ok)return gate.response;
 const s=gate.session;
 const rows=await prisma.studentConnection.findMany({where:{OR:[{requesterId:s.user.id},{receiverId:s.user.id}]},include:{requester:{select:{id:true,name:true,avatarUrl:true}},receiver:{select:{id:true,name:true,avatarUrl:true}}},orderBy:{updatedAt:'desc'},take:100});
 const map=(x:any)=>({...x,other:x.requesterId===s.user.id?x.receiver:x.requester});
 type Row = { status: string; receiverId: string; requesterId: string };
 return NextResponse.json({connections:rows.filter((x:Row)=>x.status==='accepted').map(map), incoming:rows.filter((x:Row)=>x.status==='pending'&&x.receiverId===s.user.id).map(map), outgoing:rows.filter((x:Row)=>x.status==='pending'&&x.requesterId===s.user.id).map(map)});
}
