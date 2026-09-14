import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { enforceSameOrigin } from "@/lib/request-security";
import { prisma } from "@/lib/prisma";

export async function GET(){
 const gate=await requireAdmin(); if(!gate.ok)return gate.response;
 const reports=await prisma.communityReport.findMany({where:{status:'open'},orderBy:{createdAt:'desc'},take:50,include:{reporter:{select:{email:true,name:true}},reported:{select:{email:true,name:true,id:true}}}});
 return NextResponse.json({reports});
}
export async function PATCH(req: NextRequest){
 const origin=enforceSameOrigin(req); if(origin)return origin;
 const gate=await requireAdmin(); if(!gate.ok)return gate.response;
 const body=await req.json().catch(()=>null); const id=typeof body?.id==='string'?body.id:''; const status=typeof body?.status==='string'?body.status:'';
 if(!id||!['open','reviewed','resolved'].includes(status))return NextResponse.json({error:'Invalid action'},{status:400});
 const report=await prisma.communityReport.update({where:{id},data:{status}});
 await prisma.adminAuditLog.create({data:{adminUserId:gate.user.id,action:`community_report:${status}`,targetUserId:report.reportedId,metadata:JSON.stringify({reportId:id})}});
 return NextResponse.json({report});
}
