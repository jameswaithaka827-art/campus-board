import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enforceSameOrigin } from "@/lib/request-security";
import { requireActiveVerifiedUser } from "@/lib/require-user";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest){
 const origin=enforceSameOrigin(req); if(origin)return origin;
 const gate=await requireActiveVerifiedUser(); if(!gate.ok)return gate.response;
 const session=gate.session;
 const guard=rateLimit(`report:${session.user.id}`,5,60*60_000); if(!guard.allowed)return NextResponse.json({error:'Too many reports. Try again later.'},{status:429});
 const body=await req.json().catch(()=>null);
 const reportedId=typeof body?.reportedId==='string'?body.reportedId:'';
 const postId=typeof body?.postId==='string'?body.postId:null;
 const reason=typeof body?.reason==='string'?body.reason.trim().slice(0,80):'';
 const details=typeof body?.details==='string'?body.details.trim().slice(0,500):null;
 if(!reportedId||reportedId===session.user.id||!reason)return NextResponse.json({error:'Report target and reason are required.'},{status:400});
 if(postId){const post=await prisma.communityPost.findUnique({where:{id:postId},select:{authorId:true}});if(!post||post.authorId!==reportedId)return NextResponse.json({error:'Invalid post report.'},{status:400});}
 const report=await prisma.communityReport.create({data:{reporterId:session.user.id,reportedId,postId,roomId:typeof body?.roomId==='string'?body.roomId:null,reason,details}});
 return NextResponse.json({report},{status:201});
}
