"use client"

import { usePathname } from "next/navigation"

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const isAuthPage =
    pathname === "/login" || pathname === "/signup"

 
  if (isAuthPage) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        {children}
      </div>
    )
  }

  
  return (
    <div className="flex max-w-7xl mx-auto">

      {/* LEFT SIDEBAR */}
      <div className="w-1/4 p-6 border-r border-white/10 backdrop-blur-xl h-screen sticky top-0">
        
        <h1 className="text-2xl font-bold tracking-wide bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          ProConnect
        </h1>

        <div className="mt-10 space-y-6 text-gray-300">
          <p className="hover:text-white cursor-pointer transition">Feed</p>
          <p className="hover:text-white cursor-pointer transition">Profile</p>
        </div>

      </div>

      {/* MAIN */}
      <div className="w-2/4 p-6">
        {children}
      </div>

      {/* RIGHT PANEL */}
      <div className="w-1/4 p-6 border-l border-white/10 hidden md:block">
        <div className="bg-white/5 backdrop-blur-lg p-4 rounded-xl border border-white/10">
          <p className="font-semibold">Trending</p>
        </div>
      </div>

    </div>
  )
}