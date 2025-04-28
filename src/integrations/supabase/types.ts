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
          required_packaging: Json | null
          sku: string
          total_value: number | null
          unit_price: number
          updated_at: string | null
          volume_config: Database["public"]["Enums"]["product_volume_config"]
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          quantity_in_stock?: number
          required_packaging?: Json | null
          sku: string
          total_value?: number | null
          unit_price?: number
          updated_at?: string | null
          volume_config?: Database["public"]["Enums"]["product_volume_config"]
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          quantity_in_stock?: number
          required_packaging?: Json | null
          sku?: string
          total_value?: number | null
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
          quantity_per_unit: number
          quantity_required: number
          raw_material_id: string | null
        }
        Insert: {
          component_type: Database["public"]["Enums"]["product_category"]
          created_at?: string | null
          finished_product_id?: string | null
          id?: string
          packaging_item_id?: string | null
          quantity_per_unit?: number
          quantity_required: number
          raw_material_id?: string | null
        }
        Update: {
          component_type?: Database["public"]["Enums"]["product_category"]
          created_at?: string | null
          finished_product_id?: string | null
          id?: string
          packaging_item_id?: string | null
          quantity_per_unit?: number
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
          item_type: Database["public"]["Enums"]["product_category"]
          quantity: number
        }
        Insert: {
          batch_id: string
          created_at?: string | null
          id?: string
          item_id: string
          item_type?: Database["public"]["Enums"]["product_category"]
          quantity?: number
        }
        Update: {
          batch_id?: string
          created_at?: string | null
          id?: string
          item_id?: string
          item_type?: Database["public"]["Enums"]["product_category"]
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_production_batch"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "production_batches"
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
      sku_dependencies: {
        Row: {
          component_type: Database["public"]["Enums"]["product_category"]
          created_at: string | null
          finished_product_id: string | null
          finished_product_sku: string | null
          id: string
          item_type: Database["public"]["Enums"]["product_category"]
          packaging_item_id: string | null
          quantity_required: number
          raw_material_id: string | null
          updated_at: string | null
        }
        Insert: {
          component_type?: Database["public"]["Enums"]["product_category"]
          created_at?: string | null
          finished_product_id?: string | null
          finished_product_sku?: string | null
          id?: string
          item_type?: Database["public"]["Enums"]["product_category"]
          packaging_item_id?: string | null
          quantity_required?: number
          raw_material_id?: string | null
          updated_at?: string | null
        }
        Update: {
          component_type?: Database["public"]["Enums"]["product_category"]
          created_at?: string | null
          finished_product_id?: string | null
          finished_product_sku?: string | null
          id?: string
          item_type?: Database["public"]["Enums"]["product_category"]
          packaging_item_id?: string | null
          quantity_required?: number
          raw_material_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sku_dependencies_finished_product_id_fkey"
            columns: ["finished_product_id"]
            isOneToOne: false
            referencedRelation: "finished_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sku_dependencies_packaging_item_id_fkey"
            columns: ["packaging_item_id"]
            isOneToOne: false
            referencedRelation: "packaging_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sku_dependencies_raw_material_id_fkey"
            columns: ["raw_material_id"]
            isOneToOne: false
            referencedRelation: "raw_materials"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_finished_product_cost: {
        Args: { p_finished_product_id: string }
        Returns: number
      }
      calculate_product_cost: {
        Args: { product_sku: string }
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      material_type: ["essential_oil", "carrier_oil"],
      packaging_item_type: [
        "bottle",
        "cap",
        "dropper",
        "inner_box",
        "outer_box",
      ],
      product_category: ["raw_material", "packaging", "finished_product"],
      product_volume_config: [
        "essential_10ml",
        "essential_30ml",
        "carrier_30ml",
        "carrier_70ml",
        "carrier_140ml",
      ],
      volume_unit: ["ml"],
    },
  },
} as const
