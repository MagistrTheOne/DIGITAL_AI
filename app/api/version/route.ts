import { sql } from "@/services/db/client";
import { NextResponse } from "next/server";

export async function GET() {
  const result = await sql`SELECT version()`;
  return NextResponse.json(result[0]);
}
