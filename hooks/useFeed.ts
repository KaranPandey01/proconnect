"use client"

import { useEffect, useState, useCallback } from "react"
import { getFeed } from "../services/api"
import { Post } from ".."

export const useFeed = () => {
  const [posts, setPosts] = useState<Post[]>([])
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [search, setSearch] = useState("")

  const fetchFeed = useCallback(async () => {
    const token = localStorage.getItem("token")
    if (!token || loading || !hasMore) return

    setLoading(true)

    try {
      const data: Post[] = await getFeed(page, search)

      if (!data || data.length === 0) {
        setHasMore(false)
        return
      }

      setPosts((prev) => {
        const existing = new Set(prev.map((p) => p.id))
        const filtered = data.filter((p) => !existing.has(p.id))
        return [...prev, ...filtered]
      })

      setPage((prev) => prev + 1)

    } catch (err) {
      console.error("FEED ERROR:", err)
    } finally {
      setLoading(false)
    }
  }, [page, search, loading, hasMore])

  useEffect(() => {
    setPosts([])
    setPage(0)
    setHasMore(true)
  }, [search])

  useEffect(() => {
    fetchFeed()
  }, [search])

  const addNewPost = (post: Post) => {
    setPosts((prev) => [post, ...prev])
  }

  return {
    posts,
    loading,
    hasMore,
    fetchFeed,
    addNewPost,
    setSearch,
  }
}