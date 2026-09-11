
// Community photos are stored in the same dedicated PRIVATE Vercel Blob
// store as school ID documents (access:'private', GA since June 2026) —
// reads require the store's token, not just knowledge of the URL. Viewing
// still goes through the authenticated proxy at posts/[id]/image, same as
// before; this closes the gap where the raw URL (which briefly passes
// through the uploader's own browser here, and is stored in the database)
// would otherwise work for anyone who ever obtained it, with no auth check.
import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { privateBlobToken } from "@/lib/private-storage";
import { requireSchoolVerifiedUser } from "@/lib/require-user";
import { enforceSameOrigin } from "@/lib/request-security";
const MAX_FILES=5, MAX_BYTES=8*1024*1024;
export async function POST(req:NextRequest){const o=enforceSameOrigin(req);if(o)return o;const g=await requireSchoolVerifiedUser();if(!g.ok)return g.response;const form=await req.formData().catch(()=>null);const files=form?.getAll('files').filter((x):x is File=>x instanceof File)||[];if(!files.length)return NextResponse.json({error:'Choose JPG photos.'},{status:400});if(files.length>MAX_FILES)return NextResponse.json({error:`Maximum ${MAX_FILES} photos per post.`},{status:400});const urls:string[]=[];for(const f of files){if(f.type!=='image/jpeg')return NextResponse.json({error:'Community photos must be JPG/JPEG.'},{status:400});if(f.size>MAX_BYTES)return NextResponse.json({error:'Each photo must be 8 MB or smaller.'},{status:400});const blob=await put(`community/${g.user.id}/${crypto.randomUUID()}.jpg`,f,{access:'private',addRandomSuffix:false,token:privateBlobToken()});urls.push(blob.url);}return NextResponse.json({images:urls});}
