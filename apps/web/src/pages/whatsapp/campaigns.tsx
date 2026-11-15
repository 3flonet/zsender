import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Send,
  Users,
} from "lucide-react";
import type { Contact, WhatsAppTemplate } from "@open-email/types";
import { listContacts } from "@/lib/api/contacts";
import { listWhatsAppTemplates, sendWhatsAppBroadcast } from "@/lib/api/whatsapp";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

export default function WhatsAppCampaignsPage() {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [targetMode, setTargetMode] = useState<"ALL_CONTACTS" | "CUSTOM">("ALL_CONTACTS");
  const [customNumbersText, setCustomNumbersText] = useState("");
  const [contactsWithPhone, setContactsWithPhone] = useState<Contact[]>([]);
  const [loadingInit, setLoadingInit] = useState(true);
  const [sending, setSending] = useState(false);
  const [variables, setVariables] = useState<Record<string, string>>({
    "1": "Pelanggan Setia",
    "2": "DISKON50",
  });
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [broadcastResult, setBroadcastResult] = useState<{
    totalSent: number;
    templateName: string;
    results: Array<{ number: string; status: string; messageId: string }>;
  } | null>(null);

  const initData = async () => {
    try {
      setLoadingInit(true);
      const [tpls, contactsRes] = await Promise.all([
        listWhatsAppTemplates(),
        listContacts({ limit: 100 }),
      ]);
      setTemplates(tpls);
      if (tpls.length > 0 && !selectedTemplateId) {
        setSelectedTemplateId(tpls[0].id);
      }

      // Filter contacts that have a phone number
      const phoneContacts = (contactsRes.items || []).filter((c: any) => Boolean(c.phone));
      setContactsWithPhone(phoneContacts);
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to load broadcast initial data",
      });
    } finally {
      setLoadingInit(false);
    }
  };

  useEffect(() => {
    initData();
  }, []);

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  // Extract variables from body text like {{1}}, {{2}}
  const bodyComponent = selectedTemplate?.components?.find((c: any) => c.type === "BODY");
  const bodyText = bodyComponent?.text || "";
  const foundVarMatches = Array.from(new Set(bodyText.match(/\{\{(\d+)\}\}/g) || []));

  const handleLaunch = async () => {
    if (!selectedTemplateId || sending) return;

    let numbers: string[] = [];
    if (targetMode === "ALL_CONTACTS") {
      numbers = contactsWithPhone.map((c: any) => c.phone).filter(Boolean);
    } else {
      numbers = customNumbersText
        .split(/[\n,]+/)
        .map((s) => s.replace(/\D/g, "").trim())
        .filter(Boolean);
    }

    if (numbers.length === 0) {
      alert("No valid recipient phone numbers found!");
      return;
    }

    try {
      setSending(true);
      setFeedback(null);
      setBroadcastResult(null);

      const res = await sendWhatsAppBroadcast({
        templateId: selectedTemplateId,
        recipientNumbers: numbers,
        parameters: variables,
      });

      setBroadcastResult(res);
      setFeedback({
        type: "success",
        message: `Broadcast successfully completed! Sent to ${res.totalSent} recipient(s).`,
      });
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Broadcast failed to send",
      });
    } finally {
      setSending(false);
    }
  };

  // Preview body with replaced variables
  let previewText = bodyText;
  Object.entries(variables).forEach(([k, v]) => {
    previewText = previewText.replace(new RegExp(`\\{\\{${k}\\}\\}`, "g"), v || `{{${k}}}`);
  });

  if (loadingInit) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">WhatsApp Broadcast Campaigns</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Send bulk marketing or notification messages to your contacts using pre-approved WhatsApp templates.
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Form: 2 cols */}
        <div className="md:col-span-2 space-y-6">
          {/* Step 1: Select Template */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-800 text-xs flex items-center justify-center font-bold">
                  1
                </span>
                Choose Message Template
              </CardTitle>
              <CardDescription>Select the template to broadcast to recipients</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tplSelect">Template</Label>
                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                  <SelectTrigger id="tplSelect">
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name} ({t.category})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {foundVarMatches.length > 0 && (
                <div className="p-3 bg-muted/30 rounded-lg space-y-3 border">
                  <span className="text-xs font-semibold text-muted-foreground block">
                    Template Variable Values:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {foundVarMatches.map((match) => {
                      const num = match.replace(/\D/g, "");
                      return (
                        <div key={match} className="space-y-1">
                          <Label className="text-xs font-mono">Value for {match}</Label>
                          <Input
                            size={1}
                            className="h-8 text-xs"
                            value={variables[num] || ""}
                            onChange={(e) =>
                              setVariables({ ...variables, [num]: e.target.value })
                            }
                            placeholder={`e.g. John Doe`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 2: Select Audience */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-800 text-xs flex items-center justify-center font-bold">
                  2
                </span>
                Select Target Audience
              </CardTitle>
              <CardDescription>Choose who should receive this WhatsApp broadcast</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="targetMode"
                    checked={targetMode === "ALL_CONTACTS"}
                    onChange={() => setTargetMode("ALL_CONTACTS")}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>All Contacts with Phone ({contactsWithPhone.length})</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="targetMode"
                    checked={targetMode === "CUSTOM"}
                    onChange={() => setTargetMode("CUSTOM")}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Custom Phone Numbers</span>
                </label>
              </div>

              {targetMode === "ALL_CONTACTS" ? (
                <div className="p-3 bg-muted/30 rounded-lg text-xs space-y-2 border">
                  <div className="flex items-center gap-2 font-medium">
                    <Users className="h-4 w-4 text-emerald-600" />
                    <span>{contactsWithPhone.length} recipient(s) ready</span>
                  </div>
                  <p className="text-muted-foreground">
                    Contacts with a valid WhatsApp phone number in your Audience database.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="customNumbers">Phone Numbers (comma or line separated)</Label>
                  <Textarea
                    id="customNumbers"
                    value={customNumbersText}
                    onChange={(e) => setCustomNumbersText(e.target.value)}
                    placeholder="6281234567890, 6289876543210"
                    rows={3}
                  />
                  <span className="text-[11px] text-muted-foreground">
                    Include country code without '+' (e.g., 62812... for Indonesia)
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Pane: 1 col Preview & Launch */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Message Preview</CardTitle>
              <CardDescription>Customer screen simulation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* WhatsApp Bubble Preview */}
              <div className="bg-[#e7fedb]/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3.5 text-xs space-y-2 shadow-xs">
                {selectedTemplate?.components?.find((c: any) => c.type === "HEADER")?.text && (
                  <div className="font-bold text-foreground">
                    {selectedTemplate.components.find((c: any) => c.type === "HEADER")?.text}
                  </div>
                )}
                <div className="text-foreground whitespace-pre-wrap leading-relaxed">
                  {previewText || "Select a template to preview"}
                </div>
                {selectedTemplate?.components?.find((c: any) => c.type === "FOOTER")?.text && (
                  <div className="text-[10px] text-muted-foreground pt-1 border-t border-emerald-200/50">
                    {selectedTemplate.components.find((c: any) => c.type === "FOOTER")?.text}
                  </div>
                )}
              </div>

              <div className="pt-2">
                <Button
                  onClick={handleLaunch}
                  disabled={sending || !selectedTemplateId}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-11"
                >
                  {sending ? (
                    <Spinner className="h-4 w-4 mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Launch Broadcast Now
                </Button>
              </div>
            </CardContent>
          </Card>

          {broadcastResult && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                  <span>Broadcast Summary</span>
                  <Badge className="bg-emerald-500 text-white">Done</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Total Sent:</span>
                  <span className="font-bold">{broadcastResult.totalSent}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Template:</span>
                  <span className="font-mono">{broadcastResult.templateName}</span>
                </div>
                <div className="pt-2 max-h-40 overflow-y-auto space-y-1">
                  {broadcastResult.results.map((r, i) => (
                    <div key={i} className="flex items-center justify-between py-1 text-[11px]">
                      <span>+{r.number}</span>
                      <span className="text-emerald-600 font-medium">{r.status}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
