"use client"

import { useState } from "react"
import SearchBar from "./SearchBar"

export default function Navbar() {
  const [hovered, setHovered] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem("token")
    window.location.href = "/login"
  }

  return (
    <div className="sticky top-0 z-50 backdrop-blur-xl bg-black/30 border-b border-white/10 px-6 py-4 flex items-center justify-between">

      {/* LEFT: LOGO */}
      <h1
        onClick={() => (window.location.href = "/")}
        className="text-xl font-bold tracking-wide bg-gradient-to-r from-blue-400 via-purple-400 to-pink-500 bg-clip-text text-transparent cursor-pointer"
      >
        ProConnect
      </h1>

      {/* CENTER: REAL SEARCH */}
      <div className="hidden md:block w-1/3">
        <SearchBar />
      </div>

      {/* RIGHT: ACTIONS */}
      <div className="flex items-center gap-4">

        {/* PROFILE ICON */}
        <div
          onClick={() => (window.location.href = "/profile/me")}
          className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-sm font-semibold cursor-pointer hover:scale-110 transition"
        >
          U
        </div>

        {/* LOGOUT BUTTON */}
        <button
          onClick={handleLogout}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className={`px-4 py-1.5 rounded-full text-sm transition-all duration-300 ${
            hovered
              ? "bg-red-500 text-white shadow-lg shadow-red-500/40 scale-105"
              : "bg-white/10 text-gray-300 hover:bg-white/20"
          }`}
        >
          Logout
        </button>

      </div>
    </div>
  )
} 