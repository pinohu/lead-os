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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      agent_configs: {
        Row: {
          config: Json
          created_at: string | null
          id: string
          intents: Json
          is_active: boolean | null
          provider: string
          updated_at: string | null
        }
        Insert: {
          config?: Json
          created_at?: string | null
          id?: string
          intents?: Json
          is_active?: boolean | null
          provider: string
          updated_at?: string | null
        }
        Update: {
          config?: Json
          created_at?: string | null
          id?: string
          intents?: Json
          is_active?: boolean | null
          provider?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      booking_rate_limits: {
        Row: {
          attempts: number
          blocked_until: string | null
          created_at: string
          email: string | null
          id: string
          ip_address: string
          last_attempt_at: string
        }
        Insert: {
          attempts?: number
          blocked_until?: string | null
          created_at?: string
          email?: string | null
          id?: string
          ip_address: string
          last_attempt_at?: string
        }
        Update: {
          attempts?: number
          blocked_until?: string | null
          created_at?: string
          email?: string | null
          id?: string
          ip_address?: string
          last_attempt_at?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          agent_provider: string | null
          ai_booked: boolean | null
          ai_confidence: number | null
          call_duration: number | null
          call_recording_url: string | null
          call_transcript: string | null
          created_at: string
          document_type: string | null
          email: string
          id: string
          location_address: string | null
          marketing_source: string | null
          message: string | null
          name: string
          number_of_signers: number | null
          phone: string
          preferred_date: string | null
          preferred_time: string | null
          service: string
          sms_opt_in: boolean | null
          status: string
          suitedash_contact_id: string | null
          suitedash_project_id: string | null
          suitedash_synced_at: string | null
          tracking_number: string | null
          updated_at: string
          urgency: string | null
          whatsapp_number: string | null
          whatsapp_opt_in: boolean | null
        }
        Insert: {
          agent_provider?: string | null
          ai_booked?: boolean | null
          ai_confidence?: number | null
          call_duration?: number | null
          call_recording_url?: string | null
          call_transcript?: string | null
          created_at?: string
          document_type?: string | null
          email: string
          id?: string
          location_address?: string | null
          marketing_source?: string | null
          message?: string | null
          name: string
          number_of_signers?: number | null
          phone: string
          preferred_date?: string | null
          preferred_time?: string | null
          service: string
          sms_opt_in?: boolean | null
          status?: string
          suitedash_contact_id?: string | null
          suitedash_project_id?: string | null
          suitedash_synced_at?: string | null
          tracking_number?: string | null
          updated_at?: string
          urgency?: string | null
          whatsapp_number?: string | null
          whatsapp_opt_in?: boolean | null
        }
        Update: {
          agent_provider?: string | null
          ai_booked?: boolean | null
          ai_confidence?: number | null
          call_duration?: number | null
          call_recording_url?: string | null
          call_transcript?: string | null
          created_at?: string
          document_type?: string | null
          email?: string
          id?: string
          location_address?: string | null
          marketing_source?: string | null
          message?: string | null
          name?: string
          number_of_signers?: number | null
          phone?: string
          preferred_date?: string | null
          preferred_time?: string | null
          service?: string
          sms_opt_in?: boolean | null
          status?: string
          suitedash_contact_id?: string | null
          suitedash_project_id?: string | null
          suitedash_synced_at?: string | null
          tracking_number?: string | null
          updated_at?: string
          urgency?: string | null
          whatsapp_number?: string | null
          whatsapp_opt_in?: boolean | null
        }
        Relationships: []
      }
      call_events: {
        Row: {
          booking_id: string | null
          caller_number: string | null
          created_at: string | null
          duration: number | null
          event_type: string
          id: string
          metadata: Json | null
          recording_url: string | null
          tool: string
          tracking_number: string | null
          transcript: string | null
        }
        Insert: {
          booking_id?: string | null
          caller_number?: string | null
          created_at?: string | null
          duration?: number | null
          event_type: string
          id?: string
          metadata?: Json | null
          recording_url?: string | null
          tool: string
          tracking_number?: string | null
          transcript?: string | null
        }
        Update: {
          booking_id?: string | null
          caller_number?: string | null
          created_at?: string | null
          duration?: number | null
          event_type?: string
          id?: string
          metadata?: Json | null
          recording_url?: string | null
          tool?: string
          tracking_number?: string | null
          transcript?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "call_events_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      crop_applications: {
        Row: {
          activated_at: string | null
          approved_at: string | null
          contact_email: string
          contact_person: string
          contact_phone: string
          created_at: string
          current_address: string
          entity_ein: string | null
          entity_name: string
          entity_type: string
          formation_date: string | null
          id: string
          mail_forward_address: string | null
          mail_handling_preference: string
          plan_price_id: string
          scan_preferences: Json | null
          selected_plan: string
          state_of_formation: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activated_at?: string | null
          approved_at?: string | null
          contact_email: string
          contact_person: string
          contact_phone: string
          created_at?: string
          current_address: string
          entity_ein?: string | null
          entity_name: string
          entity_type: string
          formation_date?: string | null
          id?: string
          mail_forward_address?: string | null
          mail_handling_preference: string
          plan_price_id: string
          scan_preferences?: Json | null
          selected_plan: string
          state_of_formation: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activated_at?: string | null
          approved_at?: string | null
          contact_email?: string
          contact_person?: string
          contact_phone?: string
          created_at?: string
          current_address?: string
          entity_ein?: string | null
          entity_name?: string
          entity_type?: string
          formation_date?: string | null
          id?: string
          mail_forward_address?: string | null
          mail_handling_preference?: string
          plan_price_id?: string
          scan_preferences?: Json | null
          selected_plan?: string
          state_of_formation?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crop_applications_user_id_fkey_profiles"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          created_at: string
          email: string | null
          feedback: string
          id: string
          page_url: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          feedback: string
          id?: string
          page_url?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          feedback?: string
          id?: string
          page_url?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      integration_config: {
        Row: {
          active: boolean | null
          config: Json
          created_at: string | null
          id: string
          tool: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          config?: Json
          created_at?: string | null
          id?: string
          tool: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          config?: Json
          created_at?: string | null
          id?: string
          tool?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      mail_forwarding_requests: {
        Row: {
          actual_cost: number | null
          admin_notes: string | null
          approved_at: string | null
          delivered_at: string | null
          estimated_cost: number | null
          forwarding_address: string
          id: string
          mail_item_id: string | null
          notes: string | null
          requested_at: string | null
          shipped_at: string | null
          shipping_method: string
          status: string
          tracking_number: string | null
          user_id: string
        }
        Insert: {
          actual_cost?: number | null
          admin_notes?: string | null
          approved_at?: string | null
          delivered_at?: string | null
          estimated_cost?: number | null
          forwarding_address: string
          id?: string
          mail_item_id?: string | null
          notes?: string | null
          requested_at?: string | null
          shipped_at?: string | null
          shipping_method: string
          status?: string
          tracking_number?: string | null
          user_id: string
        }
        Update: {
          actual_cost?: number | null
          admin_notes?: string | null
          approved_at?: string | null
          delivered_at?: string | null
          estimated_cost?: number | null
          forwarding_address?: string
          id?: string
          mail_item_id?: string | null
          notes?: string | null
          requested_at?: string | null
          shipped_at?: string | null
          shipping_method?: string
          status?: string
          tracking_number?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mail_forwarding_requests_mail_item_id_fkey"
            columns: ["mail_item_id"]
            isOneToOne: false
            referencedRelation: "mail_items"
            referencedColumns: ["id"]
          },
        ]
      }
      mail_items: {
        Row: {
          created_at: string | null
          crop_application_id: string | null
          description: string | null
          dimensions: string | null
          forwarded_at: string | null
          id: string
          mail_type: string
          notes: string | null
          received_date: string
          scan_url: string | null
          scanned_at: string | null
          sender_address: string | null
          sender_name: string | null
          status: string
          tracking_number: string | null
          updated_at: string | null
          user_id: string
          weight_oz: number | null
        }
        Insert: {
          created_at?: string | null
          crop_application_id?: string | null
          description?: string | null
          dimensions?: string | null
          forwarded_at?: string | null
          id?: string
          mail_type: string
          notes?: string | null
          received_date?: string
          scan_url?: string | null
          scanned_at?: string | null
          sender_address?: string | null
          sender_name?: string | null
          status?: string
          tracking_number?: string | null
          updated_at?: string | null
          user_id: string
          weight_oz?: number | null
        }
        Update: {
          created_at?: string | null
          crop_application_id?: string | null
          description?: string | null
          dimensions?: string | null
          forwarded_at?: string | null
          id?: string
          mail_type?: string
          notes?: string | null
          received_date?: string
          scan_url?: string | null
          scanned_at?: string | null
          sender_address?: string | null
          sender_name?: string | null
          status?: string
          tracking_number?: string | null
          updated_at?: string | null
          user_id?: string
          weight_oz?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mail_items_crop_application_id_fkey"
            columns: ["crop_application_id"]
            isOneToOne: false
            referencedRelation: "crop_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_name: string | null
          created_at: string | null
          display_name: string | null
          id: string
          notification_preferences: Json | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string | null
          display_name?: string | null
          id: string
          notification_preferences?: Json | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          notification_preferences?: Json | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tc_clients: {
        Row: {
          business_name: string | null
          cancelled_at: string | null
          client_email: string
          client_name: string
          client_phone: string
          completed_at: string | null
          coordinator_assigned: string | null
          created_at: string
          current_phase: string | null
          id: string
          key_documents: string[] | null
          parties_involved: string[] | null
          selected_plan: string
          started_at: string | null
          status: string
          stripe_customer_id: string | null
          stripe_payment_intent_id: string | null
          target_completion_date: string | null
          transaction_description: string
          transaction_type: string
          updated_at: string
          urgency_level: string
          user_id: string | null
        }
        Insert: {
          business_name?: string | null
          cancelled_at?: string | null
          client_email: string
          client_name: string
          client_phone: string
          completed_at?: string | null
          coordinator_assigned?: string | null
          created_at?: string
          current_phase?: string | null
          id?: string
          key_documents?: string[] | null
          parties_involved?: string[] | null
          selected_plan: string
          started_at?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          target_completion_date?: string | null
          transaction_description: string
          transaction_type: string
          updated_at?: string
          urgency_level?: string
          user_id?: string | null
        }
        Update: {
          business_name?: string | null
          cancelled_at?: string | null
          client_email?: string
          client_name?: string
          client_phone?: string
          completed_at?: string | null
          coordinator_assigned?: string | null
          created_at?: string
          current_phase?: string | null
          id?: string
          key_documents?: string[] | null
          parties_involved?: string[] | null
          selected_plan?: string
          started_at?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          target_completion_date?: string | null
          transaction_description?: string
          transaction_type?: string
          updated_at?: string
          urgency_level?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verification_codes: {
        Row: {
          code: string
          created_at: string
          email: string
          expires_at: string
          id: string
          purpose: string
          used: boolean
          verified_at: string | null
        }
        Insert: {
          code: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          purpose?: string
          used?: boolean
          verified_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          purpose?: string
          used?: boolean
          verified_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      cleanup_old_verification_codes: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
