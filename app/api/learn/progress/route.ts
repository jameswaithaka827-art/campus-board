import { assertSameOrigin } from "@/lib/request-security";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest){
  const origin=assertSameOrigin(req); if(!origin.ok)return NextResponse.json({error:origin.reason},{status:403});
  const session=await getServerSession(authOptions); if(!session?.user?.id)return NextResponse.json({error:'Unauthorized'},{status:401});
  const body=await req.json().catch(()=>({})); const lessonId=typeof body.lessonId==='string'?body.lessonId:''; const completed=body.completed===true; if(!lessonId)return NextResponse.json({error:'lessonId is required'},{status:400});
  const lesson=await prisma.lesson.findUnique({where:{id:lessonId},select:{id:true,courseId:true}}); if(!lesson)return NextResponse.json({error:'Lesson not found'},{status:404});
  const enrolled=await prisma.courseEnrollment.findUnique({where:{courseId_userId:{courseId:lesson.courseId,userId:session.user.id}}}); if(!enrolled)return NextResponse.json({error:'Enroll first'},{status:403});
  const progress=await prisma.lessonProgress.upsert({where:{lessonId_userId:{lessonId,userId:session.user.id}},update:{completed},create:{lessonId,userId:session.user.id,completed}}); return NextResponse.json({progress});
}
