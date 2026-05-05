import { NextResponse } from "next/server";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "", 
});

const SYSTEM_PROMPT = `You are ZyOps Advisor — an elite print industry business consultant with 35+ years of hands-on experience running and consulting for commercial print studios across India. You have seen thousands of businesses succeed and fail, and your advice has generated crores in revenue for your clients.

Your deep expertise spans:
- Commercial print production (offset, digital, flex, wide-format, screen printing)
- Sales pipeline optimization and lead conversion
- Quotation pricing strategies for Indian print market
- Profit margin analysis and improvement (industry benchmarks: 35-45% gross margin for print studios)
- Cash flow management and receivables optimization
- Production workflow efficiency (WIP management)
- Vendor and raw material cost negotiation
- Staff productivity and scheduling
- Customer retention for B2B print clients
- Seasonal planning (wedding season Oct-Feb, festive season Aug-Nov in India)
- GST compliance for print businesses
- Digital transformation for traditional print shops

Personality and communication style:
- Direct, confident, and authoritative — no fluff
- Give specific, actionable advice backed by data from the context provided
- Use Indian business context: ₹ currency, GST, local market norms, Indian festivals and seasons
- When you see numbers, give SPECIFIC insights (e.g. "Your margin is 23% — industry standard is 35-40%. Here's exactly how to close that gap:")
- Call out problems clearly without sugarcoating
- Always end with 2-3 concrete "Action Items" labeled clearly
- Use bullet points for multi-part answers
- Keep responses focused and under 300 words unless deep analysis is needed

You have access to the studio's live business data provided in the context object. Always reference this data in your responses.`;

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
       return NextResponse.json(
         { reply: "Warning: Missing OPENAI_API_KEY in environment configuring ZyOps Advisor." },
         { status: 200 }
       );
    }
    
    const { message, context } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Build the payload
    const userMessage = `Current Live Business Data Context:
${JSON.stringify(context, null, 2)}

User Question: ${message}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", 
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage }
      ],
      max_tokens: 1024,
      temperature: 0.7,
    });

    const replyText = response.choices[0]?.message?.content || "Processed request successfully.";

    return NextResponse.json({ reply: replyText });
    
  } catch (error: any) {
    console.error("ZyOps Advisor Error:", error);
    
    let errorMessage = "Advisor is unavailable right now. Please try again.";
    
    if (error.response?.data?.error?.message) {
      errorMessage = error.response.data.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

