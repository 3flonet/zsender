import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Bot,
  Check,
  CheckCheck,
  MessageSquare,
  RefreshCw,
  Search,
  Send,
  Smartphone,
} from "lucide-react";
import type { WhatsAppConversation, WhatsAppMessage } from "@open-email/types";
import {
  getWhatsAppMessages,
  listWhatsAppConversations,
  sendWhatsAppReply,
  simulateIncomingWhatsApp,
} from "@/lib/api/whatsapp";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

export default function WhatsAppChatPage() {
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<WhatsAppConversation | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [search, setSearch] = useState("");

  // Simulation modal
  const [simOpen, setSimOpen] = useState(false);
  const [simPhone, setSimPhone] = useState("6281234567890");
  const [simName, setSimName] = useState("Budi Santoso");
  const [simMessage, setSimMessage] = useState("Halo admin, apakah promo diskon masih berlaku?");
  const [simulating, setSimulating] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConversations = async (silent = false) => {
    try {
      if (!silent) setLoadingConvs(true);
      const list = await listWhatsAppConversations(search);
      setConversations(list);
      if (!selectedConv && list.length > 0) {
        setSelectedConv(list[0]);
      } else if (selectedConv) {
        // update selected item in list if updated
        const updated = list.find((c) => c.id === selectedConv.id);
        if (updated) setSelectedConv(updated);
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      if (!silent) setLoadingConvs(false);
    }
  };

  const loadMessages = async (convId: string, silent = false) => {
    try {
      if (!silent) setLoadingMsgs(true);
      const msgs = await getWhatsAppMessages(convId);
      setMessages(msgs);
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      if (!silent) setLoadingMsgs(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadConversations();
  }, [search]);

  // When selected conversation changes
  useEffect(() => {
    if (selectedConv) {
      loadMessages(selectedConv.id);
    } else {
      setMessages([]);
    }
  }, [selectedConv?.id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Polling every 4 seconds for real-time live chat feel
  useEffect(() => {
    const timer = setInterval(() => {
      loadConversations(true);
      if (selectedConv) {
        loadMessages(selectedConv.id, true);
      }
    }, 4000);
    return () => clearInterval(timer);
  }, [selectedConv?.id]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyText.trim() || !selectedConv || sending) return;

    const textToSend = replyText.trim();
    setReplyText("");
    try {
      setSending(true);
      await sendWhatsAppReply(selectedConv.id, textToSend);
      await loadMessages(selectedConv.id, true);
      await loadConversations(true);
    } catch (err) {
      alert("Failed to send message: " + (err instanceof Error ? err.message : "Unknown error"));
      setReplyText(textToSend);
    } finally {
      setSending(false);
    }
  };

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simPhone.trim() || !simMessage.trim() || simulating) return;

    try {
      setSimulating(true);
      const res = await simulateIncomingWhatsApp({
        waId: simPhone.trim(),
        contactName: simName.trim() || undefined,
        message: simMessage.trim(),
      });
      setSimOpen(false);
      setSimMessage("");
      await loadConversations(false);
      // Select the conversation that received the message
      const found = conversations.find((c) => c.id === res.conversationId);
      if (found) {
        setSelectedConv(found);
      } else {
        const list = await listWhatsAppConversations();
        const target = list.find((c) => c.id === res.conversationId);
        if (target) setSelectedConv(target);
      }
    } catch (err) {
      alert("Simulation failed: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setSimulating(false);
    }
  };

  const formatTime = (isoString?: string | null) => {
    if (!isoString) return "";
    const d = new Date(isoString);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-h-[850px] min-h-[550px] border rounded-xl overflow-hidden bg-background shadow-sm">
      {/* Top Main Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/20">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-emerald-600" />
          <h1 className="text-base font-semibold">WhatsApp Live Chat</h1>
          <Badge variant="outline" className="text-xs text-emerald-700 bg-emerald-50 border-emerald-200">
            Two-Way Official
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={simOpen} onOpenChange={setSimOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="text-xs h-8">
                <Bot className="h-3.5 w-3.5 mr-1.5 text-primary" />
                Test Inbound Message
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSimulate}>
                <DialogHeader>
                  <DialogTitle>Simulate Incoming WhatsApp</DialogTitle>
                  <DialogDescription>
                    Send a test customer message into your live chat inbox without needing a live phone or webhook tunnel.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="simPhone">Customer Phone Number (WA ID)</Label>
                    <Input
                      id="simPhone"
                      value={simPhone}
                      onChange={(e) => setSimPhone(e.target.value)}
                      placeholder="e.g. 628123456789"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="simName">Customer Name</Label>
                    <Input
                      id="simName"
                      value={simName}
                      onChange={(e) => setSimName(e.target.value)}
                      placeholder="e.g. Budi Santoso"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="simMessage">Message Text</Label>
                    <Textarea
                      id="simMessage"
                      value={simMessage}
                      onChange={(e) => setSimMessage(e.target.value)}
                      placeholder="Halo admin..."
                      rows={3}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setSimOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={simulating}>
                    {simulating ? <Spinner className="h-4 w-4 mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                    Simulate Inbound
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Two-Pane Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Pane: Conversation List */}
        <div className="w-80 md:w-96 flex flex-col border-r bg-muted/10">
          {/* Search Bar */}
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>
          </div>

          {/* Conversation List Scroll Area */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/50">
            {loadingConvs ? (
              <div className="flex items-center justify-center p-8">
                <Spinner className="h-6 w-6 text-muted-foreground" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-xs space-y-2">
                <MessageSquare className="h-8 w-8 mx-auto opacity-30" />
                <p>No WhatsApp conversations yet.</p>
                <p>Click "Test Inbound Message" above to test chatting.</p>
              </div>
            ) : (
              conversations.map((c) => {
                const isSelected = selectedConv?.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedConv(c)}
                    className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors hover:bg-muted/50 ${
                      isSelected ? "bg-accent/40 font-medium" : ""
                    }`}
                  >
                    <Avatar className="h-10 w-10 shrink-0 mt-0.5">
                      <AvatarFallback className="bg-emerald-100 text-emerald-800 font-semibold text-xs">
                        {c.contactName?.slice(0, 2).toUpperCase() || c.waId.slice(-2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-sm font-semibold truncate text-foreground">
                          {c.contactName || c.waId}
                        </span>
                        <span className="text-[11px] text-muted-foreground shrink-0">
                          {formatTime(c.lastMessageAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p className="text-xs text-muted-foreground truncate">
                          {c.lastMessage || "No messages"}
                        </p>
                        {c.unreadCount > 0 && (
                          <span className="h-5 min-w-[20px] px-1.5 flex items-center justify-center text-[10px] font-bold bg-emerald-500 text-white rounded-full">
                            {c.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Chat Window */}
        {selectedConv ? (
          <div className="flex-1 flex flex-col bg-background">
            {/* Chat Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/10">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-emerald-100 text-emerald-800 text-xs font-semibold">
                    {selectedConv.contactName?.slice(0, 2).toUpperCase() || selectedConv.waId.slice(-2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-sm font-semibold leading-none">{selectedConv.contactName || selectedConv.waId}</h2>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Smartphone className="h-3 w-3 text-emerald-600" />
                    +{selectedConv.waId}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={() => loadMessages(selectedConv.id)}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f0f2f5]/50 dark:bg-muted/10">
              {loadingMsgs ? (
                <div className="flex items-center justify-center h-full">
                  <Spinner className="h-6 w-6 text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                  Send a message to start this conversation.
                </div>
              ) : (
                messages.map((m) => {
                  const isOutbound = m.direction === "OUTBOUND";
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isOutbound ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm text-sm ${
                          isOutbound
                            ? "bg-emerald-600 text-white rounded-br-xs"
                            : "bg-card text-card-foreground border rounded-bl-xs"
                        }`}
                      >
                        <p className="whitespace-pre-wrap leading-relaxed break-words">{m.content}</p>
                        <div
                          className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                            isOutbound ? "text-emerald-100" : "text-muted-foreground"
                          }`}
                        >
                          <span>{formatTime(m.createdAt)}</span>
                          {isOutbound && (
                            <span>
                              {m.status === "READ" ? (
                                <CheckCheck className="h-3.5 w-3.5 text-sky-200" />
                              ) : m.status === "DELIVERED" ? (
                                <CheckCheck className="h-3.5 w-3.5" />
                              ) : m.status === "SENT" ? (
                                <Check className="h-3.5 w-3.5" />
                              ) : m.status === "FAILED" ? (
                                <span title={m.errorMessage || "Failed to send"}>
                                  <AlertCircle className="h-3.5 w-3.5 text-red-200" />
                                </span>
                              ) : (
                                <span className="opacity-70">...</span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Bar */}
            <form onSubmit={handleSend} className="p-3 border-t bg-background flex items-center gap-2">
              <Input
                placeholder="Type a WhatsApp message (Press Enter to send)..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                disabled={sending}
                className="flex-1 text-sm h-10"
              />
              <Button type="submit" size="default" disabled={sending || !replyText.trim()} className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0">
                {sending ? <Spinner className="h-4 w-4" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
            <MessageSquare className="h-12 w-12 opacity-20 mb-3" />
            <h3 className="text-base font-medium text-foreground">Select a Conversation</h3>
            <p className="text-xs text-muted-foreground max-w-sm mt-1">
              Choose a contact from the left sidebar to view their message history and reply in real time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
