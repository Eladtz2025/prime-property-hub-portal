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
      activity_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      bulk_sends: {
        Row: {
          completed_at: string | null
          created_at: string | null
          failed_sends: number | null
          id: string
          message: string
          recipient_count: number
          recipient_phones: string[]
          sent_by: string
          successful_sends: number | null
          template_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          failed_sends?: number | null
          id?: string
          message: string
          recipient_count: number
          recipient_phones: string[]
          sent_by: string
          successful_sends?: number | null
          template_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          failed_sends?: number | null
          id?: string
          message?: string
          recipient_count?: number
          recipient_phones?: string[]
          sent_by?: string
          successful_sends?: number | null
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bulk_sends_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "message_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_records: {
        Row: {
          amount: number
          category: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          property_id: string
          receipt_url: string | null
          transaction_date: string
          type: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          property_id: string
          receipt_url?: string | null
          transaction_date: string
          type: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          property_id?: string
          receipt_url?: string | null
          transaction_date?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_records_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_records_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      message_templates: {
        Row: {
          category: string
          content: string
          created_at: string
          created_by: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          created_by: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          is_read: boolean
          message: string
          priority: string
          property_id: string | null
          recipient_id: string
          title: string
          type: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          priority?: string
          property_id?: string | null
          recipient_id: string
          title: string
          type: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          priority?: string
          property_id?: string | null
          recipient_id?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          action: string
          created_at: string
          id: string
          resource: string
          role: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          resource: string
          role: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          resource?: string
          role?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_approved: boolean
          last_login: string | null
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          is_approved?: boolean
          last_login?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_approved?: boolean
          last_login?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          acquisition_cost: number | null
          address: string
          city: string
          contact_attempts: number
          contact_notes: string | null
          contact_status: string
          created_at: string
          current_market_value: number | null
          floor: number | null
          id: string
          last_contact_date: string | null
          notes: string | null
          property_size: number | null
          renovation_costs: number | null
          rooms: number | null
          status: string
          updated_at: string
        }
        Insert: {
          acquisition_cost?: number | null
          address: string
          city: string
          contact_attempts?: number
          contact_notes?: string | null
          contact_status?: string
          created_at?: string
          current_market_value?: number | null
          floor?: number | null
          id?: string
          last_contact_date?: string | null
          notes?: string | null
          property_size?: number | null
          renovation_costs?: number | null
          rooms?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          acquisition_cost?: number | null
          address?: string
          city?: string
          contact_attempts?: number
          contact_notes?: string | null
          contact_status?: string
          created_at?: string
          current_market_value?: number | null
          floor?: number | null
          id?: string
          last_contact_date?: string | null
          notes?: string | null
          property_size?: number | null
          renovation_costs?: number | null
          rooms?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      property_documents: {
        Row: {
          file_size: number | null
          file_url: string
          id: string
          mime_type: string | null
          name: string
          property_id: string
          type: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          file_size?: number | null
          file_url: string
          id?: string
          mime_type?: string | null
          name: string
          property_id: string
          type: string
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          file_size?: number | null
          file_url?: string
          id?: string
          mime_type?: string | null
          name?: string
          property_id?: string
          type?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_documents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      property_invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invitation_token: string
          invited_by: string
          property_ids: string[]
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invitation_token: string
          invited_by: string
          property_ids: string[]
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invitation_token?: string
          invited_by?: string
          property_ids?: string[]
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      property_owners: {
        Row: {
          created_at: string
          id: string
          owner_id: string
          ownership_percentage: number | null
          property_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          owner_id: string
          ownership_percentage?: number | null
          property_id: string
        }
        Update: {
          created_at?: string
          id?: string
          owner_id?: string
          ownership_percentage?: number | null
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_owners_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_owners_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      rent_payments: {
        Row: {
          amount: number
          created_at: string
          created_by: string
          due_date: string
          id: string
          notes: string | null
          payment_date: string
          payment_method: string | null
          property_id: string
          receipt_url: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by: string
          due_date: string
          id?: string
          notes?: string | null
          payment_date: string
          payment_method?: string | null
          property_id: string
          receipt_url?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string
          due_date?: string
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          property_id?: string
          receipt_url?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rent_payments_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rent_payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_communications: {
        Row: {
          communication_type: string
          created_at: string
          id: string
          is_read: boolean
          message: string
          property_id: string
          sender_id: string
          subject: string | null
          tenant_id: string
        }
        Insert: {
          communication_type?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          property_id: string
          sender_id: string
          subject?: string | null
          tenant_id: string
        }
        Update: {
          communication_type?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          property_id?: string
          sender_id?: string
          subject?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_communications_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_communications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          deposit_amount: number | null
          email: string | null
          id: string
          is_active: boolean
          lease_end_date: string | null
          lease_start_date: string | null
          monthly_rent: number | null
          name: string
          phone: string | null
          property_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deposit_amount?: number | null
          email?: string | null
          id?: string
          is_active?: boolean
          lease_end_date?: string | null
          lease_start_date?: string | null
          monthly_rent?: number | null
          name: string
          phone?: string | null
          property_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deposit_amount?: number | null
          email?: string | null
          id?: string
          is_active?: boolean
          lease_end_date?: string | null
          lease_start_date?: string | null
          monthly_rent?: number | null
          name?: string
          phone?: string | null
          property_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenants_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          api_source: string | null
          chat_id: string | null
          chat_type: string | null
          contact_name: string | null
          contact_type: string | null
          created_at: string
          direction: string
          group_name: string | null
          id: string
          message: string
          message_type: string | null
          phone: string
          property_id: string | null
          sender_id: string | null
          sender_name: string | null
          status: string
          timestamp: string | null
          updated_at: string
          whatsapp_message_id: string | null
        }
        Insert: {
          api_source?: string | null
          chat_id?: string | null
          chat_type?: string | null
          contact_name?: string | null
          contact_type?: string | null
          created_at?: string
          direction?: string
          group_name?: string | null
          id?: string
          message: string
          message_type?: string | null
          phone: string
          property_id?: string | null
          sender_id?: string | null
          sender_name?: string | null
          status?: string
          timestamp?: string | null
          updated_at?: string
          whatsapp_message_id?: string | null
        }
        Update: {
          api_source?: string | null
          chat_id?: string | null
          chat_type?: string | null
          contact_name?: string | null
          contact_type?: string | null
          created_at?: string
          direction?: string
          group_name?: string | null
          id?: string
          message?: string
          message_type?: string | null
          phone?: string
          property_id?: string | null
          sender_id?: string | null
          sender_name?: string | null
          status?: string
          timestamp?: string | null
          updated_at?: string
          whatsapp_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_property_invitation: {
        Args: { invitation_token: string }
        Returns: Json
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
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
