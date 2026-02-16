"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClientAccount } from "@/actions/auth";
import { PageHeader } from "@/components/shared/page-header";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/shared/loading";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    phone: "",
    date_of_birth: "",
    gender: "",
    height_cm: "",
    weight_kg: "",
    medical_notes: "",
  });

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const result = await createClientAccount({
      ...form,
      height_cm: form.height_cm ? parseFloat(form.height_cm) : undefined,
      weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : undefined,
    });

    if (result.error) {
      toast.error(result.error);
      setLoading(false);
      return;
    }

    toast.success("Client created successfully");
    router.push("/admin/clients");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/clients">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <PageHeader title="Add New Client" />
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Full Name" required>
                <Input
                  value={form.full_name}
                  onChange={(e) => updateField("full_name", e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </FormField>
              <FormField label="Email" required>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="john@example.com"
                  required
                />
              </FormField>
              <FormField label="Password" required>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  placeholder="Min 6 characters"
                  required
                  minLength={6}
                />
              </FormField>
              <FormField label="Phone">
                <Input
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="+94 77 123 4567"
                />
              </FormField>
              <FormField label="Date of Birth">
                <Input
                  type="date"
                  value={form.date_of_birth}
                  onChange={(e) => updateField("date_of_birth", e.target.value)}
                />
              </FormField>
              <FormField label="Gender">
                <Select
                  value={form.gender}
                  onValueChange={(v) => updateField("gender", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Height (cm)">
                <Input
                  type="number"
                  step="0.1"
                  value={form.height_cm}
                  onChange={(e) => updateField("height_cm", e.target.value)}
                  placeholder="170"
                />
              </FormField>
              <FormField label="Weight (kg)">
                <Input
                  type="number"
                  step="0.1"
                  value={form.weight_kg}
                  onChange={(e) => updateField("weight_kg", e.target.value)}
                  placeholder="70"
                />
              </FormField>
            </div>
            <FormField label="Medical Notes">
              <Textarea
                value={form.medical_notes}
                onChange={(e) => updateField("medical_notes", e.target.value)}
                placeholder="Any medical conditions, injuries, allergies..."
                rows={3}
              />
            </FormField>

            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? <Spinner className="h-4 w-4" /> : "Create Client"}
              </Button>
              <Link href="/admin/clients">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
