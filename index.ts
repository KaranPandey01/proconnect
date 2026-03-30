export interface Post {
  id: number
  content: string
  user_id: number
  user_name: string
  like_count: number
  is_liked: boolean
  created_at: string
}