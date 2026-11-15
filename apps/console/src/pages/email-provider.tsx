import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { EmailProviderType } from "@open-email/types";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  Globe,
  Key,
  Mail,
  RefreshCw,
  Send,
  Server,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  getProviderConfig,
  sendTestEmail,
  testProviderConnection,
  updateProviderConfig,
} from "@/lib/api/email";
import { formatDateTime, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const AWS_REGIONS = [
  { value: "ap-southeast-1", label: "Asia Pacific (Singapore) - ap-southeast-1" },
  { value: "ap-southeast-3", label: "Asia Pacific (Jakarta) - ap-southeast-3" },
  { value: "us-east-1", label: "US East (N. Virginia) - us-east-1" },
  { value: "us-west-2", label: "US West (Oregon) - us-west-2" },
  { value: "eu-central-1", label: "Europe (Frankfurt) - eu-central-1" },
  { value: "ap-northeast-1", label: "Asia Pacific (Tokyo) - ap-northeast-1" },
  { value: "ap-south-1", label: "Asia Pacific (Mumbai) - ap-south-1" },
  { value: "eu-west-1", label: "Europe (Ireland) - eu-west-1" },
];

export default function EmailProviderPage() {
  const qc = useQueryClient();

  // Queries
  const { data: provider, isLoading, isError, error } = useQuery({
    queryKey: ["email-provider"],
    queryFn: getProviderConfig,
  });

  // State
  const [providerType, setProviderType] = React.useState<EmailProviderType>("SES");
  const [region, setRegion] = React.useState("ap-southeast-1");
  const [accessKeyId, setAccessKeyId] = React.useState("");
  const [secretAccessKey, setSecretAccessKey] = React.useState("");
  const [fromEmail, setFromEmail] = React.useState("");
  const [fromName, setFromName] = React.useState("ZSender");
  const [showSecret, setShowSecret] = React.useState(false);
  const [isActive, setIsActive] = React.useState(true);

  // SMTP state
  const [smtpHost, setSmtpHost] = React.useState("");
  const [smtpPort, setSmtpPort] = React.useState(587);
  const [smtpUsername, setSmtpUsername] = React.useState("");
  const [smtpPassword, setSmtpPassword] = React.useState("");
  const [smtpSecure, setSmtpSecure] = React.useState(false);

  // Test email modal state
  const [testModalOpen, setTestModalOpen] = React.useState(false);
  const [testRecipient, setTestRecipient] = React.useState("");
  const [testSubject, setTestSubject] = React.useState("");

  // Sync form state when data is loaded
  React.useEffect(() => {
    if (!provider) return;
    setProviderType(provider.providerType);
    setIsActive(provider.isActive);
    if (provider.config) {
      if (provider.config.region) setRegion(provider.config.region);
      if (provider.config.fromEmail) setFromEmail(provider.config.fromEmail);
      if (provider.config.fromName) setFromName(provider.config.fromName);
      if (provider.config.host) setSmtpHost(provider.config.host);
      if (provider.config.port) setSmtpPort(provider.config.port);
      if (provider.config.username) setSmtpUsername(provider.config.username);
      if (provider.config.secure !== undefined) setSmtpSecure(provider.config.secure);
    }
  }, [provider]);

  // Mutations
  const saveMutation = useMutation({
    mutationFn: updateProviderConfig,
    onSuccess: () => {
      toast.success("Provider configuration saved successfully.");
      qc.invalidateQueries({ queryKey: ["email-provider"] });
      qc.invalidateQueries({ queryKey: ["account-health"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to save configuration.");
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: testProviderConnection,
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Connection test succeeded! Provider is healthy.");
      } else {
        toast.error(`Connection test failed: ${data.error || "Unknown error"}`);
      }
      qc.invalidateQueries({ queryKey: ["email-provider"] });
      qc.invalidateQueries({ queryKey: ["account-health"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to test connection.");
    },
  });

  const sendTestMutation = useMutation({
    mutationFn: sendTestEmail,
    onSuccess: (data) => {
      toast.success(`Test email sent successfully! Message ID: ${data.messageId || "OK"}`);
      setTestModalOpen(false);
      setTestRecipient("");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to send test email.");
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      providerType,
      isActive,
      config: {
        region,
        fromEmail,
        fromName,
        host: smtpHost,
        port: Number(smtpPort),
        username: smtpUsername,
        secure: smtpSecure,
      },
      credentials: {
        accessKeyId: accessKeyId.trim() || undefined,
        secretAccessKey: secretAccessKey.trim() || undefined,
        password: smtpPassword.trim() || undefined,
      },
    };

    saveMutation.mutate(payload);
  };

  const handleSendTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testRecipient) {
      toast.error("Please enter a recipient email address.");
      return;
    }
    sendTestMutation.mutate({
      to: testRecipient.trim(),
      subject: testSubject.trim() || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Email provider" description="Loading provider configuration..." />
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Email provider" description="Failed to load configuration." />
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Provider</CardTitle>
            <CardDescription>{(error as Error)?.message || "Unknown error occurred"}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const isConnected = provider?.status === "CONNECTED";
  const isErr = provider?.status === "ERROR";

  return (
    <div className="space-y-8">
      <PageHeader
        title="Email provider"
        description="Connect and manage your global sending infrastructure (Amazon SES, Custom SMTP, Simulated mode)."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => testConnectionMutation.mutate()}
              disabled={testConnectionMutation.isPending}
              className="gap-1.5"
            >
              <RefreshCw
                className={cn("size-3.5", testConnectionMutation.isPending && "animate-spin")}
                aria-hidden
              />
              Test Connection
            </Button>
            <Button
              size="sm"
              onClick={() => setTestModalOpen(true)}
              className="gap-1.5 bg-brand text-white hover:bg-brand/90"
            >
              <Send className="size-3.5" aria-hidden />
              Send Test Email
            </Button>
          </div>
        }
      />

      {/* Provider Status Radar Card */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Server className="size-4 text-brand" />
                Live Status & Deliverability
              </CardTitle>
              <CardDescription>
                {provider?.providerType === "SES"
                  ? "Connected to Amazon Simple Email Service (SES v2)"
                  : provider?.providerType === "SMTP"
                    ? "Connected to Custom SMTP Server"
                    : "Running in Simulated Mode (Local Mailpit Testing)"}
              </CardDescription>
            </div>
            <div>
              {isConnected ? (
                <Badge className="gap-1 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                  <CheckCircle2 className="size-3.5" />
                  CONNECTED & ACTIVE
                </Badge>
              ) : isErr ? (
                <Badge variant="destructive" className="gap-1">
                  <XCircle className="size-3.5" />
                  CONNECTION ERROR
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  <AlertTriangle className="size-3.5" />
                  UNTESTED / SIMULATED
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-2 border-t">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Account Access Tier</span>
              <p className="font-medium text-sm">
                {provider?.accountInfo?.sandbox === false ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="size-3.5" /> Production Ready
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="size-3.5" /> Sandbox Mode
                  </span>
                )}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Daily Send Quota</span>
              <p className="font-medium text-sm">
                {provider?.accountInfo
                  ? `${provider.accountInfo.sentLast24Hours.toLocaleString()} / ${provider.accountInfo.max24Hour.toLocaleString()}`
                  : "N/A"}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Max Throughput (TPS)</span>
              <p className="font-medium text-sm">
                {provider?.accountInfo ? `${provider.accountInfo.maxPerSecond} msgs / sec` : "N/A"}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Last Tested</span>
              <p className="font-medium text-sm text-muted-foreground">
                {provider?.lastTestedAt ? (
                  <span title={formatDateTime(provider.lastTestedAt)}>
                    {timeAgo(provider.lastTestedAt)}
                  </span>
                ) : (
                  "Never"
                )}
              </p>
            </div>
          </div>

          {provider?.lastError && (
            <div className="mt-4 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
              <strong>Error Details:</strong> {provider.lastError}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Provider Selector Tabs */}
      <div className="flex flex-wrap gap-2 border-b pb-2">
        <Button
          type="button"
          variant={providerType === "SES" ? "default" : "outline"}
          size="sm"
          onClick={() => setProviderType("SES")}
          className={cn("gap-2", providerType === "SES" && "bg-brand text-white hover:bg-brand/90")}
        >
          <Server className="size-4" />
          Amazon SES
          <Badge variant="secondary" className="ml-1 text-[10px] py-0 px-1">
            Recommended
          </Badge>
        </Button>
        <Button
          type="button"
          variant={providerType === "SMTP" ? "default" : "outline"}
          size="sm"
          onClick={() => setProviderType("SMTP")}
          className={cn("gap-2", providerType === "SMTP" && "bg-brand text-white hover:bg-brand/90")}
        >
          <Globe className="size-4" />
          Custom SMTP
          <Badge variant="secondary" className="ml-1 text-[10px] py-0 px-1">
            Universal
          </Badge>
        </Button>
        <Button
          type="button"
          variant={providerType === "SIMULATED" ? "default" : "outline"}
          size="sm"
          onClick={() => setProviderType("SIMULATED")}
          className={cn("gap-2", providerType === "SIMULATED" && "bg-brand text-white hover:bg-brand/90")}
        >
          <Mail className="size-4" />
          Simulated (Local Mailpit)
        </Button>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {providerType === "SES" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Amazon SES Credentials & Region</CardTitle>
              <CardDescription>
                Provide IAM credentials with <code className="font-mono text-xs">AmazonSESFullAccess</code> permissions.
                Keys are stored encrypted using AES-256-GCM.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label htmlFor="active-toggle" className="text-sm font-medium">
                    Enable Live Sending
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    When active, live campaigns and transactional emails will be dispatched through Amazon SES.
                  </p>
                </div>
                <Switch
                  id="active-toggle"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="aws-region">AWS Region</Label>
                  <select
                    id="aws-region"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {AWS_REGIONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="from-email">Default From Email</Label>
                  <Input
                    id="from-email"
                    type="email"
                    value={fromEmail}
                    onChange={(e) => setFromEmail(e.target.value)}
                    placeholder="admin@domainanda.com"
                    required
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Must be a verified identity in your Amazon SES account.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="access-key">AWS Access Key ID</Label>
                  <div className="relative">
                    <Input
                      id="access-key"
                      type="text"
                      value={accessKeyId}
                      onChange={(e) => setAccessKeyId(e.target.value)}
                      placeholder={provider?.credentialsMasked?.accessKeyId || "AKIAXXXXXXXXXXXXXXXX"}
                      className="font-mono text-sm"
                    />
                    <Key className="absolute right-3 top-2.5 size-4 text-muted-foreground" aria-hidden />
                  </div>
                  {provider?.credentialsMasked?.accessKeyId && !accessKeyId && (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                      ✓ Configured: {provider.credentialsMasked.accessKeyId} (leave empty to keep current)
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secret-key">AWS Secret Access Key</Label>
                  <div className="relative">
                    <Input
                      id="secret-key"
                      type={showSecret ? "text" : "password"}
                      value={secretAccessKey}
                      onChange={(e) => setSecretAccessKey(e.target.value)}
                      placeholder={provider?.credentialsMasked?.hasSecretKey ? "••••••••••••••••••••••••••••••••" : "Paste secret access key"}
                      className="font-mono text-sm pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                    >
                      {showSecret ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {provider?.credentialsMasked?.hasSecretKey && !secretAccessKey && (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                      ✓ Secret key is safely encrypted in database (leave empty to keep current)
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="from-name">Default Sender Name</Label>
                <Input
                  id="from-name"
                  type="text"
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                  placeholder="ZSender"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {providerType === "SMTP" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Custom SMTP Server Configuration</CardTitle>
              <CardDescription>
                Connect to any standard SMTP server (SendGrid, Mailgun, Brevo, Postmark, or private postfix).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="smtp-host">SMTP Host</Label>
                  <Input
                    id="smtp-host"
                    type="text"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    placeholder="smtp.mailgun.org"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-port">Port</Label>
                  <Input
                    id="smtp-port"
                    type="number"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(Number(e.target.value))}
                    placeholder="587"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="smtp-user">SMTP Username</Label>
                  <Input
                    id="smtp-user"
                    type="text"
                    value={smtpUsername}
                    onChange={(e) => setSmtpUsername(e.target.value)}
                    placeholder="postmaster@yourdomain.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-pass">SMTP Password / API Key</Label>
                  <Input
                    id="smtp-pass"
                    type="password"
                    value={smtpPassword}
                    onChange={(e) => setSmtpPassword(e.target.value)}
                    placeholder="Paste SMTP Password"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="smtp-from-email">From Email</Label>
                  <Input
                    id="smtp-from-email"
                    type="email"
                    value={fromEmail}
                    onChange={(e) => setFromEmail(e.target.value)}
                    placeholder="sender@domain.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-from-name">From Name</Label>
                  <Input
                    id="smtp-from-name"
                    type="text"
                    value={fromName}
                    onChange={(e) => setFromName(e.target.value)}
                    placeholder="ZSender"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="smtp-secure"
                  checked={smtpSecure}
                  onChange={(e) => setSmtpSecure(e.target.checked)}
                  className="rounded border-input text-brand focus:ring-brand"
                />
                <Label htmlFor="smtp-secure" className="text-sm cursor-pointer">
                  Use SSL/TLS (Port 465)
                </Label>
              </div>
            </CardContent>
          </Card>
        )}

        {providerType === "SIMULATED" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Simulated Testing Environment</CardTitle>
              <CardDescription>
                Zero-AWS offline test mode. Every outgoing email is safely trapped by Mailpit.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                In simulated mode, domains auto-verify without DNS propagation and messages produce realistic simulated delivery, bounce, and complaint feedback events locally.
              </p>
              <div className="p-3 bg-muted rounded-md text-xs space-y-1">
                <p><strong>Mailpit Inbox:</strong> <a href="http://localhost:8126" target="_blank" rel="noreferrer" className="text-brand hover:underline">http://localhost:8126</a></p>
                <p><strong>Safe Testing:</strong> No emails will be sent out over the internet.</p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-end gap-3 pt-4">
          <Button
            type="submit"
            disabled={saveMutation.isPending}
            className="bg-brand text-white hover:bg-brand/90 px-6"
          >
            {saveMutation.isPending ? "Saving..." : "Save Configuration"}
          </Button>
        </div>
      </form>

      {/* Send Test Email Modal */}
      <Dialog open={testModalOpen} onOpenChange={setTestModalOpen}>
        <DialogContent>
          <form onSubmit={handleSendTest}>
            <DialogHeader>
              <DialogTitle>Send Test Email</DialogTitle>
              <DialogDescription>
                Send an instant test email to verify that your provider credentials and delivery pipeline are working end-to-end.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="test-recipient">Recipient Email Address</Label>
                <Input
                  id="test-recipient"
                  type="email"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  placeholder="your-name@gmail.com"
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  If your Amazon SES account is still in Sandbox, this email must be verified in your AWS SES Console.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="test-subject">Subject (Optional)</Label>
                <Input
                  id="test-subject"
                  type="text"
                  value={testSubject}
                  onChange={(e) => setTestSubject(e.target.value)}
                  placeholder="ZSender Delivery Test"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setTestModalOpen(false)}
                disabled={sendTestMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={sendTestMutation.isPending}
                className="bg-brand text-white hover:bg-brand/90"
              >
                {sendTestMutation.isPending ? "Sending..." : "Send Test Email"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
