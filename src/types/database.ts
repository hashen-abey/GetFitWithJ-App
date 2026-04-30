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
          role: "admin" | "trainer_owner" | "associate_trainer" | "client";
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
          role?: "admin" | "trainer_owner" | "associate_trainer" | "client";
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
          role?: "admin" | "trainer_owner" | "associate_trainer" | "client";
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
      workouts: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          youtube_url: string | null;
          youtube_video_id: string | null;
          difficulty: "beginner" | "intermediate" | "advanced" | null;
          muscle_groups: string[];
          duration_mins: number | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          youtube_url?: string | null;
          difficulty?: "beginner" | "intermediate" | "advanced" | null;
          muscle_groups?: string[];
          duration_mins?: number | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          youtube_url?: string | null;
          difficulty?: "beginner" | "intermediate" | "advanced" | null;
          muscle_groups?: string[];
          duration_mins?: number | null;
          updated_at?: string;
        };
      };
      programs: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          trainer_id: string;
          is_template: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          trainer_id: string;
          is_template?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          is_template?: boolean;
          updated_at?: string;
        };
      };
      program_workouts: {
        Row: {
          id: string;
          program_id: string;
          workout_id: string;
          day_of_week: DayOfWeek;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          program_id: string;
          workout_id: string;
          day_of_week: DayOfWeek;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          program_id?: string;
          workout_id?: string;
          day_of_week?: DayOfWeek;
          sort_order?: number;
        };
      };
      client_programs: {
        Row: {
          id: string;
          client_id: string;
          program_id: string;
          start_date: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          program_id: string;
          start_date?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          client_id?: string;
          program_id?: string;
          start_date?: string;
          is_active?: boolean;
        };
      };
      sessions: {
        Row: {
          id: string;
          client_id: string;
          trainer_id: string | null;
          title: string;
          description: string | null;
          session_date: string;
          start_time: string;
          end_time: string | null;
          location: string | null;
          location_or_link: string | null;
          type: "in_person" | "online";
          duration_mins: number | null;
          status: "scheduled" | "completed" | "cancelled";
          trainer_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          trainer_id?: string | null;
          title: string;
          description?: string | null;
          session_date: string;
          start_time: string;
          end_time?: string | null;
          location?: string | null;
          location_or_link?: string | null;
          type?: "in_person" | "online";
          duration_mins?: number | null;
          status?: "scheduled" | "completed" | "cancelled";
          trainer_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          client_id?: string;
          trainer_id?: string | null;
          title?: string;
          description?: string | null;
          session_date?: string;
          start_time?: string;
          end_time?: string | null;
          location?: string | null;
          location_or_link?: string | null;
          type?: "in_person" | "online";
          duration_mins?: number | null;
          status?: "scheduled" | "completed" | "cancelled";
          trainer_notes?: string | null;
          updated_at?: string;
        };
      };
      notes: {
        Row: {
          id: string;
          trainer_id: string;
          client_id: string;
          body: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          trainer_id: string;
          client_id: string;
          body: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          body?: string;
          is_read?: boolean;
        };
      };
      note_replies: {
        Row: {
          id: string;
          note_id: string;
          author_id: string;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          note_id: string;
          author_id: string;
          body: string;
          created_at?: string;
        };
        Update: {
          body?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          read: boolean;
          payload: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          read?: boolean;
          payload?: Json;
          created_at?: string;
        };
        Update: {
          read?: boolean;
        };
      };
      client_invites: {
        Row: {
          id: string;
          email: string;
          token: string;
          trainer_id: string;
          used_at: string | null;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          token?: string;
          trainer_id: string;
          used_at?: string | null;
          expires_at?: string;
          created_at?: string;
        };
        Update: {
          used_at?: string | null;
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
          notes?: string | null;
          rating?: number | null;
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
          log_date?: string;
          weight_kg?: number | null;
          body_fat_pct?: number | null;
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
          value?: string;
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
        };
        Update: {
          status?: "pending" | "approved" | "rejected";
          admin_notes?: string | null;
          subscription_months?: number | null;
          reviewed_at?: string | null;
        };
      };
    };
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      is_trainer: { Args: Record<string, never>; Returns: boolean };
      is_trainer_owner: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: {
      user_role: "admin" | "trainer_owner" | "associate_trainer" | "client";
      session_status: "scheduled" | "completed" | "cancelled";
      session_type: "in_person" | "online";
      day_of_week: DayOfWeek;
    };
  };
};

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

// Convenience types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Workout = Database["public"]["Tables"]["workouts"]["Row"];
export type Program = Database["public"]["Tables"]["programs"]["Row"];
export type ProgramWorkout = Database["public"]["Tables"]["program_workouts"]["Row"];
export type ClientProgram = Database["public"]["Tables"]["client_programs"]["Row"];
export type Session = Database["public"]["Tables"]["sessions"]["Row"];
export type Note = Database["public"]["Tables"]["notes"]["Row"];
export type NoteReply = Database["public"]["Tables"]["note_replies"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type ClientInvite = Database["public"]["Tables"]["client_invites"]["Row"];
export type WorkoutCompletion = Database["public"]["Tables"]["workout_completions"]["Row"];
export type WorkoutTemplate = Database["public"]["Tables"]["workout_templates"]["Row"];
export type ProgressLog = Database["public"]["Tables"]["progress_logs"]["Row"];
export type Payment = Database["public"]["Tables"]["payments"]["Row"];
export type AppSetting = Database["public"]["Tables"]["app_settings"]["Row"];

// Legacy type aliases for backward compatibility
export type MealPlan = { id: string; name: string; description: string | null; total_calories: number | null; trainer_notes: string | null; is_active: boolean; created_at: string; updated_at: string };
export type MealAssignment = { id: string; client_id: string; plan_id: string; start_date: string; end_date: string | null; is_active: boolean; trainer_notes: string | null; created_at: string; updated_at: string };

export type UserRole = Profile["role"];
export const TRAINER_ROLES: UserRole[] = ["admin", "trainer_owner", "associate_trainer"];
export const OWNER_ROLES: UserRole[] = ["admin", "trainer_owner"];

export function isTrainer(role: UserRole) {
  return TRAINER_ROLES.includes(role);
}
export function isOwner(role: UserRole) {
  return OWNER_ROLES.includes(role);
}
