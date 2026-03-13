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
      adverts: {
        Row: {
          advert_type: string
          button_text: string | null
          created_at: string
          ends_at: string | null
          html_content: string | null
          id: string
          image_url: string | null
          is_active: boolean
          link_url: string | null
          name: string
          placement: string
          sort_order: number
          starts_at: string | null
          store_id: string
          subtitle: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          advert_type?: string
          button_text?: string | null
          created_at?: string
          ends_at?: string | null
          html_content?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_url?: string | null
          name: string
          placement?: string
          sort_order?: number
          starts_at?: string | null
          store_id: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          advert_type?: string
          button_text?: string | null
          created_at?: string
          ends_at?: string | null
          html_content?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_url?: string | null
          name?: string
          placement?: string
          sort_order?: number
          starts_at?: string | null
          store_id?: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "adverts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          is_active: boolean
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          scopes: string[]
          store_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          scopes?: string[]
          store_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          scopes?: string[]
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      back_in_stock_requests: {
        Row: {
          created_at: string
          email: string
          id: string
          notified_at: string | null
          product_id: string
          store_id: string
          user_id: string | null
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          notified_at?: string | null
          product_id: string
          store_id: string
          user_id?: string | null
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          notified_at?: string | null
          product_id?: string
          store_id?: string
          user_id?: string | null
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "back_in_stock_requests_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "back_in_stock_requests_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "back_in_stock_requests_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      backorders: {
        Row: {
          created_at: string
          customer_id: string | null
          expected_date: string | null
          fulfilled_at: string | null
          id: string
          notes: string | null
          order_id: string | null
          product_id: string
          quantity: number
          status: string
          store_id: string
          updated_at: string
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          expected_date?: string | null
          fulfilled_at?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          product_id: string
          quantity?: number
          status?: string
          store_id: string
          updated_at?: string
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          expected_date?: string | null
          fulfilled_at?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          product_id?: string
          quantity?: number
          status?: string
          store_id?: string
          updated_at?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "backorders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "backorders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "backorders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "backorders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "backorders_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
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
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          is_read: boolean
          message: string
          name: string
          store_id: string
          subject: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_read?: boolean
          message: string
          name: string
          store_id: string
          subject?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean
          message?: string
          name?: string
          store_id?: string
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_submissions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      content_blocks: {
        Row: {
          block_type: string
          content: string
          created_at: string
          id: string
          identifier: string
          is_active: boolean
          name: string
          placement: string | null
          sort_order: number | null
          store_id: string
          updated_at: string
        }
        Insert: {
          block_type?: string
          content?: string
          created_at?: string
          id?: string
          identifier: string
          is_active?: boolean
          name: string
          placement?: string | null
          sort_order?: number | null
          store_id: string
          updated_at?: string
        }
        Update: {
          block_type?: string
          content?: string
          created_at?: string
          id?: string
          identifier?: string
          is_active?: boolean
          name?: string
          placement?: string | null
          sort_order?: number | null
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_blocks_store_id_fkey"
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
      content_reviews: {
        Row: {
          author_name: string
          body: string | null
          content_page_id: string
          created_at: string
          id: string
          is_approved: boolean
          rating: number
          store_id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          author_name?: string
          body?: string | null
          content_page_id: string
          created_at?: string
          id?: string
          is_approved?: boolean
          rating?: number
          store_id: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          author_name?: string
          body?: string | null
          content_page_id?: string
          created_at?: string
          id?: string
          is_approved?: boolean
          rating?: number
          store_id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_reviews_content_page_id_fkey"
            columns: ["content_page_id"]
            isOneToOne: false
            referencedRelation: "content_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_reviews_store_id_fkey"
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
      credit_notes: {
        Row: {
          amount: number
          created_at: string
          credit_number: string
          id: string
          issued_by: string | null
          notes: string | null
          order_id: string
          reason: string | null
          status: string
          store_id: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          credit_number: string
          id?: string
          issued_by?: string | null
          notes?: string | null
          order_id: string
          reason?: string | null
          status?: string
          store_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          credit_number?: string
          id?: string
          issued_by?: string | null
          notes?: string | null
          order_id?: string
          reason?: string | null
          status?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_notes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_notes_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_files: {
        Row: {
          created_at: string
          customer_id: string
          description: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          store_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          customer_id: string
          description?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          store_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          description?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          store_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_files_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_files_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_groups: {
        Row: {
          created_at: string
          description: string | null
          discount_percent: number | null
          id: string
          is_tax_exempt: boolean | null
          min_order_amount: number | null
          name: string
          store_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          discount_percent?: number | null
          id?: string
          is_tax_exempt?: boolean | null
          min_order_amount?: number | null
          name: string
          store_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          discount_percent?: number | null
          id?: string
          is_tax_exempt?: boolean | null
          min_order_amount?: number | null
          name?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_groups_store_id_fkey"
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
          customer_group_id: string | null
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
          customer_group_id?: string | null
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
          customer_group_id?: string | null
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
            foreignKeyName: "customers_customer_group_id_fkey"
            columns: ["customer_group_id"]
            isOneToOne: false
            referencedRelation: "customer_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      email_queue: {
        Row: {
          created_at: string
          error: string | null
          html_body: string
          id: string
          sent_at: string | null
          status: string
          store_id: string
          subject: string
          template_key: string | null
          to_email: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          html_body: string
          id?: string
          sent_at?: string | null
          status?: string
          store_id: string
          subject: string
          template_key?: string | null
          to_email: string
        }
        Update: {
          created_at?: string
          error?: string | null
          html_body?: string
          id?: string
          sent_at?: string | null
          status?: string
          store_id?: string
          subject?: string
          template_key?: string | null
          to_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_queue_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          created_at: string
          html_body: string
          id: string
          is_active: boolean
          name: string
          store_id: string
          subject: string
          template_key: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          html_body?: string
          id?: string
          is_active?: boolean
          name: string
          store_id: string
          subject?: string
          template_key: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          html_body?: string
          id?: string
          is_active?: boolean
          name?: string
          store_id?: string
          subject?: string
          template_key?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_store_id_fkey"
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
          batch_number: string | null
          bin_location: string | null
          created_at: string
          expiry_date: string | null
          id: string
          location_id: string
          lot_number: string | null
          low_stock_threshold: number
          product_id: string
          quantity: number
          store_id: string
          updated_at: string
          variant_id: string | null
        }
        Insert: {
          batch_number?: string | null
          bin_location?: string | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          location_id: string
          lot_number?: string | null
          low_stock_threshold?: number
          product_id: string
          quantity?: number
          store_id: string
          updated_at?: string
          variant_id?: string | null
        }
        Update: {
          batch_number?: string | null
          bin_location?: string | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          location_id?: string
          lot_number?: string | null
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
      kit_components: {
        Row: {
          component_product_id: string
          created_at: string
          id: string
          is_optional: boolean
          is_swappable: boolean
          kit_product_id: string
          quantity: number
          sort_order: number
          store_id: string
          swap_group: string | null
        }
        Insert: {
          component_product_id: string
          created_at?: string
          id?: string
          is_optional?: boolean
          is_swappable?: boolean
          kit_product_id: string
          quantity?: number
          sort_order?: number
          store_id: string
          swap_group?: string | null
        }
        Update: {
          component_product_id?: string
          created_at?: string
          id?: string
          is_optional?: boolean
          is_swappable?: boolean
          kit_product_id?: string
          quantity?: number
          sort_order?: number
          store_id?: string
          swap_group?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kit_components_component_product_id_fkey"
            columns: ["component_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kit_components_kit_product_id_fkey"
            columns: ["kit_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kit_components_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      layby_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          layby_plan_id: string
          notes: string | null
          payment_method: string
          store_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          layby_plan_id: string
          notes?: string | null
          payment_method?: string
          store_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          layby_plan_id?: string
          notes?: string | null
          payment_method?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "layby_payments_layby_plan_id_fkey"
            columns: ["layby_plan_id"]
            isOneToOne: false
            referencedRelation: "layby_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "layby_payments_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      layby_plans: {
        Row: {
          amount_paid: number
          cancelled_at: string | null
          completed_at: string | null
          created_at: string
          customer_id: string
          deposit_amount: number
          frequency: string
          id: string
          installment_amount: number
          installments_count: number
          installments_paid: number
          next_due_date: string | null
          order_id: string
          status: string
          store_id: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          amount_paid?: number
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          customer_id: string
          deposit_amount?: number
          frequency?: string
          id?: string
          installment_amount?: number
          installments_count?: number
          installments_paid?: number
          next_due_date?: string | null
          order_id: string
          status?: string
          store_id: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          amount_paid?: number
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          customer_id?: string
          deposit_amount?: number
          frequency?: string
          id?: string
          installment_amount?: number
          installments_count?: number
          installments_paid?: number
          next_due_date?: string | null
          order_id?: string
          status?: string
          store_id?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "layby_plans_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "layby_plans_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "layby_plans_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
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
      media_assets: {
        Row: {
          alt_text: string | null
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          folder: string | null
          height: number | null
          id: string
          store_id: string
          updated_at: string
          uploaded_by: string | null
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          folder?: string | null
          height?: number | null
          id?: string
          store_id: string
          updated_at?: string
          uploaded_by?: string | null
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          folder?: string | null
          height?: number | null
          id?: string
          store_id?: string
          updated_at?: string
          uploaded_by?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_assets_store_id_fkey"
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
      order_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          notes: string | null
          order_id: string
          payment_method: string
          recorded_by: string
          reference: string | null
          store_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          order_id: string
          payment_method?: string
          recorded_by: string
          reference?: string | null
          store_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string
          payment_method?: string
          recorded_by?: string
          reference?: string | null
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_payments_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      order_quote_items: {
        Row: {
          id: string
          product_id: string | null
          quantity: number
          quote_id: string
          sku: string | null
          store_id: string
          title: string
          total: number
          unit_price: number
          variant_id: string | null
        }
        Insert: {
          id?: string
          product_id?: string | null
          quantity?: number
          quote_id: string
          sku?: string | null
          store_id: string
          title: string
          total?: number
          unit_price?: number
          variant_id?: string | null
        }
        Update: {
          id?: string
          product_id?: string | null
          quantity?: number
          quote_id?: string
          sku?: string | null
          store_id?: string
          title?: string
          total?: number
          unit_price?: number
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_quote_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "order_quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_quote_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_quotes: {
        Row: {
          approved_at: string | null
          converted_order_id: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          discount: number
          id: string
          notes: string | null
          quote_number: string
          shipping: number
          status: string
          store_id: string
          subtotal: number
          tax: number
          total: number
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          approved_at?: string | null
          converted_order_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          discount?: number
          id?: string
          notes?: string | null
          quote_number: string
          shipping?: number
          status?: string
          store_id: string
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          approved_at?: string | null
          converted_order_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          discount?: number
          id?: string
          notes?: string | null
          quote_number?: string
          shipping?: number
          status?: string
          store_id?: string
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_quotes_converted_order_id_fkey"
            columns: ["converted_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_quotes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_quotes_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      order_refunds: {
        Row: {
          amount: number
          created_at: string
          id: string
          order_id: string
          reason: string | null
          refunded_by: string | null
          status: string
          store_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          order_id: string
          reason?: string | null
          refunded_by?: string | null
          status?: string
          store_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          order_id?: string
          reason?: string | null
          refunded_by?: string | null
          status?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_refunds_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_refunds_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
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
          billing_address: string | null
          coupon_id: string | null
          created_at: string
          customer_id: string | null
          discount: number
          fulfillment_status: string
          id: string
          items_count: number
          notes: string | null
          order_channel: string
          order_number: string
          payment_status: string
          shipping: number
          shipping_address: string | null
          status: string
          store_id: string
          subtotal: number
          tags: string[] | null
          tax: number
          total: number
          updated_at: string
        }
        Insert: {
          billing_address?: string | null
          coupon_id?: string | null
          created_at?: string
          customer_id?: string | null
          discount?: number
          fulfillment_status?: string
          id?: string
          items_count?: number
          notes?: string | null
          order_channel?: string
          order_number: string
          payment_status?: string
          shipping?: number
          shipping_address?: string | null
          status?: string
          store_id: string
          subtotal?: number
          tags?: string[] | null
          tax?: number
          total?: number
          updated_at?: string
        }
        Update: {
          billing_address?: string | null
          coupon_id?: string | null
          created_at?: string
          customer_id?: string | null
          discount?: number
          fulfillment_status?: string
          id?: string
          items_count?: number
          notes?: string | null
          order_channel?: string
          order_number?: string
          payment_status?: string
          shipping?: number
          shipping_address?: string | null
          status?: string
          store_id?: string
          subtotal?: number
          tags?: string[] | null
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
      payment_gateways: {
        Row: {
          config: Json
          created_at: string
          display_name: string
          gateway_type: string
          id: string
          is_enabled: boolean
          is_test_mode: boolean
          sort_order: number
          store_id: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          display_name: string
          gateway_type: string
          id?: string
          is_enabled?: boolean
          is_test_mode?: boolean
          sort_order?: number
          store_id: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          display_name?: string
          gateway_type?: string
          id?: string
          is_enabled?: boolean
          is_test_mode?: boolean
          sort_order?: number
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_gateways_store_id_fkey"
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
      product_addons: {
        Row: {
          created_at: string
          field_type: string
          id: string
          is_required: boolean | null
          name: string
          options: Json | null
          price_adjustment: number | null
          product_id: string
          sort_order: number | null
          store_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          field_type?: string
          id?: string
          is_required?: boolean | null
          name: string
          options?: Json | null
          price_adjustment?: number | null
          product_id: string
          sort_order?: number | null
          store_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          field_type?: string
          id?: string
          is_required?: boolean | null
          name?: string
          options?: Json | null
          price_adjustment?: number | null
          product_id?: string
          sort_order?: number | null
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_addons_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_addons_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
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
          admin_reply: string | null
          admin_reply_at: string | null
          author_name: string
          body: string | null
          created_at: string
          customer_id: string | null
          id: string
          is_approved: boolean
          product_id: string
          rating: number
          review_photos: string[] | null
          store_id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_reply?: string | null
          admin_reply_at?: string | null
          author_name?: string
          body?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          is_approved?: boolean
          product_id: string
          rating: number
          review_photos?: string[] | null
          store_id: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_reply?: string | null
          admin_reply_at?: string | null
          author_name?: string
          body?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          is_approved?: boolean
          product_id?: string
          rating?: number
          review_photos?: string[] | null
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
          dangerous_goods: boolean | null
          flat_rate_charge: number | null
          free_shipping: boolean | null
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
          dangerous_goods?: boolean | null
          flat_rate_charge?: number | null
          free_shipping?: boolean | null
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
          dangerous_goods?: boolean | null
          flat_rate_charge?: number | null
          free_shipping?: boolean | null
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
          poa: boolean | null
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
          visibility_groups: string[] | null
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
          poa?: boolean | null
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
          visibility_groups?: string[] | null
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
          poa?: boolean | null
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
          visibility_groups?: string[] | null
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
      redirects: {
        Row: {
          created_at: string
          from_path: string
          hit_count: number
          id: string
          is_active: boolean
          store_id: string
          to_path: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          from_path: string
          hit_count?: number
          id?: string
          is_active?: boolean
          store_id: string
          to_path: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          from_path?: string
          hit_count?: number
          id?: string
          is_active?: boolean
          store_id?: string
          to_path?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "redirects_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
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
      role_permissions: {
        Row: {
          can_create: boolean
          can_delete: boolean
          can_edit: boolean
          can_view: boolean
          created_at: string
          id: string
          resource: string
          role: string
          store_id: string
          updated_at: string
        }
        Insert: {
          can_create?: boolean
          can_delete?: boolean
          can_edit?: boolean
          can_view?: boolean
          created_at?: string
          id?: string
          resource: string
          role: string
          store_id: string
          updated_at?: string
        }
        Update: {
          can_create?: boolean
          can_delete?: boolean
          can_edit?: boolean
          can_view?: boolean
          created_at?: string
          id?: string
          resource?: string
          role?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      serial_numbers: {
        Row: {
          created_at: string
          id: string
          location_id: string | null
          notes: string | null
          order_id: string | null
          product_id: string
          serial_number: string
          status: string
          store_id: string
          updated_at: string
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          location_id?: string | null
          notes?: string | null
          order_id?: string | null
          product_id: string
          serial_number: string
          status?: string
          store_id: string
          updated_at?: string
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          location_id?: string | null
          notes?: string | null
          order_id?: string | null
          product_id?: string
          serial_number?: string
          status?: string
          store_id?: string
          updated_at?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "serial_numbers_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "inventory_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serial_numbers_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serial_numbers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serial_numbers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serial_numbers_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
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
          per_kg_rate: number | null
          rate_type: string
          regions: string
          store_id: string
        }
        Insert: {
          created_at?: string
          flat_rate?: number
          free_above?: number | null
          id?: string
          name: string
          per_kg_rate?: number | null
          rate_type?: string
          regions: string
          store_id: string
        }
        Update: {
          created_at?: string
          flat_rate?: number
          free_above?: number | null
          id?: string
          name?: string
          per_kg_rate?: number | null
          rate_type?: string
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
      stocktake_items: {
        Row: {
          counted_at: string | null
          counted_by: string | null
          counted_quantity: number | null
          expected_quantity: number
          id: string
          product_id: string
          stocktake_id: string
          store_id: string
          variant_id: string | null
        }
        Insert: {
          counted_at?: string | null
          counted_by?: string | null
          counted_quantity?: number | null
          expected_quantity?: number
          id?: string
          product_id: string
          stocktake_id: string
          store_id: string
          variant_id?: string | null
        }
        Update: {
          counted_at?: string | null
          counted_by?: string | null
          counted_quantity?: number | null
          expected_quantity?: number
          id?: string
          product_id?: string
          stocktake_id?: string
          store_id?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stocktake_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stocktake_items_stocktake_id_fkey"
            columns: ["stocktake_id"]
            isOneToOne: false
            referencedRelation: "stocktakes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stocktake_items_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stocktake_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      stocktakes: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string
          id: string
          name: string
          notes: string | null
          started_at: string
          status: string
          store_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by: string
          id?: string
          name?: string
          notes?: string | null
          started_at?: string
          status?: string
          store_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          notes?: string | null
          started_at?: string
          status?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stocktakes_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_credit_transactions: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          customer_id: string
          description: string | null
          id: string
          order_id: string | null
          store_id: string
          type: string
        }
        Insert: {
          amount?: number
          created_at?: string
          created_by?: string | null
          customer_id: string
          description?: string | null
          id?: string
          order_id?: string | null
          store_id: string
          type?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          customer_id?: string
          description?: string | null
          id?: string
          order_id?: string | null
          store_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_credit_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_credit_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_credit_transactions_store_id_fkey"
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
          banner_end: string | null
          banner_start: string | null
          banner_text: string | null
          contact_email: string | null
          created_at: string
          currency: string
          currency_decimal_places: number | null
          currency_symbol_position: string | null
          default_low_stock_threshold: number | null
          description: string | null
          favicon_url: string | null
          fb_pixel_id: string | null
          ga_tracking_id: string | null
          google_ads_conversion_label: string | null
          google_ads_id: string | null
          gtm_container_id: string | null
          guest_checkout_enabled: boolean
          id: string
          is_suspended: boolean
          logo_url: string | null
          min_order_amount: number
          name: string
          notification_prefs: Json | null
          owner_id: string
          plan: string
          plan_limits: Json
          primary_color: string | null
          seo_description_global: string | null
          seo_title_global: string | null
          slug: string | null
          smtp_config: Json | null
          social_links: Json | null
          subscription_tier: string
          suspended_reason: string | null
          tax_mode: string
          timezone: string
          updated_at: string
        }
        Insert: {
          banner_end?: string | null
          banner_start?: string | null
          banner_text?: string | null
          contact_email?: string | null
          created_at?: string
          currency?: string
          currency_decimal_places?: number | null
          currency_symbol_position?: string | null
          default_low_stock_threshold?: number | null
          description?: string | null
          favicon_url?: string | null
          fb_pixel_id?: string | null
          ga_tracking_id?: string | null
          google_ads_conversion_label?: string | null
          google_ads_id?: string | null
          gtm_container_id?: string | null
          guest_checkout_enabled?: boolean
          id?: string
          is_suspended?: boolean
          logo_url?: string | null
          min_order_amount?: number
          name: string
          notification_prefs?: Json | null
          owner_id: string
          plan?: string
          plan_limits?: Json
          primary_color?: string | null
          seo_description_global?: string | null
          seo_title_global?: string | null
          slug?: string | null
          smtp_config?: Json | null
          social_links?: Json | null
          subscription_tier?: string
          suspended_reason?: string | null
          tax_mode?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          banner_end?: string | null
          banner_start?: string | null
          banner_text?: string | null
          contact_email?: string | null
          created_at?: string
          currency?: string
          currency_decimal_places?: number | null
          currency_symbol_position?: string | null
          default_low_stock_threshold?: number | null
          description?: string | null
          favicon_url?: string | null
          fb_pixel_id?: string | null
          ga_tracking_id?: string | null
          google_ads_conversion_label?: string | null
          google_ads_id?: string | null
          gtm_container_id?: string | null
          guest_checkout_enabled?: boolean
          id?: string
          is_suspended?: boolean
          logo_url?: string | null
          min_order_amount?: number
          name?: string
          notification_prefs?: Json | null
          owner_id?: string
          plan?: string
          plan_limits?: Json
          primary_color?: string | null
          seo_description_global?: string | null
          seo_title_global?: string | null
          slug?: string | null
          smtp_config?: Json | null
          social_links?: Json | null
          subscription_tier?: string
          suspended_reason?: string | null
          tax_mode?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      supplier_products: {
        Row: {
          created_at: string
          id: string
          is_preferred: boolean | null
          product_id: string
          store_id: string
          supplier_cost: number | null
          supplier_id: string
          supplier_sku: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_preferred?: boolean | null
          product_id: string
          store_id: string
          supplier_cost?: number | null
          supplier_id: string
          supplier_sku?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_preferred?: boolean | null
          product_id?: string
          store_id?: string
          supplier_cost?: number | null
          supplier_id?: string
          supplier_sku?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
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
      warranty_disputes: {
        Row: {
          admin_notes: string | null
          created_at: string
          customer_id: string | null
          description: string | null
          dispute_type: string
          id: string
          order_id: string | null
          product_id: string | null
          reason: string
          resolution: string | null
          resolved_at: string | null
          status: string
          store_id: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          customer_id?: string | null
          description?: string | null
          dispute_type?: string
          id?: string
          order_id?: string | null
          product_id?: string | null
          reason?: string
          resolution?: string | null
          resolved_at?: string | null
          status?: string
          store_id: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          customer_id?: string | null
          description?: string | null
          dispute_type?: string
          id?: string
          order_id?: string | null
          product_id?: string | null
          reason?: string
          resolution?: string | null
          resolved_at?: string | null
          status?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "warranty_disputes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warranty_disputes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warranty_disputes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warranty_disputes_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          created_at: string
          events: string[]
          id: string
          is_active: boolean
          last_status: number | null
          last_triggered_at: string | null
          name: string
          secret: string | null
          store_id: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          events?: string[]
          id?: string
          is_active?: boolean
          last_status?: number | null
          last_triggered_at?: string | null
          name?: string
          secret?: string | null
          store_id: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          events?: string[]
          id?: string
          is_active?: boolean
          last_status?: number | null
          last_triggered_at?: string | null
          name?: string
          secret?: string | null
          store_id?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      wholesale_applications: {
        Row: {
          abn_tax_id: string | null
          business_name: string
          contact_name: string
          created_at: string
          email: string
          id: string
          message: string | null
          phone: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          store_id: string
        }
        Insert: {
          abn_tax_id?: string | null
          business_name: string
          contact_name: string
          created_at?: string
          email: string
          id?: string
          message?: string | null
          phone?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          store_id: string
        }
        Update: {
          abn_tax_id?: string | null
          business_name?: string
          contact_name?: string
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          phone?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wholesale_applications_store_id_fkey"
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
