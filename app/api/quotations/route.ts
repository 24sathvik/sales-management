import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    let query = supabaseAdmin
      .from('quotations')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (session.user.role !== "ADMIN") {
      query = query.eq('created_by', session.user.id);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    
    return NextResponse.json(
      { success: true, data },
      { headers: { "Cache-Control": "public, s-maxage=5, stale-while-revalidate=10" } }
    );
  } catch (error: any) {
    console.error("Failed to fetch quotations API:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}


export async function POST(req: Request) {
  try {
    // 1. Verify authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse payload
    const payload = await req.json();

    // 3. Generate Sequential quotation_number
    let nextNum = 1000; // Start threshold if table is empty
    const { data: latest } = await supabaseAdmin
      .from('quotations')
      .select('quotation_number')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (latest && latest.quotation_number) {
      const match = latest.quotation_number.match(/\d+/);
      if (match) {
        nextNum = parseInt(match[0], 10) + 1;
      }
    }
    const generatedQuotationNumber = `QUO-${nextNum}`;

    // 4. Insert into Supabase using Admin client (bypasses RLS limits if any exist)
    const { data, error } = await supabaseAdmin
      .from("quotations")
      .insert({
        ...payload,
        quotation_number: generatedQuotationNumber,
        created_by: session.user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase Quotations Insert Error:", error);
      throw error;
    }

    // 4. Return success
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Failed to save quotation API:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save quotation" },
      { status: 500 }
    );
  }
}
