"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateSetting } from "@/actions/settings";
import { PageHeader } from "@/components/shared/page-header";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/shared/loading";
import { toast } from "sonner";
import { Save } from "lucide-react";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.from("app_settings").select("*");
      const map: Record<string, string> = {};
      data?.forEach((s) => {
        map[s.key] = s.value;
      });
      setSettings(map);
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave(key: string) {
    setSaving(key);
    const result = await updateSetting(key, settings[key] || "");
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Setting saved");
    }
    setSaving(null);
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
      <PageHeader
        title="Settings"
        description="Configure your coaching platform"
      />

      <Card>
        <CardHeader>
          <CardTitle>Bank Transfer Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField label="Bank Details (shown to clients on payment page)">
            <Textarea
              value={settings.bank_details || ""}
              onChange={(e) =>
                setSettings((p) => ({ ...p, bank_details: e.target.value }))
              }
              rows={5}
              placeholder="Bank name, account number, branch..."
            />
          </FormField>
          <Button
            onClick={() => handleSave("bank_details")}
            disabled={saving === "bank_details"}
          >
            {saving === "bank_details" ? (
              <Spinner className="h-4 w-4" />
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField label="Instructions shown above bank details">
            <Textarea
              value={settings.payment_instructions || ""}
              onChange={(e) =>
                setSettings((p) => ({
                  ...p,
                  payment_instructions: e.target.value,
                }))
              }
              rows={3}
              placeholder="Payment instructions..."
            />
          </FormField>
          <Button
            onClick={() => handleSave("payment_instructions")}
            disabled={saving === "payment_instructions"}
          >
            {saving === "payment_instructions" ? (
              <Spinner className="h-4 w-4" />
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Welcome Message</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField label="Welcome message shown on client dashboard">
            <Textarea
              value={settings.welcome_message || ""}
              onChange={(e) =>
                setSettings((p) => ({
                  ...p,
                  welcome_message: e.target.value,
                }))
              }
              rows={3}
              placeholder="Welcome to GetFitWithJ!..."
            />
          </FormField>
          <Button
            onClick={() => handleSave("welcome_message")}
            disabled={saving === "welcome_message"}
          >
            {saving === "welcome_message" ? (
              <Spinner className="h-4 w-4" />
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
