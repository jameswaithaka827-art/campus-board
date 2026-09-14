import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import VerificationClient from "./verification-client";
export default async function VerificationPage(){const s=await getServerSession(authOptions);if(!s?.user?.id)redirect('/login');return <VerificationClient/>}
