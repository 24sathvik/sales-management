import { NextResponse } from "next/server";
import { fetchAIContext } from "@/lib/actions/ai-context";

export async function GET() {
  const context = await fetchAIContext();
  return NextResponse.json(context);
}
