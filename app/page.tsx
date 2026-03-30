"use client"

import { useEffect, useState } from "react"
import Feed from "@/components/Feed"
import Navbar from "@/components/Navbar"

export default function Home() {
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("token")

    if (!token) {
      window.location.href = "/login"
    } else {
      setAuthorized(true)
    }
  }, [])

  if (!authorized) return null

  return (
    <div className="min-h-screen">
      
      {/* TOP NAV */}
      <Navbar />

      {/* MAIN CONTENT */}
      <div className="mt-4">
        <Feed />
      </div>

    </div>
  )
}