const BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

// ---------------- REQUEST WRAPPER ----------------
const makeRequest = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("token")

  const isAuthRoute =
    url.includes("/login") || url.includes("/signup")

  //  BLOCK ONLY PROTECTED ROUTES
  if (!token && !isAuthRoute) {
    throw new Error("No auth token")
  }

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })

  console.log("API CALL:", url, "STATUS:", res.status)

  let data: any = null
  try {
    data = await res.json()
  } catch {
    data = null
  }

  //  HANDLE 401 CLEANLY
  if (res.status === 401) {
    localStorage.removeItem("token")

    if (typeof window !== "undefined") {
      window.location.href = "/login"
    }

    throw new Error("Unauthorized")
  }

  if (!res.ok) {
    console.error("API ERROR:", data)
    throw new Error(data?.detail || "Request failed")
  }

  return data
}

// ---------------- LOGIN ----------------
export const loginUser = async (email: string, password: string) => {
  const formData = new URLSearchParams()
  formData.append("username", email)
  formData.append("password", password)

  const res = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData,
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data?.detail || "Login failed")
  }

  localStorage.setItem("token", data.access_token)

  return data
}

// ---------------- SIGNUP ----------------
export const signupUser = async (email: string, password: string) => {
  return makeRequest(`${BASE_URL}/signup`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
}

// ---------------- FEED (UPDATED WITH SEARCH) ----------------
export const getFeed = async (page = 0, search = "") => {
  const limit = 20
  const offset = page * limit

  return makeRequest(
    `${BASE_URL}/feed?limit=${limit}&offset=${offset}&search=${encodeURIComponent(search)}`
  )
}

// ---------------- POST ----------------
export const createPost = async (content: string) => {
  return makeRequest(`${BASE_URL}/posts`, {
    method: "POST",
    body: JSON.stringify({ content }),
  })
}

// ---------------- LIKE ----------------
export const toggleLike = async (postId: number) => {
  return makeRequest(`${BASE_URL}/like/${postId}`, {
    method: "POST",
  })
}

// ---------------- COMMENTS ----------------
export const getComments = async (postId: number) => {
  return makeRequest(`${BASE_URL}/comments/${postId}`)
}

export const createComment = async (postId: number, content: string) => {
  return makeRequest(`${BASE_URL}/comments/${postId}`, {
    method: "POST",
    body: JSON.stringify({ content }),
  })
}

// ---------------- PROFILE ----------------
export const getUserPosts = async (userId: number) => {
  return makeRequest(`${BASE_URL}/feed/posts/user/${userId}`)
}