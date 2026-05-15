export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      goods: {
        Row: {
          cate_cd: string;
          goods_no: number;
          goods_nm: string;
          goods_en_nm: string;
          goods_price: number | string;
          ice_fl: string | null;
          best_fl: string | null;
          new_fl: string | null;
          soldout_fl: string | null;
          del_fl: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          cate_cd: string;
          goods_no: number;
          goods_nm: string;
          goods_en_nm: string;
          goods_price: number | string;
          ice_fl?: string | null;
          best_fl?: string | null;
          new_fl?: string | null;
          soldout_fl?: string | null;
          del_fl?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          cate_cd?: string;
          goods_no?: number;
          goods_nm?: string;
          goods_en_nm?: string;
          goods_price?: number | string;
          ice_fl?: string | null;
          best_fl?: string | null;
          new_fl?: string | null;
          soldout_fl?: string | null;
          del_fl?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      goods_cate: {
        Row: {
          cate_cd: string;
          cate_nm: string;
        };
        Insert: {
          cate_cd: string;
          cate_nm: string;
        };
        Update: {
          cate_cd?: string;
          cate_nm?: string;
        };
        Relationships: [];
      };
      options_group: {
        Row: {
          seq: number;
          goods_no: number;
          opt_no: number;
          created_at: string | null;
        };
        Insert: {
          seq?: number;
          goods_no: number;
          opt_no: number;
          created_at?: string | null;
        };
        Update: {
          seq?: number;
          goods_no?: number;
          opt_no?: number;
          created_at?: string | null;
        };
        Relationships: [];
      };
      options: {
        Row: {
          opt_no: number;
          opt_nm: string;
          opt_max_cnt: number | null;
          opt_price: number | string;
          opt_type: string;
          soldout_fl: string | null;
          created_at: string | null;
          updated_at: string | null;
          opt_en_nm: string | null;
        };
        Insert: {
          opt_no?: number;
          opt_nm: string;
          opt_max_cnt?: number | null;
          opt_price: number | string;
          opt_type: string;
          soldout_fl?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          opt_en_nm?: string | null;
        };
        Update: {
          opt_no?: number;
          opt_nm?: string;
          opt_max_cnt?: number | null;
          opt_price?: number | string;
          opt_type?: string;
          soldout_fl?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          opt_en_nm?: string | null;
        };
        Relationships: [];
      };
      order: {
        Row: {
          seq: number;
          order_no: string;
          total_price: number | null;
          payment_method: string;
          order_state: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          seq?: number;
          order_no: string;
          total_price?: number | null;
          payment_method: string;
          order_state: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          seq?: number;
          order_no?: string;
          total_price?: number | null;
          payment_method?: string;
          order_state?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      order_goods: {
        Row: {
          seq: number;
          order_no: string;
          goods_no: number;
          goods_options: string;
          order_state: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          seq?: number;
          order_no: string;
          goods_no: number;
          goods_options: string;
          order_state?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          seq?: number;
          order_no?: string;
          goods_no?: number;
          goods_options?: string;
          order_state?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
