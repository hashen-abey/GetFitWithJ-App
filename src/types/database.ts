export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: "admin" | "client";
          full_name: string;
          email: string;
          phone: string | null;
          date_of_birth: string | null;
          gender: string | null;
          height_cm: number | null;
          weight_kg: number | null;
          medical_notes: string | null;
          avatar_url: string | null;
          is_active: boolean;
          subscription_valid_until: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: "admin" | "client";
          full_name: string;
          email: string;
          phone?: string | null;
          date_of_birth?: string | null;
          gender?: string | null;
          height_cm?: number | null;
          weight_kg?: number | null;
          medical_notes?: string | null;
          avatar_url?: string | null;
          is_active?: boolean;
          subscription_valid_until?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: "admin" | "client";
          full_name?: string;
          email?: string;
          phone?: string | null;
          date_of_birth?: string | null;
          gender?: string | null;
          height_cm?: number | null;
          weight_kg?: number | null;
          medical_notes?: string | null;
          avatar_url?: string | null;
          is_active?: boolean;
          subscription_valid_until?: string | null;
          updated_at?: string;
        };
      };
      workout_templates: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          category: string | null;
          difficulty: string | null;
          estimated_duration_min: number | null;
          trainer_notes: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          category?: string | null;
          difficulty?: string | null;
          estimated_duration_min?: number | null;
          trainer_notes?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          category?: string | null;
          difficulty?: string | null;
          estimated_duration_min?: number | null;
          trainer_notes?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      workout_template_exercises: {
        Row: {
          id: string;
          template_id: string;
          name: string;
          description: string | null;
          sets: number | null;
          reps: string | null;
          rest_seconds: number | null;
          video_url: string | null;
          image_url: string | null;
          notes: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          template_id: string;
          name: string;
          description?: string | null;
          sets?: number | null;
          reps?: string | null;
          rest_seconds?: number | null;
          video_url?: string | null;
          image_url?: string | null;
          notes?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          template_id?: string;
          name?: string;
          description?: string | null;
          sets?: number | null;
          reps?: string | null;
          rest_seconds?: number | null;
          video_url?: string | null;
          image_url?: string | null;
          notes?: string | null;
          sort_order?: number;
        };
      };
      workout_assignments: {
        Row: {
          id: string;
          client_id: string;
          template_id: string | null;
          name: string;
          description: string | null;
          trainer_notes: string | null;
          client_notes: string | null;
          start_date: string;
          end_date: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          template_id?: string | null;
          name: string;
          description?: string | null;
          trainer_notes?: string | null;
          client_notes?: string | null;
          start_date: string;
          end_date?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          client_id?: string;
          template_id?: string | null;
          name?: string;
          description?: string | null;
          trainer_notes?: string | null;
          client_notes?: string | null;
          start_date?: string;
          end_date?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      workout_assignment_exercises: {
        Row: {
          id: string;
          assignment_id: string;
          name: string;
          description: string | null;
          sets: number | null;
          reps: string | null;
          rest_seconds: number | null;
          video_url: string | null;
          image_url: string | null;
          notes: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          assignment_id: string;
          name: string;
          description?: string | null;
          sets?: number | null;
          reps?: string | null;
          rest_seconds?: number | null;
          video_url?: string | null;
          image_url?: string | null;
          notes?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          assignment_id?: string;
          name?: string;
          description?: string | null;
          sets?: number | null;
          reps?: string | null;
          rest_seconds?: number | null;
          video_url?: string | null;
          image_url?: string | null;
          notes?: string | null;
          sort_order?: number;
        };
      };
      workout_completions: {
        Row: {
          id: string;
          assignment_id: string;
          client_id: string;
          completed_at: string;
          notes: string | null;
          rating: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          assignment_id: string;
          client_id: string;
          completed_at?: string;
          notes?: string | null;
          rating?: number | null;
          created_at?: string;
        };
        Update: {
          assignment_id?: string;
          client_id?: string;
          completed_at?: string;
          notes?: string | null;
          rating?: number | null;
        };
      };
      meal_plans: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          total_calories: number | null;
          trainer_notes: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          total_calories?: number | null;
          trainer_notes?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          total_calories?: number | null;
          trainer_notes?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      meal_plan_days: {
        Row: {
          id: string;
          plan_id: string;
          day_of_week: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          plan_id: string;
          day_of_week: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          plan_id?: string;
          day_of_week?: string;
          notes?: string | null;
        };
      };
      meal_plan_items: {
        Row: {
          id: string;
          day_id: string;
          meal_type: string;
          name: string;
          description: string | null;
          calories: number | null;
          protein_g: number | null;
          carbs_g: number | null;
          fat_g: number | null;
          portion_size: string | null;
          notes: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          day_id: string;
          meal_type: string;
          name: string;
          description?: string | null;
          calories?: number | null;
          protein_g?: number | null;
          carbs_g?: number | null;
          fat_g?: number | null;
          portion_size?: string | null;
          notes?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          day_id?: string;
          meal_type?: string;
          name?: string;
          description?: string | null;
          calories?: number | null;
          protein_g?: number | null;
          carbs_g?: number | null;
          fat_g?: number | null;
          portion_size?: string | null;
          notes?: string | null;
          sort_order?: number;
        };
      };
      meal_assignments: {
        Row: {
          id: string;
          client_id: string;
          plan_id: string;
          start_date: string;
          end_date: string | null;
          is_active: boolean;
          trainer_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          plan_id: string;
          start_date: string;
          end_date?: string | null;
          is_active?: boolean;
          trainer_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          client_id?: string;
          plan_id?: string;
          start_date?: string;
          end_date?: string | null;
          is_active?: boolean;
          trainer_notes?: string | null;
          updated_at?: string;
        };
      };
      sessions: {
        Row: {
          id: string;
          client_id: string;
          title: string;
          description: string | null;
          session_date: string;
          start_time: string;
          end_time: string | null;
          location: string | null;
          status: "scheduled" | "completed" | "cancelled";
          trainer_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          title: string;
          description?: string | null;
          session_date: string;
          start_time: string;
          end_time?: string | null;
          location?: string | null;
          status?: "scheduled" | "completed" | "cancelled";
          trainer_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          client_id?: string;
          title?: string;
          description?: string | null;
          session_date?: string;
          start_time?: string;
          end_time?: string | null;
          location?: string | null;
          status?: "scheduled" | "completed" | "cancelled";
          trainer_notes?: string | null;
          updated_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          client_id: string;
          amount: number;
          currency: string;
          receipt_url: string | null;
          receipt_file_name: string | null;
          status: "pending" | "approved" | "rejected";
          admin_notes: string | null;
          subscription_months: number | null;
          submitted_at: string;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          amount: number;
          currency?: string;
          receipt_url?: string | null;
          receipt_file_name?: string | null;
          status?: "pending" | "approved" | "rejected";
          admin_notes?: string | null;
          subscription_months?: number | null;
          submitted_at?: string;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Update: {
          client_id?: string;
          amount?: number;
          currency?: string;
          receipt_url?: string | null;
          receipt_file_name?: string | null;
          status?: "pending" | "approved" | "rejected";
          admin_notes?: string | null;
          subscription_months?: number | null;
          reviewed_at?: string | null;
        };
      };
      progress_logs: {
        Row: {
          id: string;
          client_id: string;
          log_date: string;
          weight_kg: number | null;
          body_fat_pct: number | null;
          chest_cm: number | null;
          waist_cm: number | null;
          hips_cm: number | null;
          arm_cm: number | null;
          thigh_cm: number | null;
          photo_urls: string[] | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          log_date?: string;
          weight_kg?: number | null;
          body_fat_pct?: number | null;
          chest_cm?: number | null;
          waist_cm?: number | null;
          hips_cm?: number | null;
          arm_cm?: number | null;
          thigh_cm?: number | null;
          photo_urls?: string[] | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          client_id?: string;
          log_date?: string;
          weight_kg?: number | null;
          body_fat_pct?: number | null;
          chest_cm?: number | null;
          waist_cm?: number | null;
          hips_cm?: number | null;
          arm_cm?: number | null;
          thigh_cm?: number | null;
          photo_urls?: string[] | null;
          notes?: string | null;
        };
      };
      app_settings: {
        Row: {
          id: string;
          key: string;
          value: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          value: string;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value?: string;
          updated_at?: string;
        };
      };
    };
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: {
      user_role: "admin" | "client";
      payment_status: "pending" | "approved" | "rejected";
      session_status: "scheduled" | "completed" | "cancelled";
      day_of_week:
        | "monday"
        | "tuesday"
        | "wednesday"
        | "thursday"
        | "friday"
        | "saturday"
        | "sunday";
    };
  };
};

// Convenience types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type WorkoutTemplate = Database["public"]["Tables"]["workout_templates"]["Row"];
export type WorkoutTemplateExercise = Database["public"]["Tables"]["workout_template_exercises"]["Row"];
export type WorkoutAssignment = Database["public"]["Tables"]["workout_assignments"]["Row"];
export type WorkoutAssignmentExercise = Database["public"]["Tables"]["workout_assignment_exercises"]["Row"];
export type WorkoutCompletion = Database["public"]["Tables"]["workout_completions"]["Row"];
export type MealPlan = Database["public"]["Tables"]["meal_plans"]["Row"];
export type MealPlanDay = Database["public"]["Tables"]["meal_plan_days"]["Row"];
export type MealPlanItem = Database["public"]["Tables"]["meal_plan_items"]["Row"];
export type MealAssignment = Database["public"]["Tables"]["meal_assignments"]["Row"];
export type Session = Database["public"]["Tables"]["sessions"]["Row"];
export type Payment = Database["public"]["Tables"]["payments"]["Row"];
export type ProgressLog = Database["public"]["Tables"]["progress_logs"]["Row"];
export type AppSetting = Database["public"]["Tables"]["app_settings"]["Row"];
