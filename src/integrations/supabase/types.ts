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
      achievements: {
        Row: {
          category: string
          created_at: string | null
          description: string
          display_order: number | null
          icon: string | null
          id: string
          is_secret: boolean | null
          key: string
          name: string
          points_reward: number | null
          target_value: number | null
          tier: string | null
          xp_reward: number | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description: string
          display_order?: number | null
          icon?: string | null
          id?: string
          is_secret?: boolean | null
          key: string
          name: string
          points_reward?: number | null
          target_value?: number | null
          tier?: string | null
          xp_reward?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string
          display_order?: number | null
          icon?: string | null
          id?: string
          is_secret?: boolean | null
          key?: string
          name?: string
          points_reward?: number | null
          target_value?: number | null
          tier?: string | null
          xp_reward?: number | null
        }
        Relationships: []
      }
      challenges: {
        Row: {
          category: string
          created_at: string | null
          description: string
          icon: string | null
          id: string
          name: string
          points_reward: number | null
          required_level: number | null
          target_type: string
          target_value: number
          type: string
          weight: number | null
          xp_reward: number | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description: string
          icon?: string | null
          id?: string
          name: string
          points_reward?: number | null
          required_level?: number | null
          target_type: string
          target_value: number
          type: string
          weight?: number | null
          xp_reward?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string
          icon?: string | null
          id?: string
          name?: string
          points_reward?: number | null
          required_level?: number | null
          target_type?: string
          target_value?: number
          type?: string
          weight?: number | null
          xp_reward?: number | null
        }
        Relationships: []
      }
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
      items: {
        Row: {
          category: string
          context: string
          created_at: string | null
          estimatedTime: number
          id: string
          is_completed: boolean
          is_pinned: boolean
          item_type: string
          metadata: Json | null
          name: string
          order_index: number
          parent_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string
          context?: string
          created_at?: string | null
          estimatedTime?: number
          id?: string
          is_completed?: boolean
          is_pinned?: boolean
          item_type: string
          metadata?: Json | null
          name: string
          order_index?: number
          parent_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string
          context?: string
          created_at?: string | null
          estimatedTime?: number
          id?: string
          is_completed?: boolean
          is_pinned?: boolean
          item_type?: string
          metadata?: Json | null
          name?: string
          order_index?: number
          parent_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
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
      time_events: {
        Row: {
          color: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          duration: number
          ends_at: string | null
          entity_id: string
          entity_type: string
          id: string
          is_all_day: boolean | null
          priority: number | null
          recurrence: Json | null
          starts_at: string
          status: string
          timezone: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number
          ends_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          is_all_day?: boolean | null
          priority?: number | null
          recurrence?: Json | null
          starts_at: string
          status?: string
          timezone?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number
          ends_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          is_all_day?: boolean | null
          priority?: number | null
          recurrence?: Json | null
          starts_at?: string
          status?: string
          timezone?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      time_occurrences: {
        Row: {
          completed_at: string | null
          created_at: string | null
          ends_at: string
          event_id: string
          id: string
          starts_at: string
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          ends_at: string
          event_id: string
          id?: string
          starts_at: string
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          ends_at?: string
          event_id?: string
          id?: string
          starts_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_occurrences_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "time_events"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          created_at: string | null
          current_progress: number | null
          id: string
          is_unlocked: boolean | null
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          created_at?: string | null
          current_progress?: number | null
          id?: string
          is_unlocked?: boolean | null
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          created_at?: string | null
          current_progress?: number | null
          id?: string
          is_unlocked?: boolean | null
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_challenges: {
        Row: {
          assigned_date: string
          challenge_id: string
          completed_at: string | null
          created_at: string | null
          current_progress: number | null
          expires_at: string
          id: string
          is_completed: boolean | null
          user_id: string
        }
        Insert: {
          assigned_date: string
          challenge_id: string
          completed_at?: string | null
          created_at?: string | null
          current_progress?: number | null
          expires_at: string
          id?: string
          is_completed?: boolean | null
          user_id: string
        }
        Update: {
          assigned_date?: string
          challenge_id?: string
          completed_at?: string | null
          created_at?: string | null
          current_progress?: number | null
          expires_at?: string
          id?: string
          is_completed?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenges_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress: {
        Row: {
          created_at: string | null
          current_habit_streak: number | null
          current_level: number | null
          current_points: number | null
          current_task_streak: number | null
          daily_challenge_streak: number | null
          habits_completed: number | null
          id: string
          last_activity_date: string | null
          lifetime_points: number | null
          longest_habit_streak: number | null
          longest_task_streak: number | null
          tasks_completed: number | null
          total_xp: number | null
          updated_at: string | null
          user_id: string
          weekly_challenges_completed: number | null
          xp_for_next_level: number | null
        }
        Insert: {
          created_at?: string | null
          current_habit_streak?: number | null
          current_level?: number | null
          current_points?: number | null
          current_task_streak?: number | null
          daily_challenge_streak?: number | null
          habits_completed?: number | null
          id?: string
          last_activity_date?: string | null
          lifetime_points?: number | null
          longest_habit_streak?: number | null
          longest_task_streak?: number | null
          tasks_completed?: number | null
          total_xp?: number | null
          updated_at?: string | null
          user_id: string
          weekly_challenges_completed?: number | null
          xp_for_next_level?: number | null
        }
        Update: {
          created_at?: string | null
          current_habit_streak?: number | null
          current_level?: number | null
          current_points?: number | null
          current_task_streak?: number | null
          daily_challenge_streak?: number | null
          habits_completed?: number | null
          id?: string
          last_activity_date?: string | null
          lifetime_points?: number | null
          longest_habit_streak?: number | null
          longest_task_streak?: number | null
          tasks_completed?: number | null
          total_xp?: number | null
          updated_at?: string | null
          user_id?: string
          weekly_challenges_completed?: number | null
          xp_for_next_level?: number | null
        }
        Relationships: []
      }
      xp_transactions: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          points_gained: number | null
          source_id: string | null
          source_type: string
          user_id: string
          xp_gained: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          points_gained?: number | null
          source_id?: string | null
          source_type: string
          user_id: string
          xp_gained?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          points_gained?: number | null
          source_id?: string | null
          source_type?: string
          user_id?: string
          xp_gained?: number | null
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
