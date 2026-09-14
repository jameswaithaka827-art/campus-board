
// School ID documents are stored in a dedicated PRIVATE Vercel Blob store
// (access:'private', GA since June 2026) — reads require the store's token,
// not just knowledge of the URL. This is a separate store/token from the
// public one used for avatars, since a store's access mode is fixed at
// creation and can't be mixed. See lib/private-storage.ts and
// BLOB_PRIVATE_READ_WRITE_TOKEN in .env.example.
import { NextRequest, NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import { privateBlobToken } from "@/lib/private-storage";
import { prisma } from "@/lib/prisma";
import { requireActiveVerifiedUser } from "@/lib/require-user";
import { enforceSameOrigin } from "@/lib/request-security";
const MAX_BYTES = 5 * 1024 * 1024;
export async function GET(){const g=await requireActiveVerifiedUser();if(!g.ok)return g.response;const v=await prisma.user.findUnique({where:{id:g.user.id},select:{schoolIdVerificationStatus:true,schoolIdSubmittedAt:true,schoolIdReviewedAt:true,schoolIdRejectionReason:true,schoolIdVerifiedAt:true}});return NextResponse.json({verification:v});}
export async function POST(req:NextRequest){const o=enforceSameOrigin(req);if(o)return o;const g=await requireActiveVerifiedUser();if(!g.ok)return g.response;const u=await prisma.user.findUnique({where:{id:g.user.id},select:{schoolIdVerificationStatus:true,schoolIdDocumentPath:true}});if(!u)return NextResponse.json({error:"Account not found"},{status:404});if(u.schoolIdVerificationStatus==='approved')return NextResponse.json({error:"Already verified"},{status:409});const form=await req.formData().catch(()=>null);const file=form?.get('file');if(!(file instanceof File))return NextResponse.json({error:'Upload a JPG school ID.'},{status:400});if(file.type!=='image/jpeg')return NextResponse.json({error:'School ID must be JPG/JPEG only.'},{status:400});if(file.size>MAX_BYTES)return NextResponse.json({error:'School ID must be 5 MB or smaller.'},{status:400});if(u.schoolIdDocumentPath){try{await del(u.schoolIdDocumentPath,{token:privateBlobToken()})}catch{}}const blob=await put(`school-id/${g.user.id}/${crypto.randomUUID()}.jpg`,file,{access:'private',addRandomSuffix:false,token:privateBlobToken()});const now=new Date();await prisma.$transaction([prisma.schoolIdVerification.updateMany({where:{userId:g.user.id,status:'pending'},data:{status:'rejected',reviewedAt:now,rejectionReason:'Superseded by newer submission.'}}),prisma.schoolIdVerification.create({data:{userId:g.user.id,documentPath:blob.url}}),prisma.user.update({where:{id:g.user.id},data:{schoolIdVerificationStatus:'pending',schoolIdDocumentPath:blob.url,schoolIdSubmittedAt:now,schoolIdReviewedAt:null,schoolIdRejectionReason:null,schoolIdVerifiedAt:null}})]);return NextResponse.json({ok:true,status:'pending',message:'School ID submitted for admin review.'});}
