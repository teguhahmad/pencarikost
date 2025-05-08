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
      properties: {
        Row: {
          id: string
          name: string
          address: string
          city: string
          phone: string | null
          email: string | null
          created_at: string | null
          updated_at: string | null
          owner_id: string
        }
        Insert: {
          id?: string
          name: string
          address: string
          city: string
          phone?: string | null
          email?: string | null
          created_at?: string | null
          updated_at?: string | null
          owner_id: string
        }
        Update: {
          id?: string
          name?: string
          address?: string
          city?: string
          phone?: string | null
          email?: string | null
          created_at?: string | null
          updated_at?: string | null
          owner_id?: string
        }
      }
      rooms: {
        Row: {
          id: string
          number: string
          floor: string
          type: string
          price: number
          status: string
          facilities: string[] | null
          tenant_id: string | null
          property_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          number: string
          floor: string
          type: string
          price: number
          status: string
          facilities?: string[] | null
          tenant_id?: string | null
          property_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          number?: string
          floor?: string
          type?: string
          price?: number
          status?: string
          facilities?: string[] | null
          tenant_id?: string | null
          property_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      tenants: {
        Row: {
          id: string
          name: string
          phone: string
          email: string
          room_id: string | null
          start_date: string
          end_date: string
          status: string
          payment_status: string
          property_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          phone: string
          email: string
          room_id?: string | null
          start_date: string
          end_date: string
          status: string
          payment_status: string
          property_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          phone?: string
          email?: string
          room_id?: string | null
          start_date?: string
          end_date?: string
          status?: string
          payment_status?: string
          property_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      payments: {
        Row: {
          id: string
          tenant_id: string | null
          room_id: string | null
          amount: number
          date: string | null
          due_date: string
          status: string
          payment_method: string | null
          notes: string | null
          property_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          tenant_id?: string | null
          room_id?: string | null
          amount: number
          date?: string | null
          due_date: string
          status: string
          payment_method?: string | null
          notes?: string | null
          property_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string | null
          room_id?: string | null
          amount?: number
          date?: string | null
          due_date?: string
          status?: string
          payment_method?: string | null
          notes?: string | null
          property_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      maintenance_requests: {
        Row: {
          id: string
          room_id: string | null
          tenant_id: string | null
          title: string
          description: string
          date: string
          status: string
          priority: string
          property_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          room_id?: string | null
          tenant_id?: string | null
          title: string
          description: string
          date: string
          status: string
          priority: string
          property_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          room_id?: string | null
          tenant_id?: string | null
          title?: string
          description?: string
          date?: string
          status?: string
          priority?: string
          property_id?: string | null
          created_at?: string | null
          updated_at?: string | null
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