"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { loginUser } from "@/services/api"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const router = useRouter()

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Enter email and password")
      return
    }

    setLoading(true)

    try {
      await loginUser(email, password)

      router.push("/")
      router.refresh()
    } catch (err: any) {
      console.error(err)
      alert(err.message || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-white">

      <h1 className="text-2xl mb-6 font-bold">Login</h1>

      <input
        type="email"
        placeholder="Email"
        className="mb-3 p-2 rounded bg-gray-800 w-64"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        className="mb-4 p-2 rounded bg-gray-800 w-64"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        onClick={handleLogin}
        disabled={loading}
        className="bg-blue-600 px-4 py-2 rounded w-64"
      >
        {loading ? "Logging in..." : "Login"}
      </button>

    </div>
  )
}