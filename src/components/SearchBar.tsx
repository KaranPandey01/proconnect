"use client"

import { useState } from "react"

export default function SearchBar({
  onSearch,
}: {
  onSearch?: (value: string) => void  // ✅ OPTIONAL NOW
}) {
  const [value, setValue] = useState("")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setValue(val)

    if (typeof onSearch === "function") {
      onSearch(val)
    }
  }

  return (
    <input
      type="text"
      placeholder="Search posts..."
      value={value}
      onChange={handleChange}
      className="w-full p-3 rounded bg-gray-800 text-white mb-4 outline-none focus:ring-2 focus:ring-purple-500"
    />
  )
}