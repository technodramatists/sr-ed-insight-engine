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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      runs: {
        Row: {
          client_name: string | null
          context_pack_name: string | null
          context_pack_text: string
          context_pack_version: string | null
          created_at: string
          eval_big_picture: number | null
          eval_candidate_projects: number | null
          eval_drafting_material: number | null
          eval_iterations: number | null
          eval_notes_big_picture: string | null
          eval_notes_candidate_projects: string | null
          eval_notes_drafting_material: string | null
          eval_notes_iterations: string | null
          eval_notes_overall: string | null
          eval_notes_work_performed: string | null
          eval_work_performed: number | null
          fiscal_year: string | null
          id: string
          meeting_type: string | null
          model_used: string
          output_big_picture: Json | null
          output_candidate_projects: Json | null
          output_drafting_material: Json | null
          output_iterations: Json | null
          output_work_performed: Json | null
          prompt_name: string | null
          prompt_text: string
          prompt_version: string | null
          transcript_text: string
        }
        Insert: {
          client_name?: string | null
          context_pack_name?: string | null
          context_pack_text: string
          context_pack_version?: string | null
          created_at?: string
          eval_big_picture?: number | null
          eval_candidate_projects?: number | null
          eval_drafting_material?: number | null
          eval_iterations?: number | null
          eval_notes_big_picture?: string | null
          eval_notes_candidate_projects?: string | null
          eval_notes_drafting_material?: string | null
          eval_notes_iterations?: string | null
          eval_notes_overall?: string | null
          eval_notes_work_performed?: string | null
          eval_work_performed?: number | null
          fiscal_year?: string | null
          id?: string
          meeting_type?: string | null
          model_used: string
          output_big_picture?: Json | null
          output_candidate_projects?: Json | null
          output_drafting_material?: Json | null
          output_iterations?: Json | null
          output_work_performed?: Json | null
          prompt_name?: string | null
          prompt_text: string
          prompt_version?: string | null
          transcript_text: string
        }
        Update: {
          client_name?: string | null
          context_pack_name?: string | null
          context_pack_text?: string
          context_pack_version?: string | null
          created_at?: string
          eval_big_picture?: number | null
          eval_candidate_projects?: number | null
          eval_drafting_material?: number | null
          eval_iterations?: number | null
          eval_notes_big_picture?: string | null
          eval_notes_candidate_projects?: string | null
          eval_notes_drafting_material?: string | null
          eval_notes_iterations?: string | null
          eval_notes_overall?: string | null
          eval_notes_work_performed?: string | null
          eval_work_performed?: number | null
          fiscal_year?: string | null
          id?: string
          meeting_type?: string | null
          model_used?: string
          output_big_picture?: Json | null
          output_candidate_projects?: Json | null
          output_drafting_material?: Json | null
          output_iterations?: Json | null
          output_work_performed?: Json | null
          prompt_name?: string | null
          prompt_text?: string
          prompt_version?: string | null
          transcript_text?: string
        }
        Relationships: []
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
