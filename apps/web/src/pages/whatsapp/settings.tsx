import { useEffect, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  HelpCircle,
  RefreshCw,
  Save,
  Smartphone,
} from "lucide-react";
import type { UpdateWhatsAppConfigInput, WhatsAppConfig } from "@open-email/types";
import { getWhatsAppConfig, testWhatsAppConnection, updateWhatsAppConfig } from "@/lib/api/whatsapp";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";

export default function WhatsAppSettingsPage() {
  const [config, setConfig] = useState<WhatsAppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Form states
  const [wabaId, setWabaId] = useState("");
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [webhookVerifyToken, setWebhookVerifyToken] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getWhatsAppConfig();
      setConfig(data);
      if (data) {
        setWabaId(data.wabaId ?? "");
        setPhoneNumberId(data.phoneNumberId ?? "");
        setPhoneNumber(data.phoneNumber ?? "");
        setDisplayName(data.displayName ?? "");
        setWebhookVerifyToken(data.webhookVerifyToken ?? "zsender_wa_verify_token");
      }
    } catch (err) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Failed to load WhatsApp settings" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setFeedback(null);
      const input: UpdateWhatsAppConfigInput = {
        wabaId,
        phoneNumberId,
        phoneNumber,
        displayName,
        webhookVerifyToken,
      };
      if (accessToken.trim()) {
        input.accessToken = accessToken.trim();
      }
      const updated = await updateWhatsAppConfig(input);
      setConfig(updated);
      setAccessToken("");
      setFeedback({ type: "success", message: "WhatsApp configuration saved successfully!" });
    } catch (err) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Failed to save configuration" });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      setFeedback(null);
      const res = await testWhatsAppConnection();
      if (res.success) {
        setFeedback({
          type: "success",
          message: `Connection successful! Connected as: ${res.displayName || "WhatsApp Business"}`,
        });
      } else {
        setFeedback({
          type: "error",
          message: `Connection test failed: ${res.error || "Unknown error"}`,
        });
      }
      loadData();
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Connection test request failed",
      });
    } finally {
      setTesting(false);
    }
  };

  const copyToClipboard = (text: string, isUrl: boolean) => {
    navigator.clipboard.writeText(text);
    if (isUrl) {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">WhatsApp Business Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Connect your official Meta WhatsApp Business Cloud API to enable marketing broadcasts and interactive two-way live chat.
        </p>
      </div>

      {feedback && (
        <div
          className={`flex items-center gap-3 p-4 rounded-lg text-sm ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
              : "bg-red-50 text-red-900 border border-red-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Status Overview Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-base font-semibold">Service Status</CardTitle>
            <CardDescription>Current Meta Cloud API integration health</CardDescription>
          </div>
          <div>
            {config?.status === "CONNECTED" && (
              <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium">
                <Check className="h-3 w-3 mr-1" /> Connected
              </Badge>
            )}
            {config?.status === "ERROR" && (
              <Badge variant="destructive" className="font-medium">
                <AlertCircle className="h-3 w-3 mr-1" /> Error
              </Badge>
            )}
            {config?.status === "UNCONFIGURED" && (
              <Badge variant="secondary" className="font-medium">
                Unconfigured
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3 bg-muted/40 rounded-lg">
              <span className="text-xs text-muted-foreground block">Display Name</span>
              <span className="font-medium text-sm">{config?.displayName || "—"}</span>
            </div>
            <div className="p-3 bg-muted/40 rounded-lg">
              <span className="text-xs text-muted-foreground block">Phone Number</span>
              <span className="font-medium text-sm">{config?.phoneNumber || "—"}</span>
            </div>
            <div className="p-3 bg-muted/40 rounded-lg">
              <span className="text-xs text-muted-foreground block">Last Verified</span>
              <span className="font-medium text-sm">
                {config?.lastTestedAt ? new Date(config.lastTestedAt).toLocaleString() : "Never"}
              </span>
            </div>
          </div>

          {config?.lastError && (
            <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-lg text-xs">
              <strong>Error:</strong> {config.lastError}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              disabled={testing || !config?.phoneNumberId}
            >
              {testing ? <Spinner className="h-4 w-4 mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Test Connection
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Meta Credentials Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Meta Cloud API Credentials</CardTitle>
          <CardDescription>
            Enter credentials from your Meta for Developers dashboard (WhatsApp Product).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="wabaId">WhatsApp Business Account ID (WABA ID)</Label>
                <Input
                  id="wabaId"
                  value={wabaId}
                  onChange={(e) => setWabaId(e.target.value)}
                  placeholder="e.g. 102938475610293"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumberId">Phone Number ID *</Label>
                <Input
                  id="phoneNumberId"
                  value={phoneNumberId}
                  onChange={(e) => setPhoneNumberId(e.target.value)}
                  placeholder="e.g. 109876543210987"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Display Phone Number</Label>
                <Input
                  id="phoneNumber"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g. +62 812-3456-7890"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayName">Business Display Name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Khair Studio Official"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accessToken">
                Meta Permanent Access Token {config?.hasToken && <span className="text-xs text-muted-foreground font-normal">(Encrypted token is saved: {config.tokenMasked})</span>}
              </Label>
              <div className="relative">
                <Input
                  id="accessToken"
                  type={showToken ? "text" : "password"}
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder={config?.hasToken ? "Enter new token to overwrite existing" : "EAAG..."}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-7 w-7 p-0"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Generate a permanent System User Token with <code>whatsapp_business_messaging</code> and <code>whatsapp_business_management</code> permissions.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhookVerifyToken">Webhook Verify Token</Label>
              <Input
                id="webhookVerifyToken"
                value={webhookVerifyToken}
                onChange={(e) => setWebhookVerifyToken(e.target.value)}
                placeholder="zsender_wa_verify_token"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? <Spinner className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save Configuration
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Webhook Configuration Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-emerald-600" />
            Meta Webhook Setup (Two-Way Messaging)
          </CardTitle>
          <CardDescription>
            Configure this Webhook Callback URL in Meta Developer Portal to receive incoming customer messages and delivery receipts in real-time.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Callback URL</Label>
              <div className="flex gap-2 mt-1">
                <Input readOnly value={config?.webhookUrl || ""} className="font-mono text-xs bg-muted/40" />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(config?.webhookUrl || "", true)}
                >
                  {copiedUrl ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Verify Token</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  readOnly
                  value={webhookVerifyToken || "zsender_wa_verify_token"}
                  className="font-mono text-xs bg-muted/40"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(webhookVerifyToken || "zsender_wa_verify_token", false)}
                >
                  {copiedToken ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          <div className="p-3 bg-muted/30 rounded-lg text-xs space-y-2 border">
            <div className="font-semibold flex items-center gap-1.5">
              <HelpCircle className="h-4 w-4 text-primary" /> Setup Steps in Meta App Dashboard:
            </div>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Open Meta for Developers &rarr; App &rarr; WhatsApp &rarr; Configuration.</li>
              <li>Under <strong>Webhook</strong>, click Edit and paste the Callback URL & Verify Token above.</li>
              <li>Click <strong>Verify and save</strong>.</li>
              <li>Under <strong>Webhook fields</strong>, click Manage and subscribe to <code>messages</code>.</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
