import { NextResponse } from "next/server";
import { listNiches } from "../.././../niches/def";

export async function GET() {
  return NextResponse.json(listNiches());
}
