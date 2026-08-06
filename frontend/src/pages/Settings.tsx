import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type RuntimeSettings = {
  chargeAmountSats: number;
  chargeIntervalMs: number;
  gracePeriodSeconds: number;
  rateLimitPerHour: number;
  rateLimitCleanupMs: number;
};

const fields: {
  key: keyof RuntimeSettings;
  label: string;
  description: string;
  min: number;
}[] = [
  { key: "chargeAmountSats", label: "CHARGE_AMOUNT_SATS", description: "Sats charged per wallet per interval.", min: 1 },
  { key: "chargeIntervalMs", label: "CHARGE_INTERVAL_MS", description: "Time between charge runs, in milliseconds.", min: 60_000 },
  { key: "gracePeriodSeconds", label: "Grace period", description: "Seconds before a new wallet can be charged.", min: 0 },
  { key: "rateLimitPerHour", label: "Rate limit", description: "Wallet creations allowed per IP per hour.", min: 1 },
  { key: "rateLimitCleanupMs", label: "Rate-limit cleanup", description: "Milliseconds between stale rate-limit cleanup runs.", min: 60_000 },
];

export function Settings() {
  const [settings, setSettings] = useState<RuntimeSettings | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then(async (response) => {
        if (!response.ok) throw new Error("Settings are unavailable.");
        return response.json();
      })
      .then(setSettings)
      .catch((error) => setMessage(error.message));
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!settings) return;
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to save settings.");
      setSettings(result);
      setMessage("Settings saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Settings</CardTitle>
      </CardHeader>
      <CardContent>
        {!settings ? (
          <p className="text-sm text-muted-foreground">{message || "Loading..."}</p>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            {fields.map((field) => (
              <label key={field.key} className="block space-y-2 font-mono text-sm">
                <span>{field.label}</span>
                <Input
                  type="number"
                  min={field.min}
                  step="1"
                  value={settings[field.key]}
                  onChange={(event) =>
                    setSettings({ ...settings, [field.key]: Number(event.target.value) })
                  }
                  required
                />
                <span className="block text-xs text-muted-foreground">{field.description}</span>
              </label>
            ))}
            {message && <p className="text-sm text-muted-foreground">{message}</p>}
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save settings"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
