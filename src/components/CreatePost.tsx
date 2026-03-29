"use client"

import { useState } from "react"
import { Post } from "@/types"
import { createPost } from "@/services/api"

export default function CreatePost({
  onPostCreated,
}: {
  onPostCreated: (post: Post) => void
}) {
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)

  const handleCreatePost = async () => {
  if (!content.trim()) return

  try {
    setLoading(true)

    const rawPost = await createPost(content)

    const newPost: Post = {
      id: rawPost.id,
      content: rawPost.content,
      user_id: rawPost.user_id,
      user_name: rawPost.user_name || "You",
      like_count: rawPost.like_count ?? 0,
      is_liked: rawPost.is_liked ?? false,
    }

    onPostCreated(newPost)

    setContent("")

  } catch (err: any) {
    console.error("CREATE POST ERROR:", err)
    alert(err.message || "Post failed")
  } finally {
    setLoading(false)
  }
}
  return (
    <div className="relative mb-6">
      
      {/* GLOW */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur opacity-20"></div>

      <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
        
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share something..."
          className="w-full bg-transparent text-gray-200 outline-none resize-none placeholder-gray-500"
          rows={3}
        />

        <div className="flex justify-between items-center mt-3">
          <p className="text-xs text-gray-500">
            {content.length}/280
          </p>

          <button
            onClick={handleCreatePost}
            disabled={loading}
            className="bg-gradient-to-r from-blue-500 to-purple-500 px-5 py-1.5 rounded-full text-white hover:scale-105 transition disabled:opacity-50"
          >
            {loading ? "Posting..." : "Post"}
          </button>
        </div>

      </div>
    </div>
  )
}