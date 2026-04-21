import { NextResponse } from "next/server";
import { generateNodesForCounty } from "@/lib/geo/node-generator";

export async function POST(req) {
  const body = await req.json();

  const nodes = generateNodesForCounty(body.county, body.niches || []);

  return NextResponse.json({ total: nodes.length, nodes });
}
