import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
export async function GET(){const gate=await requireAdmin();if(!gate.ok)return gate.response;const events=await prisma.securityEvent.findMany({orderBy:{createdAt:"desc"},take:50,select:{id:true,type:true,userId:true,user:{select:{email:true}},createdAt:true}});return NextResponse.json({events});}
