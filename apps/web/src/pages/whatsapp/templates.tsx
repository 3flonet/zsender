import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Layers,
  Plus,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import type { CreateWhatsAppTemplateInput, WhatsAppTemplate } from "@open-email/types";
import { createWhatsAppTemplate, listWhatsAppTemplates } from "@/lib/api/whatsapp";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

export default function WhatsAppTemplatesPage() {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [category, setCategory] = useState<"MARKETING" | "UTILITY" | "AUTHENTICATION">("MARKETING");
  const [language, setLanguage] = useState("id");
  const [headerText, setHeaderText] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [footerText, setFooterText] = useState("");

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await listWhatsAppTemplates();
      setTemplates(data);
    } catch (err) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Failed to load templates" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !bodyText.trim() || creating) return;

    try {
      setCreating(true);
      setFeedback(null);
      const input: CreateWhatsAppTemplateInput = {
        name: name.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_"),
        category,
        language,
        headerText: headerText.trim() || undefined,
        bodyText: bodyText.trim(),
        footerText: footerText.trim() || undefined,
      };
      await createWhatsAppTemplate(input);
      setCreateOpen(false);
      setName("");
      setHeaderText("");
      setBodyText("");
      setFooterText("");
      setFeedback({ type: "success", message: "WhatsApp Template registered and ready to use!" });
      loadTemplates();
    } catch (err) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Failed to create template" });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">WhatsApp Message Templates</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pre-approved message templates for outbound broadcasts and notifications via Meta Cloud API.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadTemplates} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <form onSubmit={handleCreate}>
                <DialogHeader>
                  <DialogTitle>Create WhatsApp Template</DialogTitle>
                  <DialogDescription>
                    Define message structure with variable placeholders like <code>{"{{1}}"}</code> for name, <code>{"{{2}}"}</code> for promo code, etc.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="tName">Template Name *</Label>
                      <Input
                        id="tName"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. promo_sale"
                        required
                      />
                      <span className="text-[10px] text-muted-foreground">Lowercase & underscores</span>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tCat">Category *</Label>
                      <Select
                        value={category}
                        onValueChange={(val: any) => setCategory(val)}
                      >
                        <SelectTrigger id="tCat">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MARKETING">MARKETING</SelectItem>
                          <SelectItem value="UTILITY">UTILITY</SelectItem>
                          <SelectItem value="AUTHENTICATION">AUTHENTICATION</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tLang">Language *</Label>
                      <Select
                        value={language}
                        onValueChange={(val: string) => setLanguage(val)}
                      >
                        <SelectTrigger id="tLang">
                          <SelectValue placeholder="Language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="id">Indonesian (id)</SelectItem>
                          <SelectItem value="en">English (en)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tHeader">Header Text (Optional)</Label>
                    <Input
                      id="tHeader"
                      value={headerText}
                      onChange={(e) => setHeaderText(e.target.value)}
                      placeholder="e.g. SPESIAL UNTUK ANDA 🎉"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tBody">Body Text *</Label>
                    <Textarea
                      id="tBody"
                      value={bodyText}
                      onChange={(e) => setBodyText(e.target.value)}
                      placeholder="Halo {{1}}, nikmati diskon spesial 50% untuk pesanan Anda berikutnya dengan kode {{2}}!"
                      rows={4}
                      required
                    />
                    <span className="text-[11px] text-muted-foreground">
                      Use <code>{"{{1}}"}</code>, <code>{"{{2}}"}</code> for dynamic customer values.
                    </span>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tFooter">Footer Text (Optional)</Label>
                    <Input
                      id="tFooter"
                      value={footerText}
                      onChange={(e) => setFooterText(e.target.value)}
                      placeholder="e.g. Balas STOP untuk berhenti berlangganan"
                    />
                  </div>

                  {/* Live WhatsApp preview bubble */}
                  {bodyText && (
                    <div className="p-3 bg-muted/40 rounded-lg space-y-1.5 border">
                      <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5 text-emerald-600" /> WhatsApp Bubble Preview:
                      </span>
                      <div className="max-w-xs bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 text-xs space-y-1">
                        {headerText && <div className="font-bold text-foreground">{headerText}</div>}
                        <div className="text-foreground whitespace-pre-wrap">{bodyText}</div>
                        {footerText && <div className="text-[10px] text-muted-foreground pt-1">{footerText}</div>}
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={creating} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    {creating ? <Spinner className="h-4 w-4 mr-2" /> : <Layers className="h-4 w-4 mr-2" />}
                    Save Template
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
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

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Spinner className="h-8 w-8 text-primary" />
        </div>
      ) : templates.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <Layers className="h-12 w-12 text-muted-foreground mx-auto opacity-30" />
          <h3 className="text-base font-semibold">No Templates Found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            You haven't created any WhatsApp message templates yet. Click "New Template" to register one.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((tpl) => {
            const comps = Array.isArray(tpl.components) ? tpl.components : [];
            const headerComp = comps.find((c) => c.type === "HEADER");
            const bodyComp = comps.find((c) => c.type === "BODY");
            const footerComp = comps.find((c) => c.type === "FOOTER");

            return (
              <Card key={tpl.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm font-semibold truncate font-mono">
                      {tpl.name}
                    </CardTitle>
                    <Badge
                      className={`text-[10px] uppercase font-semibold ${
                        tpl.status === "APPROVED"
                          ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                          : tpl.status === "PENDING"
                            ? "bg-amber-500 hover:bg-amber-600 text-white"
                            : "bg-red-500 hover:bg-red-600 text-white"
                      }`}
                    >
                      {tpl.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Badge variant="outline" className="text-[10px]">
                      {tpl.category}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">Lang: {tpl.language}</span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 flex-1 flex flex-col justify-between">
                  {/* WhatsApp Bubble Design */}
                  <div className="bg-[#e7fedb]/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-3 text-xs space-y-1.5 shadow-xs">
                    {headerComp?.text && (
                      <div className="font-bold text-foreground text-xs">{headerComp.text}</div>
                    )}
                    <div className="text-foreground whitespace-pre-wrap leading-relaxed">
                      {bodyComp?.text || "(No body content)"}
                    </div>
                    {footerComp?.text && (
                      <div className="text-[10px] text-muted-foreground pt-1 border-t border-emerald-200/50 dark:border-emerald-800/50">
                        {footerComp.text}
                      </div>
                    )}
                  </div>

                  <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-2">
                    <span>Created: {new Date(tpl.createdAt).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
