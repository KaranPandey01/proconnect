"use client"

import { useEffect, useState } from "react"
import { getComments, createComment } from "@/services/api"

export default function CommentSection({ postId }: { postId: number }) {
  const [comments, setComments] = useState<any[]>([])
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)

  const fetchComments = async () => {
    try {
      const data = await getComments(postId)
      setComments(Array.isArray(data) ? data : [])
    } catch (err: any) {
      console.error("FETCH COMMENTS ERROR:", err)
      setComments([])
    }
  }

  // 🔥 FIX: LOAD COMMENTS WHEN COMPONENT MOUNTS
  useEffect(() => {
    fetchComments()
  }, [postId])

  const handleComment = async () => {
    if (!content.trim()) return

    try {
      setLoading(true)

      await createComment(postId, content)

      setContent("")
      fetchComments() // refresh after posting

    } catch (err) {
      console.error("COMMENT ERROR:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-4">

      {/* COMMENTS LIST */}
      <div className="space-y-2 mb-3">
        {comments.length === 0 ? (
          <p className="text-xs text-gray-500">No comments yet</p>
        ) : (
          comments.map((c) => (
            <div
              key={c.id}
              className="bg-white/5 border border-white/10 px-3 py-2 rounded-lg text-sm text-gray-300 backdrop-blur-md"
            >
              {c.content}
            </div>
          ))
        )}
      </div>

      {/* INPUT */}
      <div className="flex gap-2">
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a comment..."
          className="flex-1 bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-blue-500 transition"
        />

        <button
          onClick={handleComment}
          disabled={loading}
          className="px-4 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:scale-105 active:scale-95 transition disabled:opacity-50"
        >
          {loading ? "..." : "Post"}
        </button>
      </div>

    </div>
  )
}