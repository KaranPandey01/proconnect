"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signupUser } from "@/services/api"

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const router = useRouter()

  const handleSignup = async () => {
    if (!email || !password) {
      alert("Enter email and password")
      return
    }

    if (loading) return

    setLoading(true)

    try {
      // 🔥 CRITICAL FIX: clear old token
      localStorage.removeItem("token")

      await signupUser(email, password)

      alert("Signup successful! Now login.")
      router.push("/login")

    } catch (err: any) {
      console.error("SIGNUP ERROR:", err)
      alert(err.message || "Signup failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">

      <h1 className="text-2xl mb-4">Signup</h1>

      <input
        type="email"
        name="username"
        autoComplete="username"
        placeholder="Email"
        className="mb-2 p-2 rounded bg-gray-800 w-64"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        name="password"
        autoComplete="new-password"
        placeholder="Password"
        className="mb-4 p-2 rounded bg-gray-800 w-64"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        onClick={handleSignup}
        disabled={loading}
        className="bg-green-600 px-4 py-2 rounded w-64 disabled:opacity-50"
      >
        {loading ? "Signing up..." : "Signup"}
      </button>

    </div>
  )
}