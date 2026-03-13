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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      abandoned_carts: {
        Row: {
          abandoned_at: string
          cart_items: Json
          cart_total: number
          created_at: string
          customer_id: string | null
          email: string | null
          id: string
          recovered_at: string | null
          recovery_email_sent_at: string | null
          recovery_status: string
          store_id: string
        }
        Insert: {
          abandoned_at?: string
          cart_items?: Json
          cart_total?: number
          created_at?: string
          customer_id?: string | null
          email?: string | null
          id?: string
          recovered_at?: string | null
          recovery_email_sent_at?: string | null
          recovery_status?: string
          store_id: string
        }
        Update: {
          abandoned_at?: string
          cart_items?: Json
          cart_total?: number
          created_at?: string
          customer_id?: string | null
          email?: string | null
          id?: string
          recovered_at?: string | null
          recovery_email_sent_at?: string | null
          recovery_status?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "abandoned_carts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "abandoned_carts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          store_id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          store_id: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          store_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          parent_id: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          sort_order: number
          store_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          parent_id?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          sort_order?: number
          store_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          parent_id?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          sort_order?: number
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      content_pages: {
        Row: {
          content: string | null
          created_at: string
          featured_image: string | null
          id: string
          is_published: boolean | null
          page_type: string
          published_at: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          sort_order: number | null
          status: string
          store_id: string
          title: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          featured_image?: string | null
          id?: string
          is_published?: boolean | null
          page_type?: string
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          sort_order?: number | null
          status?: string
          store_id: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          featured_image?: string | null
          id?: string
          is_published?: boolean | null
          page_type?: string
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          sort_order?: number | null
          status?: string
          store_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_pages_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          applies_to: string | null
          category_ids: string[] | null
          code: string
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          free_shipping: boolean | null
          id: string
          is_active: boolean
          max_uses: number | null
          min_order_amount: number | null
          per_customer_limit: number | null
          product_ids: string[] | null
          starts_at: string | null
          store_id: string
          updated_at: string
          used_count: number
        }
        Insert: {
          applies_to?: string | null
          category_ids?: string[] | null
          code: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          free_shipping?: boolean | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order_amount?: number | null
          per_customer_limit?: number | null
          product_ids?: string[] | null
          starts_at?: string | null
          store_id: string
          updated_at?: string
          used_count?: number
        }
        Update: {
          applies_to?: string | null
          category_ids?: string[] | null
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          free_shipping?: boolean | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order_amount?: number | null
          per_customer_limit?: number | null
          product_ids?: string[] | null
          starts_at?: string | null
          store_id?: string
          updated_at?: string
          used_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "coupons_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          segment: string
          store_id: string
          tags: string[] | null
          total_orders: number
          total_spent: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          segment?: string
          store_id: string
          tags?: string[] | null
          total_orders?: number
          total_spent?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          segment?: string
          store_id?: string
          tags?: string[] | null
          total_orders?: number
          total_spent?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_vouchers: {
        Row: {
          balance: number
          code: string
          created_at: string
          currency: string
          expires_at: string | null
          id: string
          initial_value: number
          is_active: boolean | null
          message: string | null
          order_id: string | null
          purchased_by: string | null
          recipient_email: string | null
          recipient_name: string | null
          redeemed_at: string | null
          sender_name: string | null
          store_id: string
          updated_at: string
        }
        Insert: {
          balance?: number
          code: string
          created_at?: string
          currency?: string
          expires_at?: string | null
          id?: string
          initial_value?: number
          is_active?: boolean | null
          message?: string | null
          order_id?: string | null
          purchased_by?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          redeemed_at?: string | null
          sender_name?: string | null
          store_id: string
          updated_at?: string
        }
        Update: {
          balance?: number
          code?: string
          created_at?: string
          currency?: string
          expires_at?: string | null
          id?: string
          initial_value?: number
          is_active?: boolean | null
          message?: string | null
          order_id?: string | null
          purchased_by?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          redeemed_at?: string | null
          sender_name?: string | null
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gift_vouchers_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_vouchers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      import_logs: {
        Row: {
          completed_at: string | null
          created_at: string
          entity_type: string
          error_count: number | null
          errors: Json | null
          file_name: string | null
          id: string
          status: string
          store_id: string
          success_count: number | null
          template_id: string | null
          total_rows: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          entity_type?: string
          error_count?: number | null
          errors?: Json | null
          file_name?: string | null
          id?: string
          status?: string
          store_id: string
          success_count?: number | null
          template_id?: string | null
          total_rows?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          entity_type?: string
          error_count?: number | null
          errors?: Json | null
          file_name?: string | null
          id?: string
          status?: string
          store_id?: string
          success_count?: number | null
          template_id?: string | null
          total_rows?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_logs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_logs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "import_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      import_templates: {
        Row: {
          created_at: string
          delimiter: string | null
          entity_type: string
          field_mappings: Json
          id: string
          name: string
          static_values: Json | null
          store_id: string
          transformations: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          delimiter?: string | null
          entity_type?: string
          field_mappings?: Json
          id?: string
          name: string
          static_values?: Json | null
          store_id: string
          transformations?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          delimiter?: string | null
          entity_type?: string
          field_mappings?: Json
          id?: string
          name?: string
          static_values?: Json | null
          store_id?: string
          transformations?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_templates_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_locations: {
        Row: {
          address: string | null
          created_at: string
          id: string
          name: string
          store_id: string
          type: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          name: string
          store_id: string
          type?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          name?: string
          store_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_locations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_stock: {
        Row: {
          created_at: string
          id: string
          location_id: string
          low_stock_threshold: number
          product_id: string
          quantity: number
          store_id: string
          updated_at: string
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          location_id: string
          low_stock_threshold?: number
          product_id: string
          quantity?: number
          store_id: string
          updated_at?: string
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          location_id?: string
          low_stock_threshold?: number
          product_id?: string
          quantity?: number
          store_id?: string
          updated_at?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_stock_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "inventory_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_stock_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_stock_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_stock_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_campaigns: {
        Row: {
          audience_segment: string | null
          audience_tags: string[] | null
          campaign_type: string
          content: string | null
          created_at: string
          id: string
          name: string
          scheduled_at: string | null
          sent_at: string | null
          stats: Json | null
          status: string
          store_id: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          audience_segment?: string | null
          audience_tags?: string[] | null
          campaign_type?: string
          content?: string | null
          created_at?: string
          id?: string
          name: string
          scheduled_at?: string | null
          sent_at?: string | null
          stats?: Json | null
          status?: string
          store_id: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          audience_segment?: string | null
          audience_tags?: string[] | null
          campaign_type?: string
          content?: string | null
          created_at?: string
          id?: string
          name?: string
          scheduled_at?: string | null
          sent_at?: string | null
          stats?: Json | null
          status?: string
          store_id?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_campaigns_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          email: string
          id: string
          is_active: boolean
          store_id: string
          subscribed_at: string
        }
        Insert: {
          email: string
          id?: string
          is_active?: boolean
          store_id: string
          subscribed_at?: string
        }
        Update: {
          email?: string
          id?: string
          is_active?: boolean
          store_id?: string
          subscribed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_subscribers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string | null
          quantity: number
          sku: string | null
          store_id: string
          title: string
          total: number
          unit_price: number
          variant_id: string | null
        }
        Insert: {
          id?: string
          order_id: string
          product_id?: string | null
          quantity?: number
          sku?: string | null
          store_id: string
          title: string
          total?: number
          unit_price?: number
          variant_id?: string | null
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string | null
          quantity?: number
          sku?: string | null
          store_id?: string
          title?: string
          total?: number
          unit_price?: number
          variant_id?: string | null
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
            foreignKeyName: "order_items_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
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
      order_shipments: {
        Row: {
          carrier: string | null
          created_at: string
          delivered_at: string | null
          id: string
          notes: string | null
          order_id: string
          shipment_number: string
          shipped_at: string | null
          status: string
          store_id: string
          tracking_number: string | null
          tracking_url: string | null
          updated_at: string
        }
        Insert: {
          carrier?: string | null
          created_at?: string
          delivered_at?: string | null
          id?: string
          notes?: string | null
          order_id: string
          shipment_number?: string
          shipped_at?: string | null
          status?: string
          store_id: string
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
        }
        Update: {
          carrier?: string | null
          created_at?: string
          delivered_at?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          shipment_number?: string
          shipped_at?: string | null
          status?: string
          store_id?: string
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_shipments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_shipments_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      order_timeline: {
        Row: {
          created_at: string
          description: string | null
          event_type: string
          id: string
          metadata: Json | null
          order_id: string
          store_id: string
          title: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          order_id: string
          store_id: string
          title: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          order_id?: string
          store_id?: string
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_timeline_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_timeline_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          coupon_id: string | null
          created_at: string
          customer_id: string | null
          discount: number
          fulfillment_status: string
          id: string
          items_count: number
          notes: string | null
          order_number: string
          payment_status: string
          shipping: number
          shipping_address: string | null
          status: string
          store_id: string
          subtotal: number
          tax: number
          total: number
          updated_at: string
        }
        Insert: {
          coupon_id?: string | null
          created_at?: string
          customer_id?: string | null
          discount?: number
          fulfillment_status?: string
          id?: string
          items_count?: number
          notes?: string | null
          order_number: string
          payment_status?: string
          shipping?: number
          shipping_address?: string | null
          status?: string
          store_id: string
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
        }
        Update: {
          coupon_id?: string | null
          created_at?: string
          customer_id?: string | null
          discount?: number
          fulfillment_status?: string
          id?: string
          items_count?: number
          notes?: string | null
          order_number?: string
          payment_status?: string
          shipping?: number
          shipping_address?: string | null
          status?: string
          store_id?: string
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      product_pricing_tiers: {
        Row: {
          created_at: string
          id: string
          min_quantity: number
          price: number
          product_id: string
          store_id: string
          tier_name: string
          updated_at: string
          user_group: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          min_quantity?: number
          price?: number
          product_id: string
          store_id: string
          tier_name?: string
          updated_at?: string
          user_group?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          min_quantity?: number
          price?: number
          product_id?: string
          store_id?: string
          tier_name?: string
          updated_at?: string
          user_group?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_pricing_tiers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_pricing_tiers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      product_relations: {
        Row: {
          created_at: string
          id: string
          product_id: string
          related_product_id: string
          relation_type: string
          sort_order: number | null
          store_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          related_product_id: string
          relation_type?: string
          sort_order?: number | null
          store_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          related_product_id?: string
          relation_type?: string
          sort_order?: number | null
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_relations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_relations_related_product_id_fkey"
            columns: ["related_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_relations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reviews: {
        Row: {
          author_name: string
          body: string | null
          created_at: string
          customer_id: string | null
          id: string
          is_approved: boolean
          product_id: string
          rating: number
          store_id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          author_name?: string
          body?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          is_approved?: boolean
          product_id: string
          rating: number
          store_id: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          author_name?: string
          body?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          is_approved?: boolean
          product_id?: string
          rating?: number
          store_id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      product_shipping: {
        Row: {
          actual_height: number | null
          actual_length: number | null
          actual_width: number | null
          base_unit: string | null
          base_unit_qty: number | null
          cartons: number | null
          created_at: string
          flat_rate_charge: number | null
          id: string
          product_id: string
          requires_packaging: boolean | null
          selling_unit: string | null
          shipping_category: string | null
          shipping_cubic: number | null
          shipping_height: number | null
          shipping_length: number | null
          shipping_weight: number | null
          shipping_width: number | null
          store_id: string
          updated_at: string
        }
        Insert: {
          actual_height?: number | null
          actual_length?: number | null
          actual_width?: number | null
          base_unit?: string | null
          base_unit_qty?: number | null
          cartons?: number | null
          created_at?: string
          flat_rate_charge?: number | null
          id?: string
          product_id: string
          requires_packaging?: boolean | null
          selling_unit?: string | null
          shipping_category?: string | null
          shipping_cubic?: number | null
          shipping_height?: number | null
          shipping_length?: number | null
          shipping_weight?: number | null
          shipping_width?: number | null
          store_id: string
          updated_at?: string
        }
        Update: {
          actual_height?: number | null
          actual_length?: number | null
          actual_width?: number | null
          base_unit?: string | null
          base_unit_qty?: number | null
          cartons?: number | null
          created_at?: string
          flat_rate_charge?: number | null
          id?: string
          product_id?: string
          requires_packaging?: boolean | null
          selling_unit?: string | null
          shipping_category?: string | null
          shipping_cubic?: number | null
          shipping_height?: number | null
          shipping_length?: number | null
          shipping_weight?: number | null
          shipping_width?: number | null
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_shipping_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_shipping_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      product_specifics: {
        Row: {
          created_at: string
          id: string
          name: string
          product_id: string
          sort_order: number | null
          store_id: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          product_id: string
          sort_order?: number | null
          store_id: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          product_id?: string
          sort_order?: number | null
          store_id?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_specifics_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_specifics_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          created_at: string
          id: string
          name: string
          option1: string | null
          option2: string | null
          option3: string | null
          price: number
          product_id: string
          sku: string | null
          stock: number
          store_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          option1?: string | null
          option2?: string | null
          option3?: string | null
          price?: number
          product_id: string
          sku?: string | null
          stock?: number
          store_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          option1?: string | null
          option2?: string | null
          option3?: string | null
          price?: number
          product_id?: string
          sku?: string | null
          stock?: number
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          auto_url_update: boolean | null
          availability_description: string | null
          barcode: string | null
          brand: string | null
          category_id: string | null
          compare_at_price: number | null
          cost_price: number | null
          created_at: string
          custom_label: string | null
          description: string | null
          editable_bundle: boolean | null
          features: string | null
          id: string
          images: string[] | null
          internal_notes: string | null
          is_active: boolean | null
          is_approved: boolean | null
          is_bought: boolean | null
          is_inventoried: boolean | null
          is_kit: boolean | null
          is_sold: boolean | null
          misc1: string | null
          misc2: string | null
          misc3: string | null
          misc4: string | null
          misc5: string | null
          model_number: string | null
          preorder_quantity: number | null
          price: number
          product_subtype: string | null
          product_type: string | null
          promo_end: string | null
          promo_price: number | null
          promo_start: string | null
          promo_tag: string | null
          reorder_quantity: number | null
          restock_quantity: number | null
          search_keywords: string | null
          seo_description: string | null
          seo_keywords: string | null
          seo_title: string | null
          short_description: string | null
          sku: string | null
          slug: string | null
          specifications: string | null
          status: string
          store_id: string
          subtitle: string | null
          supplier_item_code: string | null
          tags: string[] | null
          tax_free: boolean | null
          tax_inclusive: boolean | null
          terms_conditions: string | null
          title: string
          track_inventory: boolean
          updated_at: string
          virtual_product: boolean | null
          warranty: string | null
        }
        Insert: {
          auto_url_update?: boolean | null
          availability_description?: string | null
          barcode?: string | null
          brand?: string | null
          category_id?: string | null
          compare_at_price?: number | null
          cost_price?: number | null
          created_at?: string
          custom_label?: string | null
          description?: string | null
          editable_bundle?: boolean | null
          features?: string | null
          id?: string
          images?: string[] | null
          internal_notes?: string | null
          is_active?: boolean | null
          is_approved?: boolean | null
          is_bought?: boolean | null
          is_inventoried?: boolean | null
          is_kit?: boolean | null
          is_sold?: boolean | null
          misc1?: string | null
          misc2?: string | null
          misc3?: string | null
          misc4?: string | null
          misc5?: string | null
          model_number?: string | null
          preorder_quantity?: number | null
          price?: number
          product_subtype?: string | null
          product_type?: string | null
          promo_end?: string | null
          promo_price?: number | null
          promo_start?: string | null
          promo_tag?: string | null
          reorder_quantity?: number | null
          restock_quantity?: number | null
          search_keywords?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          short_description?: string | null
          sku?: string | null
          slug?: string | null
          specifications?: string | null
          status?: string
          store_id: string
          subtitle?: string | null
          supplier_item_code?: string | null
          tags?: string[] | null
          tax_free?: boolean | null
          tax_inclusive?: boolean | null
          terms_conditions?: string | null
          title: string
          track_inventory?: boolean
          updated_at?: string
          virtual_product?: boolean | null
          warranty?: string | null
        }
        Update: {
          auto_url_update?: boolean | null
          availability_description?: string | null
          barcode?: string | null
          brand?: string | null
          category_id?: string | null
          compare_at_price?: number | null
          cost_price?: number | null
          created_at?: string
          custom_label?: string | null
          description?: string | null
          editable_bundle?: boolean | null
          features?: string | null
          id?: string
          images?: string[] | null
          internal_notes?: string | null
          is_active?: boolean | null
          is_approved?: boolean | null
          is_bought?: boolean | null
          is_inventoried?: boolean | null
          is_kit?: boolean | null
          is_sold?: boolean | null
          misc1?: string | null
          misc2?: string | null
          misc3?: string | null
          misc4?: string | null
          misc5?: string | null
          model_number?: string | null
          preorder_quantity?: number | null
          price?: number
          product_subtype?: string | null
          product_type?: string | null
          promo_end?: string | null
          promo_price?: number | null
          promo_start?: string | null
          promo_tag?: string | null
          reorder_quantity?: number | null
          restock_quantity?: number | null
          search_keywords?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          short_description?: string | null
          sku?: string | null
          slug?: string | null
          specifications?: string | null
          status?: string
          store_id?: string
          subtitle?: string | null
          supplier_item_code?: string | null
          tags?: string[] | null
          tax_free?: boolean | null
          tax_inclusive?: boolean | null
          terms_conditions?: string | null
          title?: string
          track_inventory?: boolean
          updated_at?: string
          virtual_product?: boolean | null
          warranty?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      purchase_order_items: {
        Row: {
          id: string
          product_id: string | null
          purchase_order_id: string
          quantity_ordered: number
          quantity_received: number
          sku: string | null
          store_id: string
          title: string
          total: number
          unit_cost: number
          variant_id: string | null
        }
        Insert: {
          id?: string
          product_id?: string | null
          purchase_order_id: string
          quantity_ordered?: number
          quantity_received?: number
          sku?: string | null
          store_id: string
          title: string
          total?: number
          unit_cost?: number
          variant_id?: string | null
        }
        Update: {
          id?: string
          product_id?: string | null
          purchase_order_id?: string
          quantity_ordered?: number
          quantity_received?: number
          sku?: string | null
          store_id?: string
          title?: string
          total?: number
          unit_cost?: number
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          created_at: string
          created_by: string | null
          expected_date: string | null
          id: string
          notes: string | null
          po_number: string
          received_date: string | null
          shipping: number
          status: string
          store_id: string
          subtotal: number
          supplier_id: string | null
          tax: number
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expected_date?: string | null
          id?: string
          notes?: string | null
          po_number: string
          received_date?: string | null
          shipping?: number
          status?: string
          store_id: string
          subtotal?: number
          supplier_id?: string | null
          tax?: number
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expected_date?: string | null
          id?: string
          notes?: string | null
          po_number?: string
          received_date?: string | null
          shipping?: number
          status?: string
          store_id?: string
          subtotal?: number
          supplier_id?: string | null
          tax?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      returns: {
        Row: {
          admin_notes: string | null
          created_at: string
          customer_id: string | null
          id: string
          notes: string | null
          order_id: string
          reason: string
          refund_amount: number
          status: string
          store_id: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          notes?: string | null
          order_id: string
          reason: string
          refund_amount?: number
          status?: string
          store_id: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          reason?: string
          refund_amount?: number
          status?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "returns_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returns_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returns_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      shipment_items: {
        Row: {
          id: string
          order_item_id: string
          quantity: number
          shipment_id: string
          store_id: string
        }
        Insert: {
          id?: string
          order_item_id: string
          quantity?: number
          shipment_id: string
          store_id: string
        }
        Update: {
          id?: string
          order_item_id?: string
          quantity?: number
          shipment_id?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipment_items_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipment_items_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "order_shipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipment_items_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_zones: {
        Row: {
          created_at: string
          flat_rate: number
          free_above: number | null
          id: string
          name: string
          regions: string
          store_id: string
        }
        Insert: {
          created_at?: string
          flat_rate?: number
          free_above?: number | null
          id?: string
          name: string
          regions: string
          store_id: string
        }
        Update: {
          created_at?: string
          flat_rate?: number
          free_above?: number | null
          id?: string
          name?: string
          regions?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipping_zones_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_adjustments: {
        Row: {
          adjusted_by: string
          created_at: string
          id: string
          inventory_stock_id: string
          quantity_change: number
          reason: string | null
          store_id: string
        }
        Insert: {
          adjusted_by: string
          created_at?: string
          id?: string
          inventory_stock_id: string
          quantity_change: number
          reason?: string | null
          store_id: string
        }
        Update: {
          adjusted_by?: string
          created_at?: string
          id?: string
          inventory_stock_id?: string
          quantity_change?: number
          reason?: string | null
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_adjustments_inventory_stock_id_fkey"
            columns: ["inventory_stock_id"]
            isOneToOne: false
            referencedRelation: "inventory_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_adjustments_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_templates: {
        Row: {
          content: string
          context_type: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          slug: string
          store_id: string
          template_type: string
          updated_at: string
        }
        Insert: {
          content?: string
          context_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          slug?: string
          store_id: string
          template_type?: string
          updated_at?: string
        }
        Update: {
          content?: string
          context_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          store_id?: string
          template_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_templates_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_themes: {
        Row: {
          accent_color: string | null
          background_color: string | null
          body_font: string | null
          button_radius: string | null
          created_at: string
          custom_css: string | null
          footer_style: string | null
          heading_font: string | null
          hero_style: string | null
          id: string
          layout_style: string | null
          primary_color: string | null
          product_card_style: string | null
          secondary_color: string | null
          store_id: string
          text_color: string | null
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          background_color?: string | null
          body_font?: string | null
          button_radius?: string | null
          created_at?: string
          custom_css?: string | null
          footer_style?: string | null
          heading_font?: string | null
          hero_style?: string | null
          id?: string
          layout_style?: string | null
          primary_color?: string | null
          product_card_style?: string | null
          secondary_color?: string | null
          store_id: string
          text_color?: string | null
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          background_color?: string | null
          body_font?: string | null
          button_radius?: string | null
          created_at?: string
          custom_css?: string | null
          footer_style?: string | null
          heading_font?: string | null
          hero_style?: string | null
          id?: string
          layout_style?: string | null
          primary_color?: string | null
          product_card_style?: string | null
          secondary_color?: string | null
          store_id?: string
          text_color?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_themes_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          banner_text: string | null
          contact_email: string | null
          created_at: string
          currency: string
          description: string | null
          id: string
          logo_url: string | null
          name: string
          owner_id: string
          primary_color: string | null
          slug: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          banner_text?: string | null
          contact_email?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          owner_id: string
          primary_color?: string | null
          slug?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          banner_text?: string | null
          contact_email?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string
          primary_color?: string | null
          slug?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          address: string | null
          contact_name: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          is_dropship: boolean | null
          lead_time_days: number | null
          name: string
          notes: string | null
          payment_terms: string | null
          phone: string | null
          store_id: string
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_dropship?: boolean | null
          lead_time_days?: number | null
          name: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          store_id: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_dropship?: boolean | null
          lead_time_days?: number | null
          name?: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          store_id?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_rates: {
        Row: {
          created_at: string
          id: string
          name: string
          rate: number
          region: string
          store_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          rate?: number
          region: string
          store_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          rate?: number
          region?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_rates_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          store_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          store_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          store_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlists: {
        Row: {
          created_at: string
          id: string
          product_id: string
          store_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          store_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          store_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlists_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_store_ids: { Args: { _user_id: string }; Returns: string[] }
      has_store_role: {
        Args: {
          _role?: Database["public"]["Enums"]["app_role"]
          _store_id: string
          _user_id: string
        }
        Returns: boolean
      }
      is_customer_owner: {
        Args: { _customer_id: string; _user_id: string }
        Returns: boolean
      }
      is_platform_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "owner" | "admin" | "staff"
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
      app_role: ["owner", "admin", "staff"],
    },
  },
} as const
