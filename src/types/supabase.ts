export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: number
          email: string
          password: string
          name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          email: string
          password: string
          name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          email?: string
          password?: string
          name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      sessions: {
        Row: {
          id: number
          user_id: number
          token: string
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: number
          user_id: number
          token: string
          expires_at: string
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: number
          token?: string
          expires_at?: string
          created_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          user_id: number
          title: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: number
          title?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: number
          title?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          conversation_id: string
          role: string
          content: string
          location_context: Json | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          role: string
          content: string
          location_context?: Json | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          role?: string
          content?: string
          location_context?: Json | null
          metadata?: Json | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 