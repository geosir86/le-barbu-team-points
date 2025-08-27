export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      badge_definitions: {
        Row: {
          created_at: string
          criteria_type: string
          criteria_value: number
          description: string
          icon: string
          id: string
          is_active: boolean
          name: string
          rarity: string
        }
        Insert: {
          created_at?: string
          criteria_type: string
          criteria_value: number
          description: string
          icon: string
          id?: string
          is_active?: boolean
          name: string
          rarity?: string
        }
        Update: {
          created_at?: string
          criteria_type?: string
          criteria_value?: number
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          rarity?: string
        }
        Relationships: []
      }
      bonus_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          bonus_type: string
          bonus_value: number
          created_at: string
          employee_id: string
          id: string
          month: number
          notes: string | null
          status: string
          updated_at: string
          year: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          bonus_type: string
          bonus_value: number
          created_at?: string
          employee_id: string
          id?: string
          month: number
          notes?: string | null
          status?: string
          updated_at?: string
          year: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          bonus_type?: string
          bonus_value?: number
          created_at?: string
          employee_id?: string
          id?: string
          month?: number
          notes?: string | null
          status?: string
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      daily_revenue: {
        Row: {
          created_at: string
          date: string
          employee_id: string
          id: string
          notes: string | null
          revenue_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          employee_id: string
          id?: string
          notes?: string | null
          revenue_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          employee_id?: string
          id?: string
          notes?: string | null
          revenue_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      employee_badges: {
        Row: {
          badge_id: string
          earned_at: string
          employee_id: string
          id: string
          progress: number | null
        }
        Insert: {
          badge_id: string
          earned_at?: string
          employee_id: string
          id?: string
          progress?: number | null
        }
        Update: {
          badge_id?: string
          earned_at?: string
          employee_id?: string
          id?: string
          progress?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badge_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_events: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          employee_id: string
          event_type: string
          event_type_id: string | null
          id: string
          notes: string | null
          points: number
          transaction_type: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          employee_id: string
          event_type: string
          event_type_id?: string | null
          id?: string
          notes?: string | null
          points: number
          transaction_type?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          employee_id?: string
          event_type?: string
          event_type_id?: string | null
          id?: string
          notes?: string | null
          points?: number
          transaction_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_events_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_events_event_type_id_fkey"
            columns: ["event_type_id"]
            isOneToOne: false
            referencedRelation: "events_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_feedback: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          category: string | null
          created_at: string
          employee_id: string
          feedback_type: string
          from_employee_id: string | null
          id: string
          message: string
          rating: number | null
          status: string | null
          title: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          created_at?: string
          employee_id: string
          feedback_type?: string
          from_employee_id?: string | null
          id?: string
          message: string
          rating?: number | null
          status?: string | null
          title: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          created_at?: string
          employee_id?: string
          feedback_type?: string
          from_employee_id?: string | null
          id?: string
          message?: string
          rating?: number | null
          status?: string | null
          title?: string
        }
        Relationships: []
      }
      employee_requests: {
        Row: {
          amount: number | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          description: string | null
          employee_id: string
          event_type: string
          id: string
          notes: string | null
          points: number
          request_type: string
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          description?: string | null
          employee_id: string
          event_type: string
          id?: string
          notes?: string | null
          points: number
          request_type: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          description?: string | null
          employee_id?: string
          event_type?: string
          id?: string
          notes?: string | null
          points?: number
          request_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          bonus_revenue_type: string | null
          bonus_revenue_value: number | null
          created_at: string
          department: string | null
          email: string | null
          full_name: string
          hire_date: string | null
          id: string
          is_active: boolean
          manual_revenue_override: boolean | null
          monthly_revenue_actual: number | null
          monthly_revenue_target: number | null
          password_hash: string
          phone: string | null
          points_balance: number
          position: string | null
          store_id: string | null
          total_earned_points: number
          updated_at: string
          username: string
        }
        Insert: {
          bonus_revenue_type?: string | null
          bonus_revenue_value?: number | null
          created_at?: string
          department?: string | null
          email?: string | null
          full_name: string
          hire_date?: string | null
          id?: string
          is_active?: boolean
          manual_revenue_override?: boolean | null
          monthly_revenue_actual?: number | null
          monthly_revenue_target?: number | null
          password_hash: string
          phone?: string | null
          points_balance?: number
          position?: string | null
          store_id?: string | null
          total_earned_points?: number
          updated_at?: string
          username: string
        }
        Update: {
          bonus_revenue_type?: string | null
          bonus_revenue_value?: number | null
          created_at?: string
          department?: string | null
          email?: string | null
          full_name?: string
          hire_date?: string | null
          id?: string
          is_active?: boolean
          manual_revenue_override?: boolean | null
          monthly_revenue_actual?: number | null
          monthly_revenue_target?: number | null
          password_hash?: string
          phone?: string | null
          points_balance?: number
          position?: string | null
          store_id?: string | null
          total_earned_points?: number
          updated_at?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      events_settings: {
        Row: {
          created_at: string
          event_type: string
          id: string
          is_enabled: boolean
          name: string
          points: number
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          is_enabled?: boolean
          name: string
          points: number
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          is_enabled?: boolean
          name?: string
          points?: number
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      monthly_revenue_summary: {
        Row: {
          created_at: string
          days_count: number
          employee_id: string
          id: string
          month: number
          total_revenues: number
          updated_at: string
          weeks_count: number
          year: number
        }
        Insert: {
          created_at?: string
          days_count?: number
          employee_id: string
          id?: string
          month: number
          total_revenues?: number
          updated_at?: string
          weeks_count?: number
          year: number
        }
        Update: {
          created_at?: string
          days_count?: number
          employee_id?: string
          id?: string
          month?: number
          total_revenues?: number
          updated_at?: string
          weeks_count?: number
          year?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          created_by: string | null
          employee_id: string
          id: string
          message: string
          priority: string
          read_at: string | null
          status: string
          title: string
          type: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          created_by?: string | null
          employee_id: string
          id?: string
          message: string
          priority?: string
          read_at?: string | null
          status?: string
          title: string
          type?: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          created_by?: string | null
          employee_id?: string
          id?: string
          message?: string
          priority?: string
          read_at?: string | null
          status?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_redemptions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          decided_at: string | null
          delivered_code: string | null
          employee_id: string
          id: string
          manager_comment: string | null
          manager_id: string | null
          notes: string | null
          points_cost: number
          reward_id: string | null
          reward_name: string
          status: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          decided_at?: string | null
          delivered_code?: string | null
          employee_id: string
          id?: string
          manager_comment?: string | null
          manager_id?: string | null
          notes?: string | null
          points_cost: number
          reward_id?: string | null
          reward_name: string
          status?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          decided_at?: string | null
          delivered_code?: string | null
          employee_id?: string
          id?: string
          manager_comment?: string | null
          manager_id?: string | null
          notes?: string | null
          points_cost?: number
          reward_id?: string | null
          reward_name?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_redemptions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_redemptions_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards_catalog: {
        Row: {
          category: string
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          points_cost: number
          stock: number | null
          type: string | null
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          points_cost: number
          stock?: number | null
          type?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          points_cost?: number
          stock?: number | null
          type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      stores: {
        Row: {
          created_at: string
          id: string
          location: string | null
          monthly_goal: number | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          location?: string | null
          monthly_goal?: number | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          location?: string | null
          monthly_goal?: number | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_pins: {
        Row: {
          created_at: string
          created_by: string
          employee_id: string
          expires_at: string
          id: string
          pin_hash: string
          used: boolean
        }
        Insert: {
          created_at?: string
          created_by?: string
          employee_id: string
          expires_at: string
          id?: string
          pin_hash: string
          used?: boolean
        }
        Update: {
          created_at?: string
          created_by?: string
          employee_id?: string
          expires_at?: string
          id?: string
          pin_hash?: string
          used?: boolean
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          custom_colors: Json | null
          id: string
          theme_mode: string
          updated_at: string
          user_id: string | null
          user_type: string
        }
        Insert: {
          created_at?: string
          custom_colors?: Json | null
          id?: string
          theme_mode?: string
          updated_at?: string
          user_id?: string | null
          user_type?: string
        }
        Update: {
          created_at?: string
          custom_colors?: Json | null
          id?: string
          theme_mode?: string
          updated_at?: string
          user_id?: string | null
          user_type?: string
        }
        Relationships: []
      }
      weekly_revenue: {
        Row: {
          created_at: string
          employee_id: string
          id: string
          revenue_amount: number
          updated_at: string
          week_start_date: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          id?: string
          revenue_amount?: number
          updated_at?: string
          week_start_date: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          id?: string
          revenue_amount?: number
          updated_at?: string
          week_start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_revenue_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_reward_redemption: {
        Args: { manager_notes?: string; redemption_id: string }
        Returns: Json
      }
      get_week_start_date: {
        Args: { input_date?: string }
        Returns: string
      }
      is_manager: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      reject_reward_redemption: {
        Args: { manager_notes?: string; redemption_id: string }
        Returns: Json
      }
      set_current_employee_id: {
        Args: { employee_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
