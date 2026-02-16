import { z } from "zod";

// Auth
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Profile
export const profileSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional().nullable(),
  date_of_birth: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  height_cm: z.coerce.number().positive().optional().nullable(),
  weight_kg: z.coerce.number().positive().optional().nullable(),
  medical_notes: z.string().optional().nullable(),
});

// Client creation (admin)
export const createClientSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.string().optional(),
  height_cm: z.coerce.number().positive().optional(),
  weight_kg: z.coerce.number().positive().optional(),
  medical_notes: z.string().optional(),
});

// Workout template
export const workoutTemplateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  difficulty: z.string().optional().nullable(),
  estimated_duration_min: z.coerce.number().int().positive().optional().nullable(),
  trainer_notes: z.string().optional().nullable(),
});

export const exerciseSchema = z.object({
  name: z.string().min(1, "Exercise name is required"),
  description: z.string().optional().nullable(),
  sets: z.coerce.number().int().positive().optional().nullable(),
  reps: z.string().optional().nullable(),
  rest_seconds: z.coerce.number().int().positive().optional().nullable(),
  video_url: z.string().url().optional().or(z.literal("")).nullable(),
  image_url: z.string().url().optional().or(z.literal("")).nullable(),
  notes: z.string().optional().nullable(),
  sort_order: z.coerce.number().int().default(0),
});

// Workout assignment
export const workoutAssignmentSchema = z.object({
  client_id: z.string().uuid("Invalid client"),
  template_id: z.string().uuid().optional().nullable(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
  trainer_notes: z.string().optional().nullable(),
  client_notes: z.string().optional().nullable(),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().optional().nullable(),
});

// Workout completion
export const workoutCompletionSchema = z.object({
  assignment_id: z.string().uuid(),
  notes: z.string().optional().nullable(),
  rating: z.coerce.number().int().min(1).max(5).optional().nullable(),
});

// Meal plan
export const mealPlanSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
  total_calories: z.coerce.number().int().positive().optional().nullable(),
  trainer_notes: z.string().optional().nullable(),
});

export const mealItemSchema = z.object({
  meal_type: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  name: z.string().min(1, "Item name is required"),
  description: z.string().optional().nullable(),
  calories: z.coerce.number().int().positive().optional().nullable(),
  protein_g: z.coerce.number().positive().optional().nullable(),
  carbs_g: z.coerce.number().positive().optional().nullable(),
  fat_g: z.coerce.number().positive().optional().nullable(),
  portion_size: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  sort_order: z.coerce.number().int().default(0),
});

// Meal assignment
export const mealAssignmentSchema = z.object({
  client_id: z.string().uuid("Invalid client"),
  plan_id: z.string().uuid("Invalid meal plan"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().optional().nullable(),
  trainer_notes: z.string().optional().nullable(),
});

// Session
export const sessionSchema = z.object({
  client_id: z.string().uuid("Invalid client"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  session_date: z.string().min(1, "Date is required"),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  trainer_notes: z.string().optional().nullable(),
});

// Payment submission (client)
export const paymentSubmissionSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
  currency: z.string().default("LKR"),
});

// Payment review (admin)
export const paymentReviewSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  admin_notes: z.string().optional().nullable(),
  subscription_months: z.coerce.number().int().positive().optional().nullable(),
});

// Progress log
export const progressLogSchema = z.object({
  log_date: z.string().default(() => new Date().toISOString().split("T")[0]),
  weight_kg: z.coerce.number().positive().optional().nullable(),
  body_fat_pct: z.coerce.number().min(0).max(100).optional().nullable(),
  chest_cm: z.coerce.number().positive().optional().nullable(),
  waist_cm: z.coerce.number().positive().optional().nullable(),
  hips_cm: z.coerce.number().positive().optional().nullable(),
  arm_cm: z.coerce.number().positive().optional().nullable(),
  thigh_cm: z.coerce.number().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// Types derived from schemas
export type LoginInput = z.infer<typeof loginSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type CreateClientInput = z.infer<typeof createClientSchema>;
export type WorkoutTemplateInput = z.infer<typeof workoutTemplateSchema>;
export type ExerciseInput = z.infer<typeof exerciseSchema>;
export type WorkoutAssignmentInput = z.infer<typeof workoutAssignmentSchema>;
export type WorkoutCompletionInput = z.infer<typeof workoutCompletionSchema>;
export type MealPlanInput = z.infer<typeof mealPlanSchema>;
export type MealItemInput = z.infer<typeof mealItemSchema>;
export type MealAssignmentInput = z.infer<typeof mealAssignmentSchema>;
export type SessionInput = z.infer<typeof sessionSchema>;
export type PaymentSubmissionInput = z.infer<typeof paymentSubmissionSchema>;
export type PaymentReviewInput = z.infer<typeof paymentReviewSchema>;
export type ProgressLogInput = z.infer<typeof progressLogSchema>;
