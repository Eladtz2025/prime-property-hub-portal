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
          ip_address: unknown
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
          ip_address?: unknown
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
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          appointment_type: string
          assigned_to: string | null
          client_name: string
          client_phone: string | null
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          property_id: string | null
          status: string
          title: string | null
          updated_at: string
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          appointment_type?: string
          assigned_to?: string | null
          client_name: string
          client_phone?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          property_id?: string | null
          status?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          appointment_type?: string
          assigned_to?: string | null
          client_name?: string
          client_phone?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          property_id?: string | null
          status?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "user_profiles_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_check_runs: {
        Row: {
          completed_at: string | null
          error_message: string | null
          id: string
          inactive_marked: number | null
          properties_checked: number | null
          run_details: Json | null
          started_at: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          inactive_marked?: number | null
          properties_checked?: number | null
          run_details?: Json | null
          started_at?: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          inactive_marked?: number | null
          properties_checked?: number | null
          run_details?: Json | null
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      backfill_progress: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          failed_items: number | null
          id: string
          last_processed_id: string | null
          processed_items: number | null
          started_at: string | null
          status: string | null
          successful_items: number | null
          summary_data: Json | null
          task_name: string
          total_items: number | null
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          failed_items?: number | null
          id?: string
          last_processed_id?: string | null
          processed_items?: number | null
          started_at?: string | null
          status?: string | null
          successful_items?: number | null
          summary_data?: Json | null
          task_name: string
          total_items?: number | null
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          failed_items?: number | null
          id?: string
          last_processed_id?: string | null
          processed_items?: number | null
          started_at?: string | null
          status?: string | null
          successful_items?: number | null
          summary_data?: Json | null
          task_name?: string
          total_items?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_history: {
        Row: {
          backup_date: string
          created_at: string | null
          error_message: string | null
          file_name: string
          file_size_kb: number | null
          id: string
          status: string
          tables_backed_up: Json | null
        }
        Insert: {
          backup_date?: string
          created_at?: string | null
          error_message?: string | null
          file_name: string
          file_size_kb?: number | null
          id?: string
          status: string
          tables_backed_up?: Json | null
        }
        Update: {
          backup_date?: string
          created_at?: string | null
          error_message?: string | null
          file_name?: string
          file_size_kb?: number | null
          id?: string
          status?: string
          tables_backed_up?: Json | null
        }
        Relationships: []
      }
      brokerage_form_tokens: {
        Row: {
          client_filled_at: string | null
          created_at: string
          created_by: string | null
          expires_at: string
          form_data: Json
          id: string
          signed_at: string | null
          status: string
          token: string
        }
        Insert: {
          client_filled_at?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string
          form_data?: Json
          id?: string
          signed_at?: string | null
          status?: string
          token?: string
        }
        Update: {
          client_filled_at?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string
          form_data?: Json
          id?: string
          signed_at?: string | null
          status?: string
          token?: string
        }
        Relationships: []
      }
      brokerage_forms: {
        Row: {
          agent_id: string
          agent_name: string
          agent_signature: string | null
          client_id: string
          client_name: string
          client_phone: string
          client_signature: string
          created_at: string
          created_by: string | null
          fee_type_rental: boolean | null
          fee_type_sale: boolean | null
          form_date: string
          id: string
          properties: Json | null
          referred_by: string | null
          special_terms: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          agent_id: string
          agent_name: string
          agent_signature?: string | null
          client_id: string
          client_name: string
          client_phone: string
          client_signature: string
          created_at?: string
          created_by?: string | null
          fee_type_rental?: boolean | null
          fee_type_sale?: boolean | null
          form_date: string
          id?: string
          properties?: Json | null
          referred_by?: string | null
          special_terms?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          agent_id?: string
          agent_name?: string
          agent_signature?: string | null
          client_id?: string
          client_name?: string
          client_phone?: string
          client_signature?: string
          created_at?: string
          created_by?: string | null
          fee_type_rental?: boolean | null
          fee_type_sale?: boolean | null
          form_date?: string
          id?: string
          properties?: Json | null
          referred_by?: string | null
          special_terms?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      brokers: {
        Row: {
          created_at: string | null
          id: string
          interested_properties: string[] | null
          interested_properties_text: string | null
          name: string
          notes: string | null
          office_name: string | null
          phone: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          interested_properties?: string[] | null
          interested_properties_text?: string | null
          name: string
          notes?: string | null
          office_name?: string | null
          phone: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          interested_properties?: string[] | null
          interested_properties_text?: string | null
          name?: string
          notes?: string | null
          office_name?: string | null
          phone?: string
          updated_at?: string | null
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
      contact_leads: {
        Row: {
          assigned_agent_id: string | null
          balcony_flexible: boolean | null
          balcony_required: boolean | null
          budget_max: number | null
          budget_min: number | null
          cash_available: number | null
          created_at: string | null
          created_by: string | null
          elevator_flexible: boolean | null
          elevator_required: boolean | null
          eligibility_reason: string | null
          email: string | null
          flexible_move_date: boolean | null
          floor_preference: string | null
          furnished_flexible: boolean | null
          furnished_required: string | null
          id: string
          immediate_entry: boolean | null
          is_hidden: boolean | null
          last_contact_date: string | null
          lawyer_details: string | null
          mamad_flexible: boolean | null
          mamad_required: boolean | null
          matching_status: string | null
          message: string
          move_in_date: string | null
          move_out_date: string | null
          name: string
          new_or_second_hand: string | null
          next_followup_date: string | null
          notes: string | null
          outdoor_space_any: boolean | null
          parking_flexible: boolean | null
          parking_required: boolean | null
          pets: boolean | null
          pets_flexible: boolean | null
          phone: string
          phone_2: string | null
          preferred_cities: string[] | null
          preferred_neighborhoods: string[] | null
          priority: string | null
          property_id: string | null
          property_to_sell: boolean | null
          property_type: string | null
          purchase_purpose: string | null
          renovation_budget: number | null
          roof_flexible: boolean | null
          roof_required: boolean | null
          rooms_max: number | null
          rooms_min: number | null
          size_max: number | null
          size_min: number | null
          source: string | null
          status: string | null
          tenant_type: string | null
          updated_at: string | null
          urgency_level: string | null
          view_preference: string | null
          yard_flexible: boolean | null
          yard_required: boolean | null
        }
        Insert: {
          assigned_agent_id?: string | null
          balcony_flexible?: boolean | null
          balcony_required?: boolean | null
          budget_max?: number | null
          budget_min?: number | null
          cash_available?: number | null
          created_at?: string | null
          created_by?: string | null
          elevator_flexible?: boolean | null
          elevator_required?: boolean | null
          eligibility_reason?: string | null
          email?: string | null
          flexible_move_date?: boolean | null
          floor_preference?: string | null
          furnished_flexible?: boolean | null
          furnished_required?: string | null
          id?: string
          immediate_entry?: boolean | null
          is_hidden?: boolean | null
          last_contact_date?: string | null
          lawyer_details?: string | null
          mamad_flexible?: boolean | null
          mamad_required?: boolean | null
          matching_status?: string | null
          message: string
          move_in_date?: string | null
          move_out_date?: string | null
          name: string
          new_or_second_hand?: string | null
          next_followup_date?: string | null
          notes?: string | null
          outdoor_space_any?: boolean | null
          parking_flexible?: boolean | null
          parking_required?: boolean | null
          pets?: boolean | null
          pets_flexible?: boolean | null
          phone: string
          phone_2?: string | null
          preferred_cities?: string[] | null
          preferred_neighborhoods?: string[] | null
          priority?: string | null
          property_id?: string | null
          property_to_sell?: boolean | null
          property_type?: string | null
          purchase_purpose?: string | null
          renovation_budget?: number | null
          roof_flexible?: boolean | null
          roof_required?: boolean | null
          rooms_max?: number | null
          rooms_min?: number | null
          size_max?: number | null
          size_min?: number | null
          source?: string | null
          status?: string | null
          tenant_type?: string | null
          updated_at?: string | null
          urgency_level?: string | null
          view_preference?: string | null
          yard_flexible?: boolean | null
          yard_required?: boolean | null
        }
        Update: {
          assigned_agent_id?: string | null
          balcony_flexible?: boolean | null
          balcony_required?: boolean | null
          budget_max?: number | null
          budget_min?: number | null
          cash_available?: number | null
          created_at?: string | null
          created_by?: string | null
          elevator_flexible?: boolean | null
          elevator_required?: boolean | null
          eligibility_reason?: string | null
          email?: string | null
          flexible_move_date?: boolean | null
          floor_preference?: string | null
          furnished_flexible?: boolean | null
          furnished_required?: string | null
          id?: string
          immediate_entry?: boolean | null
          is_hidden?: boolean | null
          last_contact_date?: string | null
          lawyer_details?: string | null
          mamad_flexible?: boolean | null
          mamad_required?: boolean | null
          matching_status?: string | null
          message?: string
          move_in_date?: string | null
          move_out_date?: string | null
          name?: string
          new_or_second_hand?: string | null
          next_followup_date?: string | null
          notes?: string | null
          outdoor_space_any?: boolean | null
          parking_flexible?: boolean | null
          parking_required?: boolean | null
          pets?: boolean | null
          pets_flexible?: boolean | null
          phone?: string
          phone_2?: string | null
          preferred_cities?: string[] | null
          preferred_neighborhoods?: string[] | null
          priority?: string | null
          property_id?: string | null
          property_to_sell?: boolean | null
          property_type?: string | null
          purchase_purpose?: string | null
          renovation_budget?: number | null
          roof_flexible?: boolean | null
          roof_required?: boolean | null
          rooms_max?: number | null
          rooms_min?: number | null
          size_max?: number | null
          size_min?: number | null
          source?: string | null
          status?: string | null
          tenant_type?: string | null
          updated_at?: string | null
          urgency_level?: string | null
          view_preference?: string | null
          yard_flexible?: boolean | null
          yard_required?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_leads_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      debug_scrape_samples: {
        Row: {
          created_at: string | null
          html: string | null
          id: string
          markdown: string | null
          properties_found: number | null
          source: string
          updated_at: string | null
          url: string | null
        }
        Insert: {
          created_at?: string | null
          html?: string | null
          id?: string
          markdown?: string | null
          properties_found?: number | null
          source: string
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string | null
          html?: string | null
          id?: string
          markdown?: string | null
          properties_found?: number | null
          source?: string
          updated_at?: string | null
          url?: string | null
        }
        Relationships: []
      }
      development_ideas: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_completed: boolean | null
          priority: string | null
          title: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_completed?: boolean | null
          priority?: string | null
          title: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_completed?: boolean | null
          priority?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "development_ideas_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "development_ideas_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles_with_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      dismissed_matches: {
        Row: {
          dismissed_at: string | null
          dismissed_by: string | null
          id: string
          lead_id: string
          property_id: string | null
          reason: string | null
          scouted_property_id: string | null
        }
        Insert: {
          dismissed_at?: string | null
          dismissed_by?: string | null
          id?: string
          lead_id: string
          property_id?: string | null
          reason?: string | null
          scouted_property_id?: string | null
        }
        Update: {
          dismissed_at?: string | null
          dismissed_by?: string | null
          id?: string
          lead_id?: string
          property_id?: string | null
          reason?: string | null
          scouted_property_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dismissed_matches_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "contact_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dismissed_matches_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dismissed_matches_scouted_property_id_fkey"
            columns: ["scouted_property_id"]
            isOneToOne: false
            referencedRelation: "scouted_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      duplicate_alerts: {
        Row: {
          created_at: string | null
          detected_at: string | null
          duplicate_property_id: string | null
          id: string
          is_resolved: boolean | null
          notes: string | null
          price_difference: number
          price_difference_percent: number
          primary_property_id: string | null
          resolved_at: string | null
          resolved_by: string | null
        }
        Insert: {
          created_at?: string | null
          detected_at?: string | null
          duplicate_property_id?: string | null
          id?: string
          is_resolved?: boolean | null
          notes?: string | null
          price_difference: number
          price_difference_percent: number
          primary_property_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Update: {
          created_at?: string | null
          detected_at?: string | null
          duplicate_property_id?: string | null
          id?: string
          is_resolved?: boolean | null
          notes?: string | null
          price_difference?: number
          price_difference_percent?: number
          primary_property_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "duplicate_alerts_duplicate_property_id_fkey"
            columns: ["duplicate_property_id"]
            isOneToOne: false
            referencedRelation: "scouted_properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duplicate_alerts_primary_property_id_fkey"
            columns: ["primary_property_id"]
            isOneToOne: false
            referencedRelation: "scouted_properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duplicate_alerts_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duplicate_alerts_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "user_profiles_with_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      error_logs: {
        Row: {
          alert_sent: boolean | null
          created_at: string | null
          error_message: string
          error_stack: string | null
          error_time: string
          id: string
          page_url: string | null
          severity: string
          user_agent: string | null
        }
        Insert: {
          alert_sent?: boolean | null
          created_at?: string | null
          error_message: string
          error_stack?: string | null
          error_time?: string
          id?: string
          page_url?: string | null
          severity: string
          user_agent?: string | null
        }
        Update: {
          alert_sent?: boolean | null
          created_at?: string | null
          error_message?: string
          error_stack?: string | null
          error_time?: string
          id?: string
          page_url?: string | null
          severity?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      exclusive_listing_forms: {
        Row: {
          agent_id_number: string | null
          agent_license: string | null
          agent_name: string | null
          agent_phone: string | null
          agent_signature: string | null
          asking_price: string | null
          commission_includes_vat: boolean | null
          commission_percentage: string | null
          confirm_accuracy: boolean | null
          confirm_defects: boolean | null
          confirm_understanding: boolean | null
          created_at: string | null
          created_by: string | null
          defects_details: string | null
          defects_questionnaire: Json | null
          end_date: string | null
          exclusivity_months: number | null
          expires_at: string | null
          form_data: Json | null
          id: string
          language: string | null
          marketing_activities: Json | null
          marketing_other: string | null
          owner_address: string | null
          owner_email: string | null
          owner_id_number: string | null
          owner_name: string | null
          owner_phone: string | null
          owner_signature: string | null
          owner_signed_at: string | null
          property_address: string | null
          property_balcony: boolean | null
          property_elevator: boolean | null
          property_floor: string | null
          property_gush_helka: string | null
          property_parking: boolean | null
          property_rooms: string | null
          property_size_sqm: string | null
          property_storage: boolean | null
          start_date: string | null
          status: string | null
          token: string | null
          transaction_type: string | null
          updated_at: string | null
        }
        Insert: {
          agent_id_number?: string | null
          agent_license?: string | null
          agent_name?: string | null
          agent_phone?: string | null
          agent_signature?: string | null
          asking_price?: string | null
          commission_includes_vat?: boolean | null
          commission_percentage?: string | null
          confirm_accuracy?: boolean | null
          confirm_defects?: boolean | null
          confirm_understanding?: boolean | null
          created_at?: string | null
          created_by?: string | null
          defects_details?: string | null
          defects_questionnaire?: Json | null
          end_date?: string | null
          exclusivity_months?: number | null
          expires_at?: string | null
          form_data?: Json | null
          id?: string
          language?: string | null
          marketing_activities?: Json | null
          marketing_other?: string | null
          owner_address?: string | null
          owner_email?: string | null
          owner_id_number?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          owner_signature?: string | null
          owner_signed_at?: string | null
          property_address?: string | null
          property_balcony?: boolean | null
          property_elevator?: boolean | null
          property_floor?: string | null
          property_gush_helka?: string | null
          property_parking?: boolean | null
          property_rooms?: string | null
          property_size_sqm?: string | null
          property_storage?: boolean | null
          start_date?: string | null
          status?: string | null
          token?: string | null
          transaction_type?: string | null
          updated_at?: string | null
        }
        Update: {
          agent_id_number?: string | null
          agent_license?: string | null
          agent_name?: string | null
          agent_phone?: string | null
          agent_signature?: string | null
          asking_price?: string | null
          commission_includes_vat?: boolean | null
          commission_percentage?: string | null
          confirm_accuracy?: boolean | null
          confirm_defects?: boolean | null
          confirm_understanding?: boolean | null
          created_at?: string | null
          created_by?: string | null
          defects_details?: string | null
          defects_questionnaire?: Json | null
          end_date?: string | null
          exclusivity_months?: number | null
          expires_at?: string | null
          form_data?: Json | null
          id?: string
          language?: string | null
          marketing_activities?: Json | null
          marketing_other?: string | null
          owner_address?: string | null
          owner_email?: string | null
          owner_id_number?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          owner_signature?: string | null
          owner_signed_at?: string | null
          property_address?: string | null
          property_balcony?: boolean | null
          property_elevator?: boolean | null
          property_floor?: string | null
          property_gush_helka?: string | null
          property_parking?: boolean | null
          property_rooms?: string | null
          property_size_sqm?: string | null
          property_storage?: boolean | null
          start_date?: string | null
          status?: string | null
          token?: string | null
          transaction_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          expires_at: string | null
          id: string
          is_enabled: boolean | null
          name: string
          rollout_percentage: number | null
          target_users: string[] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_enabled?: boolean | null
          name: string
          rollout_percentage?: number | null
          target_users?: string[] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_enabled?: boolean | null
          name?: string
          rollout_percentage?: number | null
          target_users?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feature_flags_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feature_flags_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles_with_roles"
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
            foreignKeyName: "financial_records_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles_with_roles"
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
      lease_expiry_alerts: {
        Row: {
          created_at: string
          days_before: number
          id: string
          lease_end_date: string
          notification_sent: boolean | null
          property_id: string
          sent_at: string
          tenant_id: string
          whatsapp_sent: boolean | null
        }
        Insert: {
          created_at?: string
          days_before: number
          id?: string
          lease_end_date: string
          notification_sent?: boolean | null
          property_id: string
          sent_at?: string
          tenant_id: string
          whatsapp_sent?: boolean | null
        }
        Update: {
          created_at?: string
          days_before?: number
          id?: string
          lease_end_date?: string
          notification_sent?: boolean | null
          property_id?: string
          sent_at?: string
          tenant_id?: string
          whatsapp_sent?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "lease_expiry_alerts_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lease_expiry_alerts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_form_tokens: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string
          form_data: Json
          form_type: string
          id: string
          language: string
          legal_form_id: string | null
          signed_at: string | null
          status: string
          token: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string
          form_data?: Json
          form_type: string
          id?: string
          language?: string
          legal_form_id?: string | null
          signed_at?: string | null
          status?: string
          token?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string
          form_data?: Json
          form_type?: string
          id?: string
          language?: string
          legal_form_id?: string | null
          signed_at?: string | null
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_form_tokens_legal_form_id_fkey"
            columns: ["legal_form_id"]
            isOneToOne: false
            referencedRelation: "legal_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_forms: {
        Row: {
          agent_id_number: string | null
          agent_license: string | null
          agent_name: string | null
          agent_phone: string | null
          agent_signature: string | null
          client_address: string | null
          client_email: string | null
          client_id_number: string | null
          client_name: string | null
          client_phone: string | null
          client_signature: string | null
          contract_end_date: string | null
          contract_start_date: string | null
          created_at: string
          created_by: string | null
          deposit_amount: string | null
          entry_date: string | null
          form_data: Json | null
          form_type: string
          guarantees: string | null
          id: string
          language: string
          notes: string | null
          payment_method: string | null
          pdf_url: string | null
          property_address: string | null
          property_city: string | null
          property_floor: string | null
          property_rooms: string | null
          property_size: string | null
          rental_price: string | null
          second_party_id: string | null
          second_party_name: string | null
          second_party_phone: string | null
          second_party_signature: string | null
          signed_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          agent_id_number?: string | null
          agent_license?: string | null
          agent_name?: string | null
          agent_phone?: string | null
          agent_signature?: string | null
          client_address?: string | null
          client_email?: string | null
          client_id_number?: string | null
          client_name?: string | null
          client_phone?: string | null
          client_signature?: string | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          created_at?: string
          created_by?: string | null
          deposit_amount?: string | null
          entry_date?: string | null
          form_data?: Json | null
          form_type: string
          guarantees?: string | null
          id?: string
          language?: string
          notes?: string | null
          payment_method?: string | null
          pdf_url?: string | null
          property_address?: string | null
          property_city?: string | null
          property_floor?: string | null
          property_rooms?: string | null
          property_size?: string | null
          rental_price?: string | null
          second_party_id?: string | null
          second_party_name?: string | null
          second_party_phone?: string | null
          second_party_signature?: string | null
          signed_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          agent_id_number?: string | null
          agent_license?: string | null
          agent_name?: string | null
          agent_phone?: string | null
          agent_signature?: string | null
          client_address?: string | null
          client_email?: string | null
          client_id_number?: string | null
          client_name?: string | null
          client_phone?: string | null
          client_signature?: string | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          created_at?: string
          created_by?: string | null
          deposit_amount?: string | null
          entry_date?: string | null
          form_data?: Json | null
          form_type?: string
          guarantees?: string | null
          id?: string
          language?: string
          notes?: string | null
          payment_method?: string | null
          pdf_url?: string | null
          property_address?: string | null
          property_city?: string | null
          property_floor?: string | null
          property_rooms?: string | null
          property_size?: string | null
          rental_price?: string | null
          second_party_id?: string | null
          second_party_name?: string | null
          second_party_phone?: string | null
          second_party_signature?: string | null
          signed_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
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
      monitoring_logs: {
        Row: {
          alert_sent: boolean | null
          check_time: string
          created_at: string | null
          error_message: string | null
          id: string
          response_time_ms: number | null
          status: string
        }
        Insert: {
          alert_sent?: boolean | null
          check_time?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          response_time_ms?: number | null
          status: string
        }
        Update: {
          alert_sent?: boolean | null
          check_time?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          response_time_ms?: number | null
          status?: string
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
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_with_roles"
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
      personal_scout_matches: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          floor: number | null
          id: string
          is_private: boolean | null
          is_reviewed: boolean | null
          lead_id: string | null
          neighborhood: string | null
          notes: string | null
          price: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          rooms: number | null
          run_id: string | null
          size: number | null
          source: string
          source_url: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          floor?: number | null
          id?: string
          is_private?: boolean | null
          is_reviewed?: boolean | null
          lead_id?: string | null
          neighborhood?: string | null
          notes?: string | null
          price?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          rooms?: number | null
          run_id?: string | null
          size?: number | null
          source: string
          source_url?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          floor?: number | null
          id?: string
          is_private?: boolean | null
          is_reviewed?: boolean | null
          lead_id?: string | null
          neighborhood?: string | null
          notes?: string | null
          price?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          rooms?: number | null
          run_id?: string | null
          size?: number | null
          source?: string
          source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "personal_scout_matches_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "contact_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personal_scout_matches_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "personal_scout_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_scout_runs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          leads_completed: number | null
          leads_count: number | null
          started_at: string | null
          status: string | null
          total_matches: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          leads_completed?: number | null
          leads_count?: number | null
          started_at?: string | null
          status?: string | null
          total_matches?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          leads_completed?: number | null
          leads_count?: number | null
          started_at?: string | null
          status?: string | null
          total_matches?: number | null
        }
        Relationships: []
      }
      pipeline_runs: {
        Row: {
          branch: string | null
          commit_hash: string | null
          created_at: string | null
          error_message: string | null
          finished_at: string | null
          id: string
          started_at: string | null
          status: string
          test_results: Json | null
          triggered_by: string | null
        }
        Insert: {
          branch?: string | null
          commit_hash?: string | null
          created_at?: string | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          started_at?: string | null
          status: string
          test_results?: Json | null
          triggered_by?: string | null
        }
        Update: {
          branch?: string | null
          commit_hash?: string | null
          created_at?: string | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          started_at?: string | null
          status?: string
          test_results?: Json | null
          triggered_by?: string | null
        }
        Relationships: []
      }
      pitch_deck_slides: {
        Row: {
          background_image: string | null
          created_at: string
          deck_id: string
          id: string
          is_visible: boolean
          slide_data: Json
          slide_data_he: Json | null
          slide_order: number
          slide_type: string
          updated_at: string
        }
        Insert: {
          background_image?: string | null
          created_at?: string
          deck_id: string
          id?: string
          is_visible?: boolean
          slide_data?: Json
          slide_data_he?: Json | null
          slide_order?: number
          slide_type: string
          updated_at?: string
        }
        Update: {
          background_image?: string | null
          created_at?: string
          deck_id?: string
          id?: string
          is_visible?: boolean
          slide_data?: Json
          slide_data_he?: Json | null
          slide_order?: number
          slide_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pitch_deck_slides_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "pitch_decks"
            referencedColumns: ["id"]
          },
        ]
      }
      pitch_decks: {
        Row: {
          agent_names: string | null
          contact_phone: string | null
          contact_whatsapp: string | null
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          language: string
          last_viewed_at: string | null
          overlay_opacity: number | null
          property_id: string | null
          slug: string
          theme_color: string | null
          title: string
          updated_at: string
          views_count: number
        }
        Insert: {
          agent_names?: string | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          language?: string
          last_viewed_at?: string | null
          overlay_opacity?: number | null
          property_id?: string | null
          slug: string
          theme_color?: string | null
          title: string
          updated_at?: string
          views_count?: number
        }
        Update: {
          agent_names?: string | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          language?: string
          last_viewed_at?: string | null
          overlay_opacity?: number | null
          property_id?: string | null
          slug?: string
          theme_color?: string | null
          title?: string
          updated_at?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "pitch_decks_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      price_offer_blocks: {
        Row: {
          block_data: Json
          block_order: number
          block_type: string
          created_at: string
          id: string
          offer_id: string
          updated_at: string
        }
        Insert: {
          block_data?: Json
          block_order: number
          block_type: string
          created_at?: string
          id?: string
          offer_id: string
          updated_at?: string
        }
        Update: {
          block_data?: Json
          block_order?: number
          block_type?: string
          created_at?: string
          id?: string
          offer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_offer_blocks_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "price_offers"
            referencedColumns: ["id"]
          },
        ]
      }
      price_offer_images: {
        Row: {
          block_id: string | null
          created_at: string
          id: string
          image_order: number
          image_url: string
          offer_id: string
        }
        Insert: {
          block_id?: string | null
          created_at?: string
          id?: string
          image_order?: number
          image_url: string
          offer_id: string
        }
        Update: {
          block_id?: string | null
          created_at?: string
          id?: string
          image_order?: number
          image_url?: string
          offer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_offer_images_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "price_offer_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_offer_images_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "price_offers"
            referencedColumns: ["id"]
          },
        ]
      }
      price_offer_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_public: boolean | null
          name: string
          template_data: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          template_data: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          template_data?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      price_offers: {
        Row: {
          created_at: string
          created_by: string
          display_type: string
          expected_income_max: number | null
          expected_income_min: number | null
          expires_at: string | null
          id: string
          is_active: boolean
          language: string
          last_viewed_at: string | null
          price_per_sqm_max: number | null
          price_per_sqm_min: number | null
          property_details: string | null
          property_title: string
          slug: string | null
          suggested_price_max: number | null
          suggested_price_min: number | null
          token: string
          updated_at: string
          views_count: number
        }
        Insert: {
          created_at?: string
          created_by: string
          display_type?: string
          expected_income_max?: number | null
          expected_income_min?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          language?: string
          last_viewed_at?: string | null
          price_per_sqm_max?: number | null
          price_per_sqm_min?: number | null
          property_details?: string | null
          property_title: string
          slug?: string | null
          suggested_price_max?: number | null
          suggested_price_min?: number | null
          token?: string
          updated_at?: string
          views_count?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          display_type?: string
          expected_income_max?: number | null
          expected_income_min?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          language?: string
          last_viewed_at?: string | null
          price_per_sqm_max?: number | null
          price_per_sqm_min?: number | null
          property_details?: string | null
          property_title?: string
          slug?: string | null
          suggested_price_max?: number | null
          suggested_price_min?: number | null
          token?: string
          updated_at?: string
          views_count?: number
        }
        Relationships: []
      }
      priority_tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          is_completed: boolean | null
          priority: number
          task_type: string
          title: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean | null
          priority?: number
          task_type?: string
          title: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean | null
          priority?: number
          task_type?: string
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          broker_license_number: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          id_number: string | null
          is_approved: boolean
          last_login: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          broker_license_number?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          id_number?: string | null
          is_approved?: boolean
          last_login?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          broker_license_number?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          id_number?: string | null
          is_approved?: boolean
          last_login?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      project_scan_logs: {
        Row: {
          created_at: string
          error: string | null
          id: string
          property_id: string
          scanned_at: string
          status: string
          units_added: number | null
          units_changed: number | null
          units_found: number | null
          units_removed: number | null
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          property_id: string
          scanned_at?: string
          status?: string
          units_added?: number | null
          units_changed?: number | null
          units_found?: number | null
          units_removed?: number | null
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          property_id?: string
          scanned_at?: string
          status?: string
          units_added?: number | null
          units_changed?: number | null
          units_found?: number | null
          units_removed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_scan_logs_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      project_units: {
        Row: {
          created_at: string
          first_seen_at: string
          floor: number | null
          id: string
          last_seen_at: string
          price: number | null
          price_history: Json
          property_id: string
          raw_text: string | null
          removed_at: string | null
          rooms: number | null
          size: number | null
          status: string
          unit_identifier: string
          unit_type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          first_seen_at?: string
          floor?: number | null
          id?: string
          last_seen_at?: string
          price?: number | null
          price_history?: Json
          property_id: string
          raw_text?: string | null
          removed_at?: string | null
          rooms?: number | null
          size?: number | null
          status?: string
          unit_identifier: string
          unit_type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          first_seen_at?: string
          floor?: number | null
          id?: string
          last_seen_at?: string
          price?: number | null
          price_history?: Json
          property_id?: string
          raw_text?: string | null
          removed_at?: string | null
          rooms?: number | null
          size?: number | null
          status?: string
          unit_identifier?: string
          unit_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_units_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          acquisition_cost: number | null
          address: string
          assigned_user_id: string | null
          available: boolean | null
          balcony: boolean | null
          balcony_yard_size: number | null
          bathrooms: number | null
          building_committee_fee: number | null
          building_floors: number | null
          city: string
          co_brokerage_status: string | null
          contact_attempts: number
          contact_name: string | null
          contact_notes: string | null
          contact_phone: string | null
          contact_status: string
          created_at: string
          current_market_value: number | null
          description: string | null
          description_en: string | null
          elevator: boolean | null
          featured: boolean | null
          floor: number | null
          has_storage: boolean | null
          id: string
          last_contact_date: string | null
          mamad: boolean | null
          monthly_rent: number | null
          municipal_tax: number | null
          neighborhood: string | null
          neighborhood_en: string | null
          notes: string | null
          owner_email: string | null
          owner_name: string | null
          owner_phone: string | null
          parking: boolean | null
          project_status: string | null
          property_number: number
          property_size: number | null
          property_type: string | null
          renovation_costs: number | null
          rooms: number | null
          rooms_range: string | null
          show_management_badge: boolean | null
          show_on_website: boolean | null
          size_range: string | null
          status: string
          title: string | null
          title_en: string | null
          tracking_url: string | null
          units_count: number | null
          updated_at: string
          yard: boolean | null
        }
        Insert: {
          acquisition_cost?: number | null
          address: string
          assigned_user_id?: string | null
          available?: boolean | null
          balcony?: boolean | null
          balcony_yard_size?: number | null
          bathrooms?: number | null
          building_committee_fee?: number | null
          building_floors?: number | null
          city: string
          co_brokerage_status?: string | null
          contact_attempts?: number
          contact_name?: string | null
          contact_notes?: string | null
          contact_phone?: string | null
          contact_status?: string
          created_at?: string
          current_market_value?: number | null
          description?: string | null
          description_en?: string | null
          elevator?: boolean | null
          featured?: boolean | null
          floor?: number | null
          has_storage?: boolean | null
          id?: string
          last_contact_date?: string | null
          mamad?: boolean | null
          monthly_rent?: number | null
          municipal_tax?: number | null
          neighborhood?: string | null
          neighborhood_en?: string | null
          notes?: string | null
          owner_email?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          parking?: boolean | null
          project_status?: string | null
          property_number?: number
          property_size?: number | null
          property_type?: string | null
          renovation_costs?: number | null
          rooms?: number | null
          rooms_range?: string | null
          show_management_badge?: boolean | null
          show_on_website?: boolean | null
          size_range?: string | null
          status?: string
          title?: string | null
          title_en?: string | null
          tracking_url?: string | null
          units_count?: number | null
          updated_at?: string
          yard?: boolean | null
        }
        Update: {
          acquisition_cost?: number | null
          address?: string
          assigned_user_id?: string | null
          available?: boolean | null
          balcony?: boolean | null
          balcony_yard_size?: number | null
          bathrooms?: number | null
          building_committee_fee?: number | null
          building_floors?: number | null
          city?: string
          co_brokerage_status?: string | null
          contact_attempts?: number
          contact_name?: string | null
          contact_notes?: string | null
          contact_phone?: string | null
          contact_status?: string
          created_at?: string
          current_market_value?: number | null
          description?: string | null
          description_en?: string | null
          elevator?: boolean | null
          featured?: boolean | null
          floor?: number | null
          has_storage?: boolean | null
          id?: string
          last_contact_date?: string | null
          mamad?: boolean | null
          monthly_rent?: number | null
          municipal_tax?: number | null
          neighborhood?: string | null
          neighborhood_en?: string | null
          notes?: string | null
          owner_email?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          parking?: boolean | null
          project_status?: string | null
          property_number?: number
          property_size?: number | null
          property_type?: string | null
          renovation_costs?: number | null
          rooms?: number | null
          rooms_range?: string | null
          show_management_badge?: boolean | null
          show_on_website?: boolean | null
          size_range?: string | null
          status?: string
          title?: string | null
          title_en?: string | null
          tracking_url?: string | null
          units_count?: number | null
          updated_at?: string
          yard?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_assigned_user_id_fkey"
            columns: ["assigned_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_assigned_user_id_fkey"
            columns: ["assigned_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_with_roles"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "property_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "user_profiles_with_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      property_images: {
        Row: {
          alt_text: string | null
          created_at: string | null
          id: string
          image_url: string
          is_main: boolean | null
          media_type: string | null
          order_index: number | null
          property_id: string
          show_on_website: boolean | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string | null
          id?: string
          image_url: string
          is_main?: boolean | null
          media_type?: string | null
          order_index?: number | null
          property_id: string
          show_on_website?: boolean | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string | null
          id?: string
          image_url?: string
          is_main?: boolean | null
          media_type?: string | null
          order_index?: number | null
          property_id?: string
          show_on_website?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "property_images_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_interests: {
        Row: {
          contacted_at: string | null
          created_at: string | null
          id: string
          interest_level: string | null
          lead_id: string
          notes: string | null
          property_id: string
          viewed_at: string | null
        }
        Insert: {
          contacted_at?: string | null
          created_at?: string | null
          id?: string
          interest_level?: string | null
          lead_id: string
          notes?: string | null
          property_id: string
          viewed_at?: string | null
        }
        Update: {
          contacted_at?: string | null
          created_at?: string | null
          id?: string
          interest_level?: string | null
          lead_id?: string
          notes?: string | null
          property_id?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_interests_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "contact_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_interests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
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
          {
            foreignKeyName: "property_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "user_profiles_with_roles"
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
            foreignKeyName: "property_owners_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_with_roles"
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
      qa_tests: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          expected_result: string | null
          id: string
          last_tested_at: string | null
          name: string
          notes: string | null
          priority: string | null
          status: string | null
          tested_by: string | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          expected_result?: string | null
          id?: string
          last_tested_at?: string | null
          name: string
          notes?: string | null
          priority?: string | null
          status?: string | null
          tested_by?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          expected_result?: string | null
          id?: string
          last_tested_at?: string | null
          name?: string
          notes?: string | null
          priority?: string | null
          status?: string | null
          tested_by?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qa_tests_tested_by_fkey"
            columns: ["tested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qa_tests_tested_by_fkey"
            columns: ["tested_by"]
            isOneToOne: false
            referencedRelation: "user_profiles_with_roles"
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
      scout_configs: {
        Row: {
          cities: string[] | null
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          last_run_at: string | null
          last_run_results: Json | null
          last_run_status: string | null
          max_pages: number | null
          max_price: number | null
          max_rooms: number | null
          max_size: number | null
          min_price: number | null
          min_rooms: number | null
          min_size: number | null
          name: string
          neighborhoods: string[] | null
          owner_type_filter: string | null
          page_delay_seconds: number | null
          property_type: string
          schedule_times: string[] | null
          search_url: string | null
          source: string
          start_page: number | null
          updated_at: string
          wait_for_ms: number | null
        }
        Insert: {
          cities?: string[] | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          last_run_results?: Json | null
          last_run_status?: string | null
          max_pages?: number | null
          max_price?: number | null
          max_rooms?: number | null
          max_size?: number | null
          min_price?: number | null
          min_rooms?: number | null
          min_size?: number | null
          name: string
          neighborhoods?: string[] | null
          owner_type_filter?: string | null
          page_delay_seconds?: number | null
          property_type: string
          schedule_times?: string[] | null
          search_url?: string | null
          source: string
          start_page?: number | null
          updated_at?: string
          wait_for_ms?: number | null
        }
        Update: {
          cities?: string[] | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          last_run_results?: Json | null
          last_run_status?: string | null
          max_pages?: number | null
          max_price?: number | null
          max_rooms?: number | null
          max_size?: number | null
          min_price?: number | null
          min_rooms?: number | null
          min_size?: number | null
          name?: string
          neighborhoods?: string[] | null
          owner_type_filter?: string | null
          page_delay_seconds?: number | null
          property_type?: string
          schedule_times?: string[] | null
          search_url?: string | null
          source?: string
          start_page?: number | null
          updated_at?: string
          wait_for_ms?: number | null
        }
        Relationships: []
      }
      scout_runs: {
        Row: {
          completed_at: string | null
          config_id: string | null
          error_message: string | null
          id: string
          leads_matched: number | null
          max_retries: number | null
          new_properties: number | null
          page_stats: Json | null
          properties_found: number | null
          retry_count: number | null
          retry_of: string | null
          source: string
          started_at: string
          status: string
          whatsapp_sent: number | null
        }
        Insert: {
          completed_at?: string | null
          config_id?: string | null
          error_message?: string | null
          id?: string
          leads_matched?: number | null
          max_retries?: number | null
          new_properties?: number | null
          page_stats?: Json | null
          properties_found?: number | null
          retry_count?: number | null
          retry_of?: string | null
          source: string
          started_at?: string
          status?: string
          whatsapp_sent?: number | null
        }
        Update: {
          completed_at?: string | null
          config_id?: string | null
          error_message?: string | null
          id?: string
          leads_matched?: number | null
          max_retries?: number | null
          new_properties?: number | null
          page_stats?: Json | null
          properties_found?: number | null
          retry_count?: number | null
          retry_of?: string | null
          source?: string
          started_at?: string
          status?: string
          whatsapp_sent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "scout_runs_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "scout_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scout_runs_retry_of_fkey"
            columns: ["retry_of"]
            isOneToOne: false
            referencedRelation: "scout_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      scout_settings: {
        Row: {
          category: string
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          category: string
          description?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          category?: string
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      scouted_properties: {
        Row: {
          address: string | null
          availability_check_count: number
          availability_check_reason: string | null
          availability_checked_at: string | null
          backfill_status: string | null
          city: string | null
          created_at: string
          dedup_checked_at: string | null
          description: string | null
          duplicate_check_possible: boolean | null
          duplicate_detected_at: string | null
          duplicate_group_id: string | null
          features: Json | null
          first_seen_at: string
          floor: number | null
          id: string
          images: Json | null
          is_active: boolean | null
          is_primary_listing: boolean | null
          is_private: boolean | null
          last_seen_at: string
          matched_leads: Json | null
          neighborhood: string | null
          owner_phone: string | null
          price: number | null
          property_type: string | null
          raw_data: Json | null
          raw_text: string | null
          rooms: number | null
          size: number | null
          source: string
          source_id: string | null
          source_url: string
          status: string
          title: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          availability_check_count?: number
          availability_check_reason?: string | null
          availability_checked_at?: string | null
          backfill_status?: string | null
          city?: string | null
          created_at?: string
          dedup_checked_at?: string | null
          description?: string | null
          duplicate_check_possible?: boolean | null
          duplicate_detected_at?: string | null
          duplicate_group_id?: string | null
          features?: Json | null
          first_seen_at?: string
          floor?: number | null
          id?: string
          images?: Json | null
          is_active?: boolean | null
          is_primary_listing?: boolean | null
          is_private?: boolean | null
          last_seen_at?: string
          matched_leads?: Json | null
          neighborhood?: string | null
          owner_phone?: string | null
          price?: number | null
          property_type?: string | null
          raw_data?: Json | null
          raw_text?: string | null
          rooms?: number | null
          size?: number | null
          source: string
          source_id?: string | null
          source_url: string
          status?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          availability_check_count?: number
          availability_check_reason?: string | null
          availability_checked_at?: string | null
          backfill_status?: string | null
          city?: string | null
          created_at?: string
          dedup_checked_at?: string | null
          description?: string | null
          duplicate_check_possible?: boolean | null
          duplicate_detected_at?: string | null
          duplicate_group_id?: string | null
          features?: Json | null
          first_seen_at?: string
          floor?: number | null
          id?: string
          images?: Json | null
          is_active?: boolean | null
          is_primary_listing?: boolean | null
          is_private?: boolean | null
          last_seen_at?: string
          matched_leads?: Json | null
          neighborhood?: string | null
          owner_phone?: string | null
          price?: number | null
          property_type?: string | null
          raw_data?: Json | null
          raw_text?: string | null
          rooms?: number | null
          size?: number | null
          source?: string
          source_id?: string | null
          source_url?: string
          status?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      seo_checks: {
        Row: {
          ai_analysis: Json | null
          checked_at: string | null
          created_by: string | null
          fix_prompt: string | null
          id: string
          page_name: string | null
          page_url: string
          results: Json
          score: number
        }
        Insert: {
          ai_analysis?: Json | null
          checked_at?: string | null
          created_by?: string | null
          fix_prompt?: string | null
          id?: string
          page_name?: string | null
          page_url: string
          results?: Json
          score?: number
        }
        Update: {
          ai_analysis?: Json | null
          checked_at?: string | null
          created_by?: string | null
          fix_prompt?: string | null
          id?: string
          page_name?: string | null
          page_url?: string
          results?: Json
          score?: number
        }
        Relationships: []
      }
      signature_forms: {
        Row: {
          created_at: string | null
          form_data: Json
          form_type: string
          id: string
          pdf_url: string | null
          property_id: string | null
          sent_at: string | null
          sent_by: string | null
          sent_to_email: string | null
          sent_to_phone: string | null
          signature_data: string | null
          signed_at: string | null
          signed_by_id_number: string | null
          signed_by_name: string | null
          status: string
          token: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          form_data: Json
          form_type: string
          id?: string
          pdf_url?: string | null
          property_id?: string | null
          sent_at?: string | null
          sent_by?: string | null
          sent_to_email?: string | null
          sent_to_phone?: string | null
          signature_data?: string | null
          signed_at?: string | null
          signed_by_id_number?: string | null
          signed_by_name?: string | null
          status?: string
          token?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          form_data?: Json
          form_type?: string
          id?: string
          pdf_url?: string | null
          property_id?: string | null
          sent_at?: string | null
          sent_by?: string | null
          sent_to_email?: string | null
          sent_to_phone?: string | null
          signature_data?: string | null
          signed_at?: string | null
          signed_by_id_number?: string | null
          signed_by_name?: string | null
          status?: string
          token?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "signature_forms_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      site_issues: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          image_url: string | null
          priority: string | null
          reported_by: string | null
          resolved_at: string | null
          status: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          priority?: string | null
          reported_by?: string | null
          resolved_at?: string | null
          status?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          priority?: string | null
          reported_by?: string | null
          resolved_at?: string | null
          status?: string | null
          title?: string
        }
        Relationships: []
      }
      street_neighborhoods: {
        Row: {
          city: string
          confidence: number | null
          created_at: string | null
          id: string
          is_verified: boolean | null
          neighborhood: string | null
          neighborhood_normalized: string | null
          number_from: number | null
          number_to: number | null
          source: string | null
          street_name: string
          updated_at: string | null
        }
        Insert: {
          city?: string
          confidence?: number | null
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          neighborhood?: string | null
          neighborhood_normalized?: string | null
          number_from?: number | null
          number_to?: number | null
          source?: string | null
          street_name: string
          updated_at?: string | null
        }
        Update: {
          city?: string
          confidence?: number | null
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          neighborhood?: string | null
          neighborhood_normalized?: string | null
          number_from?: number | null
          number_to?: number | null
          source?: string | null
          street_name?: string
          updated_at?: string | null
        }
        Relationships: []
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
      user_invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invitation_token: string
          invited_by: string
          role: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invitation_token?: string
          invited_by: string
          role?: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invitation_token?: string
          invited_by?: string
          role?: string
          used_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_contacts: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          is_whatsapp_user: boolean | null
          last_seen: string | null
          name: string | null
          phone: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          is_whatsapp_user?: boolean | null
          last_seen?: string | null
          name?: string | null
          phone: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          is_whatsapp_user?: boolean | null
          last_seen?: string | null
          name?: string | null
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_messages: {
        Row: {
          api_source: string | null
          chat_id: string | null
          chat_type: string | null
          contact_name: string | null
          contact_type: string | null
          created_at: string
          delivered_at: string | null
          direction: string
          error_message: string | null
          green_api_instance_id: string | null
          group_name: string | null
          id: string
          message: string
          message_type: string | null
          phone: string
          property_id: string | null
          read_at: string | null
          receipt_id: string | null
          retry_count: number | null
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
          delivered_at?: string | null
          direction?: string
          error_message?: string | null
          green_api_instance_id?: string | null
          group_name?: string | null
          id?: string
          message: string
          message_type?: string | null
          phone: string
          property_id?: string | null
          read_at?: string | null
          receipt_id?: string | null
          retry_count?: number | null
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
          delivered_at?: string | null
          direction?: string
          error_message?: string | null
          green_api_instance_id?: string | null
          group_name?: string | null
          id?: string
          message?: string
          message_type?: string | null
          phone?: string
          property_id?: string | null
          read_at?: string | null
          receipt_id?: string | null
          retry_count?: number | null
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
      user_profiles_with_roles: {
        Row: {
          address: string | null
          broker_license_number: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string | null
          id_number: string | null
          is_approved: boolean | null
          last_login: string | null
          phone: string | null
          role: Database["public"]["Enums"]["app_role"] | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_property_invitation: {
        Args: { invitation_token: string }
        Returns: Json
      }
      append_run_detail: {
        Args: { p_detail: Json; p_run_id: string }
        Returns: undefined
      }
      cleanup_orphan_duplicate_groups: { Args: never; Returns: number }
      detect_duplicates_batch: {
        Args: { batch_size?: number }
        Returns: {
          duplicates_found: number
          groups_created: number
          properties_processed: number
        }[]
      }
      find_property_duplicate: {
        Args: {
          p_address: string
          p_city: string
          p_exclude_id?: string
          p_floor: number
          p_property_type?: string
          p_rooms: number
          p_size?: number
        }
        Returns: {
          duplicate_group_id: string
          id: string
          price: number
          size: number
          source: string
        }[]
      }
      get_current_user_role: { Args: never; Returns: string }
      get_customer_matches: {
        Args: { customer_uuid: string; include_dismissed?: boolean }
        Returns: {
          address: string
          city: string
          duplicate_group_id: string
          duplicates_count: number
          id: string
          is_dismissed: boolean
          is_private: boolean
          match_reasons: string[]
          match_score: number
          neighborhood: string
          price: number
          property_type: string
          rooms: number
          size: number
          source: string
          source_url: string
          title: string
        }[]
      }
      get_matches_by_hour: {
        Args: { end_date: string; start_date: string }
        Returns: {
          hour_key: string
          match_count: number
        }[]
      }
      get_properties_needing_availability_check: {
        Args: {
          p_fetch_limit?: number
          p_first_recheck_days?: number
          p_min_days_before_check?: number
          p_recurring_recheck_days?: number
        }
        Returns: {
          id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_matching_progress: {
        Args: {
          p_matches_count: number
          p_properties_count: number
          p_run_id: string
        }
        Returns: {
          leads_matched: number
          new_properties: number
          properties_found: number
        }[]
      }
      increment_scout_run_stats: {
        Args: { p_found: number; p_new: number; p_run_id: string }
        Returns: undefined
      }
      normalize_address_for_matching: {
        Args: { addr: string }
        Returns: string
      }
      recompute_duplicate_winners: {
        Args: never
        Returns: {
          groups_updated: number
          properties_updated: number
        }[]
      }
      update_cron_schedule: {
        Args: { p_job_name: string; p_new_schedule: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "admin"
        | "manager"
        | "viewer"
        | "property_owner"
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
      app_role: ["super_admin", "admin", "manager", "viewer", "property_owner"],
    },
  },
} as const
