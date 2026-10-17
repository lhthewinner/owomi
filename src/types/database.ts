/**
 * Types TypeScript stricts pour la base de données Supabase et le domaine Asoro.
 * Conforme aux règles d'AGENTS.md :
 * - Noms en anglais, commentaires en français
 * - Pas de type `any`
 * - Montants stockés sous forme de nombres entiers (bigint en base, number en TS)
 * - Champs de synchronisation hors ligne : local_id, last_modified_at, sync_status
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type SyncStatus = "pending" | "synced";
export type PeriodType = "day" | "week" | "month";
export type LoanDirection = "borrowed" | "given";
export type ThemeType = "light" | "dark" | "system";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          firstname: string;
          currency: string;
          timezone: string;
          theme: ThemeType;
          monthly_salary: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name?: string;
          firstname?: string;
          currency?: string;
          timezone?: string;
          theme?: ThemeType;
          monthly_salary?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          firstname?: string;
          currency?: string;
          timezone?: string;
          theme?: ThemeType;
          monthly_salary?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          icon: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          icon: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
          icon?: string;
        };
        Relationships: [];
      };
      planned_expenses: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          amount: number;
          category: string;
          period: PeriodType;
          start_date: string;
          local_id: string;
          last_modified_at: string;
          sync_status: SyncStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          amount: number;
          category: string;
          period: PeriodType;
          start_date: string;
          local_id: string;
          last_modified_at?: string;
          sync_status?: SyncStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          amount?: number;
          category?: string;
          period?: PeriodType;
          start_date?: string;
          local_id?: string;
          last_modified_at?: string;
          sync_status?: SyncStatus;
        };
        Relationships: [];
      };
      expenses: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          category: string;
          date: string;
          note: string;
          planned_expense_id: string | null;
          local_id: string;
          last_modified_at: string;
          sync_status: SyncStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          category: string;
          date: string;
          note?: string;
          planned_expense_id?: string | null;
          local_id: string;
          last_modified_at?: string;
          sync_status?: SyncStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          category?: string;
          date?: string;
          note?: string;
          planned_expense_id?: string | null;
          local_id?: string;
          last_modified_at?: string;
          sync_status?: SyncStatus;
        };
        Relationships: [];
      };
      incomes: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          source: string;
          date: string;
          local_id: string;
          last_modified_at: string;
          sync_status: SyncStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          source?: string;
          date: string;
          local_id: string;
          last_modified_at?: string;
          sync_status?: SyncStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          source?: string;
          date?: string;
          local_id?: string;
          last_modified_at?: string;
          sync_status?: SyncStatus;
        };
        Relationships: [];
      };
      loans: {
        Row: {
          id: string;
          user_id: string;
          direction: LoanDirection;
          amount: number;
          counterpart: string;
          date: string;
          note: string;
          local_id: string;
          last_modified_at: string;
          sync_status: SyncStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          direction: LoanDirection;
          amount: number;
          counterpart: string;
          date: string;
          note?: string;
          local_id: string;
          last_modified_at?: string;
          sync_status?: SyncStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          direction?: LoanDirection;
          amount?: number;
          counterpart?: string;
          date?: string;
          note?: string;
          local_id?: string;
          last_modified_at?: string;
          sync_status?: SyncStatus;
        };
        Relationships: [];
      };
      [key: string]: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
