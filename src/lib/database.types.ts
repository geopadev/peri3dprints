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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          name: string
          position: number | null
          slug: string
        }
        Insert: {
          id?: string
          name: string
          position?: number | null
          slug: string
        }
        Update: {
          id?: string
          name?: string
          position?: number | null
          slug?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          buyer_id: string | null
          created_at: string | null
          display_name: string | null
          email: string | null
          id: string
          kind: Database["public"]["Enums"]["convo_kind"]
          last_message_at: string | null
          product_id: string | null
          status: Database["public"]["Enums"]["convo_status"]
          subject: string | null
          unread_for_buyer: boolean | null
          unread_for_owner: boolean | null
        }
        Insert: {
          buyer_id?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["convo_kind"]
          last_message_at?: string | null
          product_id?: string | null
          status?: Database["public"]["Enums"]["convo_status"]
          subject?: string | null
          unread_for_buyer?: boolean | null
          unread_for_owner?: boolean | null
        }
        Update: {
          buyer_id?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["convo_kind"]
          last_message_at?: string | null
          product_id?: string | null
          status?: Database["public"]["Enums"]["convo_status"]
          subject?: string | null
          unread_for_buyer?: boolean | null
          unread_for_owner?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_request_details: {
        Row: {
          budget_cents: number | null
          colour_pref: string | null
          conversation_id: string
          deadline: string | null
          reference_paths: string[] | null
          size_note: string | null
        }
        Insert: {
          budget_cents?: number | null
          colour_pref?: string | null
          conversation_id: string
          deadline?: string | null
          reference_paths?: string[] | null
          size_note?: string | null
        }
        Update: {
          budget_cents?: number | null
          colour_pref?: string | null
          conversation_id?: string
          deadline?: string | null
          reference_paths?: string[] | null
          size_note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_request_details_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: true
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachments: Json | null
          body: string | null
          conversation_id: string
          created_at: string | null
          id: string
          kind: string
          payload: Json | null
          read_at: string | null
          sender_id: string | null
          sender_role: Database["public"]["Enums"]["sender_role"]
        }
        Insert: {
          attachments?: Json | null
          body?: string | null
          conversation_id: string
          created_at?: string | null
          id?: string
          kind?: string
          payload?: Json | null
          read_at?: string | null
          sender_id?: string | null
          sender_role: Database["public"]["Enums"]["sender_role"]
        }
        Update: {
          attachments?: Json | null
          body?: string | null
          conversation_id?: string
          created_at?: string | null
          id?: string
          kind?: string
          payload?: Json | null
          read_at?: string | null
          sender_id?: string | null
          sender_role?: Database["public"]["Enums"]["sender_role"]
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      order_events: {
        Row: {
          created_at: string | null
          id: string
          order_id: string
          payload: Json | null
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id: string
          payload?: Json | null
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string
          payload?: Json | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          image_path_snapshot: string | null
          order_id: string
          product_id: string | null
          quantity: number
          title_snapshot: string
          unit_price_cents: number
          variant_id: string | null
          variant_snapshot: string | null
        }
        Insert: {
          id?: string
          image_path_snapshot?: string | null
          order_id: string
          product_id?: string | null
          quantity: number
          title_snapshot: string
          unit_price_cents: number
          variant_id?: string | null
          variant_snapshot?: string | null
        }
        Update: {
          id?: string
          image_path_snapshot?: string | null
          order_id?: string
          product_id?: string | null
          quantity?: number
          title_snapshot?: string
          unit_price_cents?: number
          variant_id?: string | null
          variant_snapshot?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          access_token: string
          buyer_id: string | null
          buyer_note: string | null
          carrier_reference: string | null
          created_at: string | null
          currency: string
          email: string
          full_name: string
          id: string
          order_number: string
          owner_note: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status: Database["public"]["Enums"]["payment_status"]
          phone: string
          pickup_point: Json | null
          shipping_address: Json | null
          shipping_cents: number
          shipping_method_id: string | null
          status: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent: string | null
          stripe_session_id: string | null
          subtotal_cents: number
          total_cents: number
          tracking_number: string | null
          tracking_url: string | null
          updated_at: string | null
        }
        Insert: {
          access_token?: string
          buyer_id?: string | null
          buyer_note?: string | null
          carrier_reference?: string | null
          created_at?: string | null
          currency?: string
          email: string
          full_name: string
          id?: string
          order_number: string
          owner_note?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          phone: string
          pickup_point?: Json | null
          shipping_address?: Json | null
          shipping_cents: number
          shipping_method_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          subtotal_cents: number
          total_cents: number
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string | null
        }
        Update: {
          access_token?: string
          buyer_id?: string | null
          buyer_note?: string | null
          carrier_reference?: string | null
          created_at?: string | null
          currency?: string
          email?: string
          full_name?: string
          id?: string
          order_number?: string
          owner_note?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          phone?: string
          pickup_point?: Json | null
          shipping_address?: Json | null
          shipping_cents?: number
          shipping_method_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          subtotal_cents?: number
          total_cents?: number
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_shipping_method_id_fkey"
            columns: ["shipping_method_id"]
            isOneToOne: false
            referencedRelation: "shipping_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt_text: string
          id: string
          position: number | null
          product_id: string
          storage_path: string
        }
        Insert: {
          alt_text: string
          id?: string
          position?: number | null
          product_id: string
          storage_path: string
        }
        Update: {
          alt_text?: string
          id?: string
          position?: number | null
          product_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          id: string
          name: string
          option_label: string
          position: number | null
          price_delta_cents: number | null
          product_id: string
          sku: string | null
          stock_qty: number | null
          swatch_hex: string | null
        }
        Insert: {
          id?: string
          name: string
          option_label?: string
          position?: number | null
          price_delta_cents?: number | null
          product_id: string
          sku?: string | null
          stock_qty?: number | null
          swatch_hex?: string | null
        }
        Update: {
          id?: string
          name?: string
          option_label?: string
          position?: number | null
          price_delta_cents?: number | null
          product_id?: string
          sku?: string | null
          stock_qty?: number | null
          swatch_hex?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          compare_at_cents: number | null
          created_at: string | null
          description: string | null
          featured: boolean | null
          height_mm: number | null
          id: string
          lead_time_days: number | null
          length_mm: number | null
          made_to_order: boolean | null
          material: string | null
          price_cents: number
          print_minutes: number | null
          short_description: string | null
          slug: string
          spec_note: string | null
          status: Database["public"]["Enums"]["product_status"]
          stock_qty: number | null
          tags: string[] | null
          title: string
          updated_at: string | null
          weight_grams: number | null
          width_mm: number | null
        }
        Insert: {
          category_id?: string | null
          compare_at_cents?: number | null
          created_at?: string | null
          description?: string | null
          featured?: boolean | null
          height_mm?: number | null
          id?: string
          lead_time_days?: number | null
          length_mm?: number | null
          made_to_order?: boolean | null
          material?: string | null
          price_cents: number
          print_minutes?: number | null
          short_description?: string | null
          slug: string
          spec_note?: string | null
          status?: Database["public"]["Enums"]["product_status"]
          stock_qty?: number | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          weight_grams?: number | null
          width_mm?: number | null
        }
        Update: {
          category_id?: string | null
          compare_at_cents?: number | null
          created_at?: string | null
          description?: string | null
          featured?: boolean | null
          height_mm?: number | null
          id?: string
          lead_time_days?: number | null
          length_mm?: number | null
          made_to_order?: boolean | null
          material?: string | null
          price_cents?: number
          print_minutes?: number | null
          short_description?: string | null
          slug?: string
          spec_note?: string | null
          status?: Database["public"]["Enums"]["product_status"]
          stock_qty?: number | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          weight_grams?: number | null
          width_mm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          display_name: string | null
          email: string | null
          id: string
          phone: string | null
          role: string
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id: string
          phone?: string | null
          role?: string
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          role?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          announcement: string | null
          bank_account_name: string | null
          bank_bic: string | null
          bank_iban: string | null
          boxnow_origin_location_id: string | null
          id: number
          shop_open: boolean | null
          updated_at: string | null
          whatsapp_number: string | null
        }
        Insert: {
          announcement?: string | null
          bank_account_name?: string | null
          bank_bic?: string | null
          bank_iban?: string | null
          boxnow_origin_location_id?: string | null
          id?: number
          shop_open?: boolean | null
          updated_at?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          announcement?: string | null
          bank_account_name?: string | null
          bank_bic?: string | null
          bank_iban?: string | null
          boxnow_origin_location_id?: string | null
          id?: number
          shop_open?: boolean | null
          updated_at?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      shipping_methods: {
        Row: {
          active: boolean | null
          base_cents: number
          carrier: Database["public"]["Enums"]["carrier"]
          code: string
          description: string | null
          free_over_cents: number | null
          id: string
          label: string
          max_weight_grams: number | null
          per_extra_100g_cents: number | null
          position: number | null
          requires_locker: boolean | null
          supports_cod: boolean | null
          zone: Database["public"]["Enums"]["ship_zone"]
        }
        Insert: {
          active?: boolean | null
          base_cents: number
          carrier: Database["public"]["Enums"]["carrier"]
          code: string
          description?: string | null
          free_over_cents?: number | null
          id?: string
          label: string
          max_weight_grams?: number | null
          per_extra_100g_cents?: number | null
          position?: number | null
          requires_locker?: boolean | null
          supports_cod?: boolean | null
          zone: Database["public"]["Enums"]["ship_zone"]
        }
        Update: {
          active?: boolean | null
          base_cents?: number
          carrier?: Database["public"]["Enums"]["carrier"]
          code?: string
          description?: string | null
          free_over_cents?: number | null
          id?: string
          label?: string
          max_weight_grams?: number | null
          per_extra_100g_cents?: number | null
          position?: number | null
          requires_locker?: boolean | null
          supports_cod?: boolean | null
          zone?: Database["public"]["Enums"]["ship_zone"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_order: {
        Args: {
          p_buyer_note?: string
          p_country_code: string
          p_email: string
          p_full_name: string
          p_items: Json
          p_payment_method: Database["public"]["Enums"]["payment_method"]
          p_phone: string
          p_pickup_point: Json
          p_shipping_address: Json
          p_shipping_method_id: string
        }
        Returns: {
          access_token: string
          order_id: string
          order_number: string
          shipping_cents: number
          subtotal_cents: number
          total_cents: number
        }[]
      }
      generate_order_number: { Args: never; Returns: string }
      is_owner: { Args: never; Returns: boolean }
    }
    Enums: {
      carrier: "boxnow" | "acs" | "cypost" | "pickup"
      convo_kind: "general" | "custom_request"
      convo_status: "open" | "awaiting_owner" | "awaiting_buyer" | "closed"
      order_status:
        | "pending"
        | "paid"
        | "awaiting_payment"
        | "printing"
        | "ready"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "refunded"
      payment_method: "card" | "cod" | "bank_transfer"
      payment_status: "unpaid" | "paid" | "refunded" | "failed"
      product_status: "draft" | "active" | "archived"
      sender_role: "buyer" | "owner"
      ship_zone: "cy" | "eu" | "world"
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
      carrier: ["boxnow", "acs", "cypost", "pickup"],
      convo_kind: ["general", "custom_request"],
      convo_status: ["open", "awaiting_owner", "awaiting_buyer", "closed"],
      order_status: [
        "pending",
        "paid",
        "awaiting_payment",
        "printing",
        "ready",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      payment_method: ["card", "cod", "bank_transfer"],
      payment_status: ["unpaid", "paid", "refunded", "failed"],
      product_status: ["draft", "active", "archived"],
      sender_role: ["buyer", "owner"],
      ship_zone: ["cy", "eu", "world"],
    },
  },
} as const
