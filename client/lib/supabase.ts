import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          password_hash: string;
          first_name: string | null;
          last_name: string | null;
          role: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      sales_persons: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          email: string;
          phone: string | null;
          status: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      leads: {
        Row: {
          id: string;
          name: string;
          job_title: string | null;
          company: string;
          email: string | null;
          phone: string | null;
          location: string | null;
          company_size: string | null;
          industries: string[] | null;
          keywords: string[] | null;
          links: string[] | null;
          notes: string | null;
          status_id: string;
          assigned_to: string | null;
          created_by: string;
          next_reminder: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      lead_status_pipeline: {
        Row: {
          id: string;
          name: string;
          order_index: number;
          color: string | null;
          created_at: string;
        };
      };
      lead_emails: {
        Row: {
          id: string;
          lead_id: string;
          email: string;
          created_at: string;
        };
      };
      lead_phones: {
        Row: {
          id: string;
          lead_id: string;
          phone: string;
          created_at: string;
        };
      };
    };
  };
};
