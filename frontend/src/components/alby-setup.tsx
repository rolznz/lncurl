import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type SetupStatus = {
  configured: boolean;
  source: "environment" | "database" | "none";
};

export function AlbySetup() {
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/setup/status")
      .then((response) =>
        response.ok ? response.json() : Promise.reject(),
      )
      .then(setStatus)
      .catch(() => {});
  }, []);

  if (!status || status.configured) return null;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/setup/alby-token", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Unable to save the token.");
      }
      setToken("");
      setStatus(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save the token.");
    } finally {
      setSaving(false);
    }
  }

  const albySettingsUrl = `http://${window.location.hostname}:59000/settings/developer`;

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Connect Alby Hub</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Create a full-access token in{" "}
            <a
              className="text-terminal hover:underline"
              href={albySettingsUrl}
              target="_blank"
              rel="noreferrer"
            >
              Alby Hub Developer Settings
            </a>
            , then paste it below.
          </p>
          <Input
            type="password"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder="Alby Hub API token"
            autoComplete="off"
            required
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={saving || !token.trim()}>
            {saving ? "Connecting..." : "Connect"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
