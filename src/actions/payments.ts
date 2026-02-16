"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  paymentReviewSchema,
  type PaymentReviewInput,
} from "@/lib/validators";
import { revalidatePath } from "next/cache";
import { addMonths, format } from "date-fns";

export async function getPayments(filters?: {
  clientId?: string;
  status?: string;
}) {
  const supabase = createServerSupabaseClient();
  let query = supabase
    .from("payments")
    .select("*, profiles!payments_client_id_fkey(full_name, subscription_valid_until)")
    .order("submitted_at", { ascending: false });

  if (filters?.clientId) query = query.eq("client_id", filters.clientId);
  if (filters?.status) query = query.eq("status", filters.status);

  const { data, error } = await query;
  if (error) return { error: error.message };
  return { data };
}

export async function getPendingPayments() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("payments")
    .select("*, profiles!payments_client_id_fkey(full_name)")
    .eq("status", "pending")
    .order("submitted_at", { ascending: true });

  if (error) return { error: error.message };
  return { data };
}

export async function submitPayment(
  amount: number,
  receiptUrl: string,
  receiptFileName: string
) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  if (amount <= 0) return { error: "Invalid amount" };

  const { error } = await supabase.from("payments").insert({
    client_id: user.id,
    amount,
    receipt_url: receiptUrl,
    receipt_file_name: receiptFileName,
  });

  if (error) return { error: error.message };

  revalidatePath("/payments");
  revalidatePath("/admin/payments");
  return { success: true };
}

export async function reviewPayment(
  paymentId: string,
  input: PaymentReviewInput
) {
  const parsed = paymentReviewSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const supabase = createServerSupabaseClient();

  // Get the payment to find client
  const { data: payment, error: pError } = await supabase
    .from("payments")
    .select("*, profiles!payments_client_id_fkey(subscription_valid_until)")
    .eq("id", paymentId)
    .single();

  if (pError) return { error: pError.message };

  // Update payment status
  const { error: uError } = await supabase
    .from("payments")
    .update({
      status: parsed.data.status,
      admin_notes: parsed.data.admin_notes || null,
      subscription_months: parsed.data.subscription_months || null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", paymentId);

  if (uError) return { error: uError.message };

  // If approved, extend subscription
  if (
    parsed.data.status === "approved" &&
    parsed.data.subscription_months
  ) {
    const currentValid =
      payment.profiles?.subscription_valid_until;
    const baseDate =
      currentValid && new Date(currentValid) > new Date()
        ? new Date(currentValid)
        : new Date();

    const newValidUntil = format(
      addMonths(baseDate, parsed.data.subscription_months),
      "yyyy-MM-dd"
    );

    await supabase
      .from("profiles")
      .update({ subscription_valid_until: newValidUntil })
      .eq("id", payment.client_id);
  }

  revalidatePath("/admin/payments");
  revalidatePath("/admin/dashboard");
  revalidatePath("/payments");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function getMyPayments() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("client_id", user.id)
    .order("submitted_at", { ascending: false });

  if (error) return { error: error.message };
  return { data };
}
