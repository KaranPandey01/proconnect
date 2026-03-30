"use client"

import { useEffect, useRef } from "react"
import { useFeed } from "../hooks/useFeed"
import PostCard from "./PostCard"
import CreatePost from "@/components/CreatePost"
import SearchBar from "@/components/SearchBar"

export default function Feed() {
  const {
    posts,
    loading,
    fetchFeed,
    addNewPost,
    setSearch,
    hasMore,
  } = useFeed()

  const observerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchFeed()
        }
      },
      { threshold: 0.5 }
    )

    if (observerRef.current) {
      observer.observe(observerRef.current)
    }

    return () => {
      if (observerRef.current) {
        observer.unobserve(observerRef.current)
      }
    }
  }, [fetchFeed, hasMore, loading])

  return (
    <div className="space-y-6 max-w-xl mx-auto mt-6">

      <SearchBar onSearch={setSearch} />

      <CreatePost onPostCreated={addNewPost} />

      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}

      <div ref={observerRef} />

      {loading && (
        <p className="text-center text-gray-500 animate-pulse">
          Loading more...
        </p>
      )}
    </div>
  )
}