import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "business professional";

  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ photos: [] });
  }

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=9&orientation=landscape`,
      { headers: { Authorization: apiKey } }
    );
    const data = await res.json();
    return NextResponse.json({ photos: data.photos ?? [] });
  } catch (error) {
    console.error("Photos search error:", error);
    return NextResponse.json({ photos: [] });
  }
}
