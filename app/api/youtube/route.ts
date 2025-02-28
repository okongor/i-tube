import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")

    if (!query) {
      return NextResponse.json({ error: "Search query is required" }, { status: 400 })
    }

    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY
    if (!YOUTUBE_API_KEY) {
      console.error("YouTube API key is missing")
      return NextResponse.json({ error: "YouTube API configuration error" }, { status: 500 })
    }

    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
      query,
    )}&key=${YOUTUBE_API_KEY}&maxResults=3&type=video`

    const response = await fetch(url)
    const data = await response.json()

    if (data.error) {
      console.error("YouTube API Error:", data.error)
      return NextResponse.json(
        {
          error: "YouTube API error",
          details: data.error.message || "Unknown error",
        },
        { status: 500 },
      )
    }

    if (!Array.isArray(data.items)) {
      console.error("Unexpected YouTube API response:", data)
      return NextResponse.json({ error: "Invalid YouTube API response" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("YouTube API request failed:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch YouTube results",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

