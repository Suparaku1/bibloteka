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
      autoret: {
        Row: {
          biografi_shkurter: string | null
          created_at: string
          emri_plote: string
          id: string
          updated_at: string
        }
        Insert: {
          biografi_shkurter?: string | null
          created_at?: string
          emri_plote: string
          id?: string
          updated_at?: string
        }
        Update: {
          biografi_shkurter?: string | null
          created_at?: string
          emri_plote?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      huazimet: {
        Row: {
          created_at: string
          data_kthimit_parashikuar: string
          data_kthimit_real: string | null
          data_marrjes: string
          id: string
          liber_id: string
          nxenes_id: string
          statusi: Database["public"]["Enums"]["statusi_huazimit"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_kthimit_parashikuar?: string
          data_kthimit_real?: string | null
          data_marrjes?: string
          id?: string
          liber_id: string
          nxenes_id: string
          statusi?: Database["public"]["Enums"]["statusi_huazimit"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_kthimit_parashikuar?: string
          data_kthimit_real?: string | null
          data_marrjes?: string
          id?: string
          liber_id?: string
          nxenes_id?: string
          statusi?: Database["public"]["Enums"]["statusi_huazimit"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "huazimet_liber_id_fkey"
            columns: ["liber_id"]
            isOneToOne: false
            referencedRelation: "librat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "huazimet_nxenes_id_fkey"
            columns: ["nxenes_id"]
            isOneToOne: false
            referencedRelation: "nxenesit"
            referencedColumns: ["id"]
          },
        ]
      }
      kategorite: {
        Row: {
          created_at: string
          emri: string
          id: string
          kod_slug: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          emri: string
          id?: string
          kod_slug?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          emri?: string
          id?: string
          kod_slug?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      librat: {
        Row: {
          autori_emer_mbiemer: string
          cmimi: number | null
          data_inventarizimit: string | null
          data_regjistrimit: string
          id: string
          sasia: number
          titulli: string
          zhaneri: string | null
        }
        Insert: {
          autori_emer_mbiemer: string
          cmimi?: number | null
          data_inventarizimit?: string | null
          data_regjistrimit?: string
          id?: string
          sasia?: number
          titulli: string
          zhaneri?: string | null
        }
        Update: {
          autori_emer_mbiemer?: string
          cmimi?: number | null
          data_inventarizimit?: string | null
          data_regjistrimit?: string
          id?: string
          sasia?: number
          titulli?: string
          zhaneri?: string | null
        }
        Relationships: []
      }
      nxenesit: {
        Row: {
          created_at: string
          email: string | null
          emri: string
          id: string
          klasa: string | null
          mbiemri: string
          nr_amzes: string | null
          nr_telefoni: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          emri: string
          id?: string
          klasa?: string | null
          mbiemri: string
          nr_amzes?: string | null
          nr_telefoni?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          emri?: string
          id?: string
          klasa?: string | null
          mbiemri?: string
          nr_amzes?: string | null
          nr_telefoni?: string | null
          updated_at?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_role_by_email: {
        Args: { _email: string; _role: Database["public"]["Enums"]["app_role"] }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      statusi_huazimit: "aktiv" | "kthyer" | "vonuar"
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
      app_role: ["admin", "moderator", "user"],
      statusi_huazimit: ["aktiv", "kthyer", "vonuar"],
    },
  },
} as const
