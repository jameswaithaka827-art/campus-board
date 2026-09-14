import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enforceSameOrigin } from "@/lib/request-security";
import { requireActiveVerifiedUser } from "@/lib/require-user";

const cleanList = (x: unknown) => Array.isArray(x) ? x.filter((v): v is string => typeof v === "string").map(v => v.trim().slice(0, 40)).filter(Boolean).slice(0, 12) : [];

export async function GET() {
  const gate = await requireActiveVerifiedUser(); if (!gate.ok) return gate.response; const session = gate.session;
  const profile = await prisma.studentProfile.findUnique({ where: { userId: session.user.id } });
  return NextResponse.json({ profile });
}
export async function PATCH(req: NextRequest) {
  const origin = enforceSameOrigin(req); if (origin) return origin;
  const gate = await requireActiveVerifiedUser(); if (!gate.ok) return gate.response; const session = gate.session;
  const body = await req.json().catch(()=>null); if (!body) return NextResponse.json({error:"Invalid JSON"},{status:400});
  const courseOfStudy = typeof body.courseOfStudy === "string" ? body.courseOfStudy.trim().slice(0,120) : "";
  if (!courseOfStudy) return NextResponse.json({error:"Course of study is required"},{status:400});
  const profile = await prisma.studentProfile.upsert({
    where:{userId:session.user.id},
    update:{courseOfStudy,yearOfStudy:typeof body.yearOfStudy==='string'?body.yearOfStudy.trim().slice(0,40):null,studyInterests:JSON.stringify(cleanList(body.studyInterests)),sports:JSON.stringify(cleanList(body.sports)),studyMode:typeof body.studyMode==='string'?body.studyMode.slice(0,20):null,bio:typeof body.bio==='string'?body.bio.trim().slice(0,300):null,matchOptIn:body.matchOptIn!==false},
    create:{userId:session.user.id,courseOfStudy,yearOfStudy:typeof body.yearOfStudy==='string'?body.yearOfStudy.trim().slice(0,40):null,studyInterests:JSON.stringify(cleanList(body.studyInterests)),sports:JSON.stringify(cleanList(body.sports)),studyMode:typeof body.studyMode==='string'?body.studyMode.slice(0,20):null,bio:typeof body.bio==='string'?body.bio.trim().slice(0,300):null,matchOptIn:body.matchOptIn!==false}
  });
  return NextResponse.json({profile});
}
