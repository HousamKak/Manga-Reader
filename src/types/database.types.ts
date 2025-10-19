export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export interface Database {
  public: {
    Tables: {
      manga: {
        Row: {
          id: string;
          user_id: string | null;
          title: string;
          slug: string;
          base_url: string;
          cover_image: string | null;
          total_chapters: number | null;
          status: Database['public']['Enums']['reading_status'];
          tags: string[] | null;
          last_read: Json | null;
          date_added: string;
          date_updated: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          title: string;
          slug: string;
          base_url: string;
          cover_image?: string | null;
          total_chapters?: number | null;
          status?: Database['public']['Enums']['reading_status'];
          tags?: string[] | null;
          last_read?: Json | null;
          date_added?: string;
          date_updated?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          title?: string;
          slug?: string;
          base_url?: string;
          cover_image?: string | null;
          total_chapters?: number | null;
          status?: Database['public']['Enums']['reading_status'];
          tags?: string[] | null;
          last_read?: Json | null;
          date_added?: string;
          date_updated?: string;
        };
        Relationships: [];
      };
      chapters: {
        Row: {
          id: string;
          manga_id: string;
          chapter_number: number;
          title: string | null;
          total_pages: number | null;
          is_discovered: boolean;
          last_read_page: number | null;
          progress: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          manga_id: string;
          chapter_number: number;
          title?: string | null;
          total_pages?: number | null;
          is_discovered?: boolean;
          last_read_page?: number | null;
          progress?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          manga_id?: string;
          chapter_number?: number;
          title?: string | null;
          total_pages?: number | null;
          is_discovered?: boolean;
          last_read_page?: number | null;
          progress?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chapters_manga_id_fkey";
            columns: ["manga_id"];
            referencedRelation: "manga";
            referencedColumns: ["id"];
          }
        ];
      };
      pages: {
        Row: {
          id: string;
          chapter_id: string;
          page_number: number;
          image_url: string;
          is_cached: boolean;
          load_error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          chapter_id: string;
          page_number: number;
          image_url: string;
          is_cached?: boolean;
          load_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          chapter_id?: string;
          page_number?: number;
          image_url?: string;
          is_cached?: boolean;
          load_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pages_chapter_id_fkey";
            columns: ["chapter_id"];
            referencedRelation: "chapters";
            referencedColumns: ["id"];
          }
        ];
      };
      settings: {
        Row: {
          id: string;
          user_id: string | null;
          data: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_id?: string | null;
          data: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          data?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      reading_status: 'plan' | 'reading' | 'done';
    };
  };
}
