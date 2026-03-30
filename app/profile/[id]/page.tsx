"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Post } from "../../.."
import PostCard from "@/components/PostCard"
import { getUserPosts, getFeed } from "@/services/api"

export default function ProfilePage() {
  const params = useParams()
  const rawId = params.id as string
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [username, setUsername] = useState("")

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        let userId: number | null = null

        if (rawId === "me") {
          const feedData = await getFeed(0)

          if (feedData.length > 0) {
            userId = feedData[0].user_id
          }
        } else {
          userId = Number(rawId)
        }

        if (!userId) {
          setLoading(false)
          return
        }

        const data = await getUserPosts(userId)

        setPosts(data)

        if (data.length > 0) {
          setUsername(data[0].user_name)
        }

      } catch (err) {
        console.error("PROFILE ERROR:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [rawId])

  if (loading) {
    return (
      <div className="text-center text-gray-400 mt-10 animate-pulse">
        Loading profile...
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto mt-6">

      <div className="mb-6 p-6 bg-white/5 rounded-xl border border-white/10">
        <p className="text-xl text-white font-semibold">
          {username || "User"}
        </p>
      </div>

      {posts.length === 0 ? (
        <p className="text-center text-gray-500">No posts yet</p>
      ) : (
        posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))
      )}
    </div>
  )
}