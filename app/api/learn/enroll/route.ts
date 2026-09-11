import { assertSameOrigin } from "@/lib/request-security";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest){
  const origin=assertSameOrigin(req); if(!origin.ok)return NextResponse.json({error:origin.reason},{status:403});
  const session=await getServerSession(authOptions); if(!session?.user?.id)return NextResponse.json({error:'Unauthorized'},{status:401});
  const body=await req.json().catch(()=>({})); const courseId=typeof body.courseId==='string'?body.courseId:''; if(!courseId)return NextResponse.json({error:'courseId is required'},{status:400});
  const course=await prisma.course.findUnique({where:{id:courseId},select:{id:true,published:true}}); if(!course?.published)return NextResponse.json({error:'Course not available'},{status:404});
  const enrollment=await prisma.courseEnrollment.upsert({where:{courseId_userId:{courseId,userId:session.user.id}},update:{},create:{courseId,userId:session.user.id}}); return NextResponse.json({enrollment},{status:201});
}
