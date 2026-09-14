import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import FeedClient from "./feed-client";
export default async function CommunityFeedPage(){const s=await getServerSession(authOptions);if(!s?.user?.id)redirect('/login');return <FeedClient/>}
