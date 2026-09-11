import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireActiveVerifiedUser } from "@/lib/require-user";
import { matchScore, parseStudentProfile, safeCommunityName } from "@/lib/community";

export async function GET() {
  const gate = await requireActiveVerifiedUser(); if (!gate.ok) return gate.response; const session = gate.session;
  const mine = await prisma.studentProfile.findUnique({ where:{userId:session.user.id}, include:{user:{select:{id:true,name:true,avatarUrl:true}}} });
  if (!mine) return NextResponse.json({matches:[], message:"Create your study profile first."});
  const blocked = await prisma.userBlock.findMany({ where:{blockerId:session.user.id}, select:{blockedId:true} });
  const reverse = await prisma.userBlock.findMany({ where:{blockedId:session.user.id}, select:{blockerId:true} });
  const excluded = new Set([session.user.id,...blocked.map((x:{blockedId:string})=>x.blockedId),...reverse.map((x:{blockerId:string})=>x.blockerId)]);
  const profiles = await prisma.studentProfile.findMany({where:{matchOptIn:true,userId:{notIn:[...excluded]}},include:{user:{select:{id:true,name:true,avatarUrl:true,accountStatus:true}}},take:80});
  const connections = await prisma.studentConnection.findMany({where:{OR:[{requesterId:session.user.id},{receiverId:session.user.id}]} });
  const known = new Set(connections.flatMap((c:{requesterId:string;receiverId:string})=>[c.requesterId,c.receiverId]));
  const matches = profiles.map((p:any)=>({id:p.userId,name:safeCommunityName(p.user.name),avatarUrl:p.user.avatarUrl,profile:parseStudentProfile(p),score:matchScore(mine,p),alreadyConnected:known.has(p.userId)})).sort((a:{score:number},b:{score:number})=>b.score-a.score).slice(0,30);
  return NextResponse.json({matches});
}
