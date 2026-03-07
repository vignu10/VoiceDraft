import { handleError } from "@/lib/auth-helpers";
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

// GET public journal by url_prefix
export async function GET(
  req: NextRequest,
  { params }: { params: { url_prefix: string } },
) {
  try {
    const { data: journal, error } = await supabase
      .from("journals")
      .select("*")
      .eq("url_prefix", params.url_prefix)
      .eq("is_active", true)
      .single();

    if (error || !journal) {
      return NextResponse.json({ error: "Journal not found" }, { status: 404 });
    }

    return NextResponse.json(journal);
  } catch (error) {
    return handleError(error);
  }
}
