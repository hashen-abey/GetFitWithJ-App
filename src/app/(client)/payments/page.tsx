"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { submitPayment } from "@/actions/payments";
import { PageHeader } from "@/components/shared/page-header";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/shared/loading";
import { formatDate, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { Upload, CreditCard, FileText } from "lucide-react";

export default function ClientPaymentsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [amount, setAmount] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const supabase = createClient();

  async function loadData() {
    const [settingsRes, paymentsRes, userRes] = await Promise.all([
      supabase.from("app_settings").select("*"),
      supabase.auth.getUser().then(async ({ data: { user } }) => {
        if (!user) return { data: [] };
        return supabase
          .from("payments")
          .select("*")
          .eq("client_id", user.id)
          .order("submitted_at", { ascending: false });
      }),
      supabase.auth.getUser(),
    ]);

    const map: Record<string, string> = {};
    settingsRes.data?.forEach((s) => {
      map[s.key] = s.value;
    });
    setSettings(map);
    setPayments((paymentsRes as any).data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      toast.error("Please upload a receipt");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setSubmitting(true);

    // Upload file
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Not authenticated");
      setSubmitting(false);
      return;
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("receipts")
      .upload(fileName, file);

    if (uploadError) {
      toast.error("Failed to upload receipt: " + uploadError.message);
      setSubmitting(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("receipts").getPublicUrl(fileName);

    const result = await submitPayment(
      parseFloat(amount),
      publicUrl,
      file.name
    );

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Payment submitted for review");
      setAmount("");
      setFile(null);
      loadData();
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Payments" />

      {/* Bank Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5 text-primary" />
            Payment Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {settings.payment_instructions && (
            <p className="mb-3 text-sm text-muted-foreground">
              {settings.payment_instructions}
            </p>
          )}
          <div className="whitespace-pre-wrap rounded-lg bg-muted p-4 text-sm">
            {settings.bank_details || "Bank details not configured yet."}
          </div>
        </CardContent>
      </Card>

      {/* Upload Receipt */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Upload className="h-5 w-5 text-primary" />
            Submit Payment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Amount (LKR)" required>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="5000"
                required
              />
            </FormField>
            <FormField label="Receipt (Image or PDF)" required>
              <Input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Max 5MB. Accepted: JPEG, PNG, WebP, PDF
              </p>
            </FormField>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <Spinner className="h-4 w-4" />
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Submit Payment
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Payment History */}
      {payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-primary" />
              Payment History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {payments.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-semibold">
                      {formatCurrency(p.amount)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(p.submitted_at)}
                    </p>
                    {p.admin_notes && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {p.admin_notes}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant={
                      p.status === "approved"
                        ? "success"
                        : p.status === "rejected"
                        ? "destructive"
                        : "warning"
                    }
                  >
                    {p.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
