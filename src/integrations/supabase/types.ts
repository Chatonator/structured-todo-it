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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      community_decks: {
        Row: {
          color: string
          created_at: string
          created_by: string
          description: string | null
          icon: string | null
          id: string
          install_count: number | null
          is_public: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          created_by: string
          description?: string | null
          icon?: string | null
          id?: string
          install_count?: number | null
          is_public?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          created_by?: string
          description?: string | null
          icon?: string | null
          id?: string
          install_count?: number | null
          is_public?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      community_habits: {
        Row: {
          color: string | null
          community_deck_id: string
          created_at: string
          description: string | null
          frequency: string
          icon: string | null
          id: string
          name: string
          order: number
          target_days: number[] | null
          times_per_week: number | null
        }
        Insert: {
          color?: string | null
          community_deck_id: string
          created_at?: string
          description?: string | null
          frequency?: string
          icon?: string | null
          id?: string
          name: string
          order?: number
          target_days?: number[] | null
          times_per_week?: number | null
        }
        Update: {
          color?: string | null
          community_deck_id?: string
          created_at?: string
          description?: string | null
          frequency?: string
          icon?: string | null
          id?: string
          name?: string
          order?: number
          target_days?: number[] | null
          times_per_week?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "community_habits_community_deck_id_fkey"
            columns: ["community_deck_id"]
            isOneToOne: false
            referencedRelation: "community_decks"
            referencedColumns: ["id"]
          },
        ]
      }
      decks: {
        Row: {
          color: string
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_default: boolean | null
          name: string
          order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      habit_completions: {
        Row: {
          completed_at: string
          date: string
          habit_id: string
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string
          date: string
          habit_id: string
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string
          date?: string
          habit_id?: string
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_completions_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          color: string | null
          created_at: string
          deck_id: string
          description: string | null
          frequency: string
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          order: number
          target_days: number[] | null
          times_per_week: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          deck_id: string
          description?: string | null
          frequency?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          order?: number
          target_days?: number[] | null
          times_per_week?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          deck_id?: string
          description?: string | null
          frequency?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          order?: number
          target_days?: number[] | null
          times_per_week?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habits_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
        ]
      }
      pinned_tasks: {
        Row: {
          created_at: string
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          task_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          category: string
          context: string
          created_at: string
          duration: number | null
          estimatedTime: number
          id: string
          isCompleted: boolean
          isExpanded: boolean
          isRecurring: boolean | null
          lastCompletedAt: string | null
          level: number
          name: string
          parentId: string | null
          recurrenceInterval: string | null
          scheduledDate: string | null
          scheduledTime: string | null
          startTime: string | null
          subCategory: string | null
          user_id: string | null
        }
        Insert: {
          category: string
          context: string
          created_at?: string
          duration?: number | null
          estimatedTime: number
          id?: string
          isCompleted?: boolean
          isExpanded?: boolean
          isRecurring?: boolean | null
          lastCompletedAt?: string | null
          level?: number
          name: string
          parentId?: string | null
          recurrenceInterval?: string | null
          scheduledDate?: string | null
          scheduledTime?: string | null
          startTime?: string | null
          subCategory?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string
          context?: string
          created_at?: string
          duration?: number | null
          estimatedTime?: number
          id?: string
          isCompleted?: boolean
          isExpanded?: boolean
          isRecurring?: boolean | null
          lastCompletedAt?: string | null
          level?: number
          name?: string
          parentId?: string | null
          recurrenceInterval?: string | null
          scheduledDate?: string | null
          scheduledTime?: string | null
          startTime?: string | null
          subCategory?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      team_members: {
        Row: {
          id: string
          joined_at: string
          role: Database["public"]["Enums"]["team_role"]
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["team_role"]
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["team_role"]
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_tasks: {
        Row: {
          assigned_to: string | null
          category: string
          context: string
          created_at: string
          created_by: string
          duration: number | null
          estimatedtime: number
          id: string
          iscompleted: boolean
          isexpanded: boolean
          isrecurring: boolean | null
          lastcompletedat: string | null
          level: number
          name: string
          parentid: string | null
          recurrenceinterval: string | null
          scheduleddate: string | null
          scheduledtime: string | null
          starttime: string | null
          subcategory: string | null
          team_id: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category: string
          context: string
          created_at?: string
          created_by: string
          duration?: number | null
          estimatedtime: number
          id?: string
          iscompleted?: boolean
          isexpanded?: boolean
          isrecurring?: boolean | null
          lastcompletedat?: string | null
          level?: number
          name: string
          parentid?: string | null
          recurrenceinterval?: string | null
          scheduleddate?: string | null
          scheduledtime?: string | null
          starttime?: string | null
          subcategory?: string | null
          team_id: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          context?: string
          created_at?: string
          created_by?: string
          duration?: number | null
          estimatedtime?: number
          id?: string
          iscompleted?: boolean
          isexpanded?: boolean
          isrecurring?: boolean | null
          lastcompletedat?: string | null
          level?: number
          name?: string
          parentid?: string | null
          recurrenceinterval?: string | null
          scheduleddate?: string | null
          scheduledtime?: string | null
          starttime?: string | null
          subcategory?: string | null
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_tasks_parentid_fkey"
            columns: ["parentid"]
            isOneToOne: false
            referencedRelation: "team_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_tasks_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          created_by: string
          id: string
          invite_code: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          invite_code: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          invite_code?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_team_role: {
        Args: {
          _role: Database["public"]["Enums"]["team_role"]
          _team_id: string
          _user_id: string
        }
        Returns: boolean
      }
      is_team_admin: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      is_team_member: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      team_role: "owner" | "admin" | "member"
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
    Enums: {
      team_role: ["owner", "admin", "member"],
    },
  },
} as const
