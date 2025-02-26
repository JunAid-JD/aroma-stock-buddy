export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      finished_products: {
        Row: {
          created_at: string | null
          id: string
          name: string
          quantity_in_stock: number
          reorder_point: number
          required_packaging: Json | null
          sku: string
          total_value: number | null
          type: Database["public"]["Enums"]["material_type"]
          unit_price: number
          updated_at: string | null
          volume_config: Database["public"]["Enums"]["product_volume_config"]
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          quantity_in_stock?: number
          reorder_point?: number
          required_packaging?: Json | null
          sku: string
          total_value?: number | null
          type: Database["public"]["Enums"]["material_type"]
          unit_price?: number
          updated_at?: string | null
          volume_config?: Database["public"]["Enums"]["product_volume_config"]
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          quantity_in_stock?: number
          reorder_point?: number
          required_packaging?: Json | null
          sku?: string
          total_value?: number | null
          type?: Database["public"]["Enums"]["material_type"]
          unit_price?: number
          updated_at?: string | null
          volume_config?: Database["public"]["Enums"]["product_volume_config"]
        }
        Relationships: []
      }
      loss_records: {
        Row: {
          cost_impact: number | null
          created_at: string | null
          date: string | null
          id: string
          item_id: string
          item_type: Database["public"]["Enums"]["product_category"]
          quantity: number
          reason: string
          updated_at: string | null
        }
        Insert: {
          cost_impact?: number | null
          created_at?: string | null
          date?: string | null
          id?: string
          item_id: string
          item_type: Database["public"]["Enums"]["product_category"]
          quantity: number
          reason: string
          updated_at?: string | null
        }
        Update: {
          cost_impact?: number | null
          created_at?: string | null
          date?: string | null
          id?: string
          item_id?: string
          item_type?: Database["public"]["Enums"]["product_category"]
          quantity?: number
          reason?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      packaging_items: {
        Row: {
          created_at: string | null
          id: string
          name: string
          quantity_in_stock: number
          reorder_point: number
          size: string
          sku: string
          total_value: number | null
          type: string
          unit_cost: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          quantity_in_stock?: number
          reorder_point?: number
          size: string
          sku: string
          total_value?: number | null
          type: string
          unit_cost?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          quantity_in_stock?: number
          reorder_point?: number
          size?: string
          sku?: string
          total_value?: number | null
          type?: string
          unit_cost?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      product_components: {
        Row: {
          component_type: Database["public"]["Enums"]["product_category"]
          created_at: string | null
          finished_product_id: string | null
          id: string
          packaging_item_id: string | null
          quantity_required: number
          raw_material_id: string | null
        }
        Insert: {
          component_type: Database["public"]["Enums"]["product_category"]
          created_at?: string | null
          finished_product_id?: string | null
          id?: string
          packaging_item_id?: string | null
          quantity_required: number
          raw_material_id?: string | null
        }
        Update: {
          component_type?: Database["public"]["Enums"]["product_category"]
          created_at?: string | null
          finished_product_id?: string | null
          id?: string
          packaging_item_id?: string | null
          quantity_required?: number
          raw_material_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_finished_product"
            columns: ["finished_product_id"]
            isOneToOne: false
            referencedRelation: "finished_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_packaging"
            columns: ["packaging_item_id"]
            isOneToOne: false
            referencedRelation: "packaging_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_raw_material"
            columns: ["raw_material_id"]
            isOneToOne: false
            referencedRelation: "raw_materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_components_finished_product_id_fkey"
            columns: ["finished_product_id"]
            isOneToOne: false
            referencedRelation: "finished_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_components_packaging_item_id_fkey"
            columns: ["packaging_item_id"]
            isOneToOne: false
            referencedRelation: "packaging_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_components_raw_material_id_fkey"
            columns: ["raw_material_id"]
            isOneToOne: false
            referencedRelation: "raw_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      product_configurations: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          required_packaging: Json
          updated_at: string | null
          volume_config: Database["public"]["Enums"]["product_volume_config"]
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          required_packaging: Json
          updated_at?: string | null
          volume_config: Database["public"]["Enums"]["product_volume_config"]
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          required_packaging?: Json
          updated_at?: string | null
          volume_config?: Database["public"]["Enums"]["product_volume_config"]
        }
        Relationships: []
      }
      production_batch_items: {
        Row: {
          batch_id: string
          created_at: string | null
          id: string
          item_id: string
          quantity: number
        }
        Insert: {
          batch_id: string
          created_at?: string | null
          id?: string
          item_id: string
          quantity?: number
        }
        Update: {
          batch_id?: string
          created_at?: string | null
          id?: string
          item_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "production_batch_items_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "production_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_batch_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "finished_products"
            referencedColumns: ["id"]
          },
        ]
      }
      production_batches: {
        Row: {
          batch_number: string | null
          created_at: string | null
          id: string
          notes: string | null
          product_id: string
          production_date: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          batch_number?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          product_id: string
          production_date?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          batch_number?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          product_id?: string
          production_date?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_finished_products_batch"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "finished_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_batches_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "finished_products"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_records: {
        Row: {
          created_at: string | null
          date: string | null
          id: string
          item_id: string
          item_type: Database["public"]["Enums"]["product_category"]
          quantity: number
          supplier: string
          total_cost: number
          unit_cost: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date?: string | null
          id?: string
          item_id: string
          item_type: Database["public"]["Enums"]["product_category"]
          quantity: number
          supplier: string
          total_cost: number
          unit_cost: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string | null
          id?: string
          item_id?: string
          item_type?: Database["public"]["Enums"]["product_category"]
          quantity?: number
          supplier?: string
          total_cost?: number
          unit_cost?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      raw_materials: {
        Row: {
          created_at: string | null
          id: string
          name: string
          quantity_in_stock: number
          reorder_point: number
          sku: string
          total_value: number | null
          type: Database["public"]["Enums"]["material_type"]
          unit: string
          unit_cost: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          quantity_in_stock?: number
          reorder_point?: number
          sku: string
          total_value?: number | null
          type: Database["public"]["Enums"]["material_type"]
          unit?: string
          unit_cost?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          quantity_in_stock?: number
          reorder_point?: number
          sku?: string
          total_value?: number | null
          type?: Database["public"]["Enums"]["material_type"]
          unit?: string
          unit_cost?: number
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_finished_product_cost: {
        Args: {
          p_finished_product_id: string
        }
        Returns: number
      }
    }
    Enums: {
      material_type: "essential_oil" | "carrier_oil"
      packaging_item_type:
        | "bottle"
        | "cap"
        | "dropper"
        | "inner_box"
        | "outer_box"
      product_category: "raw_material" | "packaging" | "finished_product"
      product_volume_config:
        | "essential_10ml"
        | "essential_30ml"
        | "carrier_30ml"
        | "carrier_70ml"
        | "carrier_140ml"
      volume_unit: "ml"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
