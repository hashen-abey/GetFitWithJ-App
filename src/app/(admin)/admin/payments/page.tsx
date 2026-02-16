"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { reviewPayment } from "@/actions/payments";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/shared/loading";
import { formatDate, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { CreditCard, Eye, CheckCircle, XCircle } from "lucide-react";

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [reviewForm, setReviewForm] = useState({
    status: "" as "approved" | "rejected" | "",
    admin_notes: "",
    subscription_months: "1",
  });
  const [reviewing, setReviewing] = useState(false);

  async function loadPayments() {
    const supabase = createClient();
    const { data } = await supabase
      .from("payments")
      .select(
        "*, profiles!payments_client_id_fkey(full_name, subscription_valid_until)"
      )
      .order("submitted_at", { ascending: false });
    setPayments(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadPayments();
  }, []);

  function openReview(payment: any) {
    setSelectedPayment(payment);
    setReviewForm({ status: "", admin_notes: "", subscription_months: "1" });
    setReviewDialogOpen(true);
  }

  async function handleReview(status: "approved" | "rejected") {
    if (!selectedPayment) return;
    setReviewing(true);

    const result = await reviewPayment(selectedPayment.id, {
      status,
      admin_notes: reviewForm.admin_notes || null,
      subscription_months:
        status === "approved"
          ? parseInt(reviewForm.subscription_months) || 1
          : null,
    });

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`Payment ${status}`);
      setReviewDialogOpen(false);
      loadPayments();
    }
    setReviewing(false);
  }

  const pending = payments.filter((p) => p.status === "pending");
  const reviewed = payments.filter((p) => p.status !== "pending");

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Review client payment submissions"
      />

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pending.length})
          </TabsTrigger>
          <TabsTrigger value="reviewed">
            Reviewed ({reviewed.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {pending.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="No pending payments"
              description="All payments have been reviewed."
            />
          ) : (
            <div className="space-y-3">
              {pending.map((p) => (
                <Card key={p.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium">
                        {(p.profiles as any)?.full_name}
                      </p>
                      <p className="text-lg font-bold text-primary">
                        {formatCurrency(p.amount)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Submitted {formatDate(p.submitted_at)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {p.receipt_url && (
                        <a
                          href={p.receipt_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="outline" size="sm">
                            <Eye className="mr-2 h-4 w-4" />
                            Receipt
                          </Button>
                        </a>
                      )}
                      <Button size="sm" onClick={() => openReview(p)}>
                        Review
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reviewed">
          {reviewed.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="No reviewed payments"
              description="Reviewed payments will appear here."
            />
          ) : (
            <div className="space-y-3">
              {reviewed.map((p) => (
                <Card key={p.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium">
                        {(p.profiles as any)?.full_name}
                      </p>
                      <p className="font-semibold">
                        {formatCurrency(p.amount)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(p.submitted_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          p.status === "approved" ? "success" : "destructive"
                        }
                      >
                        {p.status}
                      </Badge>
                      {p.reviewed_at && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Reviewed {formatDate(p.reviewed_at)}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Payment</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <p className="font-medium">
                  {(selectedPayment.profiles as any)?.full_name}
                </p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(selectedPayment.amount)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Submitted {formatDate(selectedPayment.submitted_at)}
                </p>
              </div>

              {selectedPayment.receipt_url && (
                <a
                  href={selectedPayment.receipt_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" className="w-full">
                    <Eye className="mr-2 h-4 w-4" />
                    View Receipt
                  </Button>
                </a>
              )}

              <FormField label="Subscription Months (if approving)">
                <Input
                  type="number"
                  min="1"
                  max="12"
                  value={reviewForm.subscription_months}
                  onChange={(e) =>
                    setReviewForm((p) => ({
                      ...p,
                      subscription_months: e.target.value,
                    }))
                  }
                />
              </FormField>

              <FormField label="Notes">
                <Textarea
                  value={reviewForm.admin_notes}
                  onChange={(e) =>
                    setReviewForm((p) => ({
                      ...p,
                      admin_notes: e.target.value,
                    }))
                  }
                  placeholder="Optional notes..."
                  rows={2}
                />
              </FormField>

              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => handleReview("approved")}
                  disabled={reviewing}
                >
                  {reviewing ? (
                    <Spinner className="h-4 w-4" />
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve
                    </>
                  )}
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => handleReview("rejected")}
                  disabled={reviewing}
                >
                  {reviewing ? (
                    <Spinner className="h-4 w-4" />
                  ) : (
                    <>
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
