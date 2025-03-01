"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Video, Bot, Loader2, Send, AlertCircle } from "lucide-react"
import Image from "next/image"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Toggle } from "@/components/ui/toggle"

interface Message {
  role: "user" | "assistant"
  content: string
}

interface Video {
  id: { videoId: string }
  snippet: {
    title: string
    thumbnails: {
      medium: {
        url: string
      }
    }
  }
}

interface APIResponse<T> {
  data?: T
  error?: string
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isVideoEnabled, setIsVideoEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [videos, setVideos] = useState<Video[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  const handleAIResponse = async (message: string): Promise<APIResponse<string>> => {
    try {
      console.log("Sending AI request...")
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      })

      const data = await response.json()
      console.log("AI response received:", data)

      if (!response.ok || data.error) {
        return { error: data.error || `Error: ${response.status}` }
      }

      return { data: data.response }
    } catch (error) {
      console.error("AI Response Error:", error)
      return { error: "Failed to communicate with AI service" }
    }
  }

  const handleVideoSearch = async (query: string): Promise<APIResponse<Video[]>> => {
    try {
      console.log("Sending video search request...")
      const response = await fetch(`/api/youtube?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      console.log("Video search response:", data)

      if (!response.ok || data.error) {
        return { error: data.error || "Failed to fetch videos" }
      }

      if (!Array.isArray(data.items)) {
        return { error: "Invalid video response format" }
      }

      return { data: data.items }
    } catch (error) {
      console.error("Video Search Error:", error)
      return { error: "Failed to fetch video results" }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const messageText = input.trim()
    if (!messageText) return

    setIsLoading(true)
    setError(null)
    setInput("")

    // Add user message immediately
    const userMessage: Message = { role: "user", content: messageText }
    setMessages((prev) => [...prev, userMessage])

    try {
      // Get AI response
      console.log("Getting AI response...")
      const aiResult = await handleAIResponse(messageText)
      if (aiResult.error) {
        throw new Error(aiResult.error)
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: aiResult.data || "I apologize, I could not generate a response.",
        },
      ])

      // Get video results if enabled
      if (isVideoEnabled) {
        console.log("Getting video results...")
        const videoResult = await handleVideoSearch(messageText)
        if (videoResult.error) {
          console.warn("Video search failed:", videoResult.error)
          // Don't throw error for video failure, just show warning
          setError("Video search failed, but chat continues to work")
          setVideos([])
        } else {
          setVideos(videoResult.data || [])
        }
      }
    } catch (err) {
      console.error("Submit Error:", err)
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred"
      setError(errorMessage)
      setVideos([])
    } finally {
      setIsLoading(false)
      scrollToBottom()
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="border-b bg-white p-4 flex justify-left items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-gray-600" />
          <h1 className="text-lg font-medium text-gray-800">I-Tube</h1>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-2xl  mx-auto">
          {/* Welcome Message */}
          {messages.length === 0 && (
            <div className="text-center py-8 space-y-4">
              <Bot className="w-12 h-12 text-gray-600 mx-auto opacity-80" />
              <h2 className="text-xl font-medium text-gray-800">Welcome to I-Tube!</h2>
              <p className="text-gray-600 max-w-md mx-auto">
                Ask me anything! Toggle the video camera icon to include relevant youtube video results with your answers.
              </p>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Chat Messages */}
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`rounded-2xl px-5 py-3 max-w-[85%] ${
                    message.role === "user"
                      ? "bg-gray-700 text-white"
                      : "bg-white shadow-sm border border-gray-200 text-gray-800"
                  }`}
                >
                  {String(message.content)}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* YouTube Results */}
          {isVideoEnabled && videos.length > 0 && (
            <div className="mt-6 space-y-4">
              <h2 className="text-sm font-medium text-gray-600">Related Videos</h2>
              <div className="grid grid-cols-1 gap-3">
                {videos.map((video) => (
                  <a
                    key={video.id.videoId}
                    href={`https://www.youtube.com/watch?v=${video.id.videoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-white transition-colors border bg-gray-50"
                  >
                    <Image
                      src={video.snippet.thumbnails.medium.url || "/placeholder.svg"}
                      alt={video.snippet.title}
                      width={120}
                      height={67}
                      className="rounded-lg object-cover"
                    />
                    <h3 className="text-sm text-gray-800 line-clamp-2 flex-1">{video.snippet.title}</h3>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t bg-white p-4">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="relative">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading}
              className="w-full pl-4 pr-24 py-6 rounded-full border border-gray-200 shadow-sm focus:ring-2 focus:ring-gray-600 focus:border-transparent bg-gray-50"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              <Toggle
                pressed={isVideoEnabled}
                onPressedChange={setIsVideoEnabled}
                className="rounded-full h-8 w-8 p-2 hover:bg-gray-100 data-[state=on]:bg-gray-200 data-[state=on]:text-gray-900"
                aria-label="Toggle video search"
              >
                <Video className="w-4 h-4" />
              </Toggle>
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !input.trim()}
                className="rounded-full w-8 h-8 bg-gray-700 hover:bg-gray-800 disabled:bg-gray-300"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Send className="w-4 h-4 text-white" />
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

