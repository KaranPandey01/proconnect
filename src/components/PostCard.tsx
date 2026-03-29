"use client";

import { Post } from "@/types";
import { useState } from "react";
import { toggleLike } from "@/services/api";
import Link from "next/link";
import CommentSection from "./CommentSection";

export default function PostCard({ post }: { post: Post }) {
  const [liked, setLiked] = useState(post.is_liked);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [showComments, setShowComments] = useState(false);

  const handleLike = async () => {
    const prevLiked = liked;

    try {
      setLiked(!liked);
      setLikeCount((prev) => (prevLiked ? prev - 1 : prev + 1));
      await toggleLike(post.id);
    } catch (err) {
      console.error("LIKE ERROR:", err);
      setLiked(prevLiked);
      setLikeCount((prev) => (prevLiked ? prev + 1 : prev - 1));
    }
  };

  return (
    <div className="relative mb-6 group">
      {/* Glow */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>

      <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/10 active:scale-[0.98]">
        
        {/* USER */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <Link
              href={`/profile/${post.user_id}`}
              className="font-semibold text-white hover:underline"
            >
              {post.user_name.split("@")[0]}
            </Link>

            <p className="text-sm text-gray-400">@{post.user_name}</p>
          </div>

          <p className="text-xs text-gray-500">
            {new Date(post.created_at).toLocaleString()}
          </p>
        </div>

        {/* CONTENT */}
        <p className="mt-4 text-gray-300 leading-relaxed">
          {post.content}
        </p>

        {/* ACTIONS */}
        <div className="mt-5 flex items-center justify-between">
          
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition-all duration-300 ${
              liked
                ? "bg-gradient-to-r from-pink-500 to-red-500 text-white scale-110 shadow-lg shadow-pink-500/40"
                : "bg-white/10 hover:bg-white/20 text-gray-300"
            }`}
          >
            {likeCount}
          </button>

          <div className="flex gap-5 text-sm text-gray-400">
            <span
              onClick={() => setShowComments((prev) => !prev)}
              className="hover:text-white cursor-pointer transition"
            >
              {showComments ? "Hide" : "Comment"}
            </span>

            <span className="hover:text-white cursor-pointer transition">
              Share
            </span>
          </div>
        </div>

        {/* COMMENTS */}
        {showComments && <CommentSection postId={post.id} />}
      </div>
    </div>
  );
}