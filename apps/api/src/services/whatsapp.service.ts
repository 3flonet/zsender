import { ulid } from "ulid";
import config from "../config";
import whatsappRepository, {
  TenantWhatsAppConfigRow,
  WhatsAppConversationRow,
  WhatsAppMessageRow,
  WhatsAppTemplateRow,
} from "../repositories/whatsapp.repository";
import { decryptCredentials, encryptCredentials } from "../utils/crypto";
import logger from "../utils/logger";

const META_GRAPH_VERSION = "v21.0";

export interface StoredWhatsAppToken {
  token: string;
}

class WhatsAppService {
  /**
   * Get tenant WhatsApp configuration with masked token and webhook URL.
   */
  async getConfig(tenantId: string) {
    const row = await whatsappRepository.getConfig(tenantId);
    const tokenObj = decryptCredentials<StoredWhatsAppToken>(row?.access_token);
    const hasToken = Boolean(tokenObj?.token);

    let tokenMasked: string | undefined = undefined;
    if (tokenObj?.token) {
      const t = tokenObj.token;
      tokenMasked = t.length > 10 ? `${t.slice(0, 6)}••••••••${t.slice(-4)}` : "••••••••";
    }

    const publicBase = config.APP_PUBLIC_URL.replace(/\/$/, "");
    const webhookUrl = `${publicBase}/api/v1/webhooks/whatsapp`;

    return {
      id: row?.id ?? "",
      tenantId,
      wabaId: row?.waba_id ?? null,
      phoneNumberId: row?.phone_number_id ?? null,
      phoneNumber: row?.phone_number ?? null,
      displayName: row?.display_name ?? null,
      webhookVerifyToken: row?.webhook_verify_token ?? "zsender_wa_verify_token",
      webhookUrl,
      status: row?.status ?? "UNCONFIGURED",
      hasToken,
      tokenMasked,
      lastTestedAt: row?.last_tested_at ? new Date(row.last_tested_at).toISOString() : null,
      lastError: row?.last_error ?? null,
    };
  }

  /**
   * Update tenant WhatsApp credentials and settings.
   */
  async updateConfig(
    tenantId: string,
    input: {
      wabaId?: string;
      phoneNumberId?: string;
      phoneNumber?: string;
      displayName?: string;
      accessToken?: string;
      webhookVerifyToken?: string;
    }
  ) {
    let encryptedToken: string | undefined = undefined;
    if (input.accessToken && input.accessToken.trim()) {
      encryptedToken = encryptCredentials<StoredWhatsAppToken>({ token: input.accessToken.trim() });
    }

    await whatsappRepository.upsertConfig(tenantId, {
      waba_id: input.wabaId?.trim(),
      phone_number_id: input.phoneNumberId?.trim(),
      phone_number: input.phoneNumber?.trim(),
      display_name: input.displayName?.trim(),
      access_token: encryptedToken,
      webhook_verify_token: input.webhookVerifyToken?.trim(),
    });

    return this.getConfig(tenantId);
  }

  /**
   * Test connection to Meta Graph API for this tenant.
   */
  async testConnection(tenantId: string) {
    const row = await whatsappRepository.getConfig(tenantId);
    if (!row || !row.phone_number_id) {
      const err = "Phone Number ID is not configured yet.";
      await whatsappRepository.upsertConfig(tenantId, { status: "ERROR", last_error: err, last_tested_at: new Date() });
      return { success: false, error: err };
    }

    const tokenObj = decryptCredentials<StoredWhatsAppToken>(row.access_token);
    if (!tokenObj?.token) {
      const err = "Meta Access Token is missing.";
      await whatsappRepository.upsertConfig(tenantId, { status: "ERROR", last_error: err, last_tested_at: new Date() });
      return { success: false, error: err };
    }

    try {
      // Query Phone Number Info from Meta Graph API
      const res = await fetch(
        `https://graph.facebook.com/${META_GRAPH_VERSION}/${row.phone_number_id}`,
        {
          headers: { Authorization: `Bearer ${tokenObj.token}` },
          signal: AbortSignal.timeout(10000),
        }
      );

      const data: any = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || `Meta API error (${res.status})`);
      }

      const verifiedName = data.verified_name || data.display_phone_number || row.display_name;

      await whatsappRepository.upsertConfig(tenantId, {
        status: "CONNECTED",
        display_name: verifiedName,
        phone_number: data.display_phone_number || row.phone_number,
        last_error: null,
        last_tested_at: new Date(),
      });

      return {
        success: true,
        displayName: verifiedName,
        qualityRating: data.quality_rating,
        codeVerificationStatus: data.code_verification_status,
      };
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to connect to Meta WhatsApp API";

      await whatsappRepository.upsertConfig(tenantId, {
        status: "ERROR",
        last_error: errorMsg,
        last_tested_at: new Date(),
      });

      return { success: false, error: errorMsg };
    }
  }

  // ─── Live Chat & Conversations ───────────────────────────────────────────

  async listConversations(tenantId: string, search?: string) {
    const rows = await whatsappRepository.listConversations(tenantId, search);
    return rows.map((r) => ({
      id: r.id,
      tenantId: r.tenant_id,
      contactId: r.contact_id,
      waId: r.wa_id,
      contactName: r.contact_name,
      lastMessage: r.last_message,
      lastMessageAt: new Date(r.last_message_at).toISOString(),
      unreadCount: r.unread_count,
    }));
  }

  async getMessages(tenantId: string, conversationId: string) {
    // Mark conversation as read
    await whatsappRepository.markAsRead(tenantId, conversationId);

    const rows = await whatsappRepository.listMessages(tenantId, conversationId);
    return rows.map((r) => ({
      id: r.id,
      tenantId: r.tenant_id,
      conversationId: r.conversation_id,
      direction: r.direction as "INBOUND" | "OUTBOUND",
      wamId: r.wam_id,
      messageType: r.message_type as "text" | "template" | "image" | "document",
      content: r.content,
      mediaUrl: r.media_url,
      status: r.status as "PENDING" | "SENT" | "DELIVERED" | "READ" | "FAILED",
      errorMessage: r.error_message,
      createdAt: new Date(r.created_at).toISOString(),
    }));
  }

  /**
   * Send a reply message to customer via Meta Cloud API.
   */
  async sendReply(tenantId: string, conversationId: string, content: string) {
    const conv = await whatsappRepository.getConversationById(tenantId, conversationId);
    if (!conv) throw new Error("Conversation not found");

    const configRow = await whatsappRepository.getConfig(tenantId);
    const tokenObj = decryptCredentials<StoredWhatsAppToken>(configRow?.access_token);

    let wamId = `wamid.SIM_${ulid()}`;
    let status = "SENT";
    let errorMessage: string | null = null;

    // If real Meta credentials exist, call Meta Graph API
    if (configRow?.phone_number_id && tokenObj?.token) {
      try {
        const res = await fetch(
          `https://graph.facebook.com/${META_GRAPH_VERSION}/${configRow.phone_number_id}/messages`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${tokenObj.token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              recipient_type: "individual",
              to: conv.wa_id,
              type: "text",
              text: { preview_url: false, body: content },
            }),
            signal: AbortSignal.timeout(10000),
          }
        );

        const resData: any = await res.json();
        if (!res.ok) {
          throw new Error(resData?.error?.message || `Failed to send WhatsApp message (${res.status})`);
        }

        if (resData?.messages?.[0]?.id) {
          wamId = resData.messages[0].id;
        }
      } catch (err: unknown) {
        status = "FAILED";
        errorMessage = err instanceof Error ? err.message : "Failed to send WhatsApp message";
        logger.error(`[WhatsApp] Send error: ${errorMessage}`);
      }
    } else {
      // In simulated mode without Meta credentials, mark as DELIVERED
      status = "DELIVERED";
    }

    const msg = await whatsappRepository.createMessage({
      tenant_id: tenantId,
      conversation_id: conversationId,
      direction: "OUTBOUND",
      wam_id: wamId,
      message_type: "text",
      content,
      status,
      error_message: errorMessage,
    });

    await whatsappRepository.updateConversationMessage(conversationId, content, false);

    return {
      id: msg.id,
      conversationId,
      direction: "OUTBOUND",
      wamId,
      content,
      status,
      errorMessage,
      createdAt: new Date(msg.created_at).toISOString(),
    };
  }

  /**
   * Simulate an incoming customer WhatsApp message (for offline/local testing).
   */
  async simulateIncoming(
    tenantId: string,
    input: { waId: string; contactName?: string; message: string }
  ) {
    const conv = await whatsappRepository.getOrCreateConversation(
      tenantId,
      input.waId,
      input.contactName || `Customer ${input.waId.slice(-4)}`
    );

    const wamId = `wamid.IN_${ulid()}`;
    const msg = await whatsappRepository.createMessage({
      tenant_id: tenantId,
      conversation_id: conv.id,
      direction: "INBOUND",
      wam_id: wamId,
      message_type: "text",
      content: input.message,
      status: "READ",
    });

    await whatsappRepository.updateConversationMessage(conv.id, input.message, true);

    return {
      conversationId: conv.id,
      messageId: msg.id,
      waId: conv.wa_id,
      content: input.message,
      createdAt: new Date(msg.created_at).toISOString(),
    };
  }

  // ─── Meta Cloud API Webhook Handling ─────────────────────────────────────

  /**
   * Verify Webhook challenge from Meta.
   */
  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    if (mode === "subscribe" && token === "zsender_wa_verify_token") {
      return challenge;
    }
    return null;
  }

  /**
   * Handle incoming event payload from Meta Cloud API.
   */
  async handleWebhookPayload(payload: any): Promise<void> {
    try {
      const entry = payload.entry?.[0];
      const change = entry?.changes?.[0];
      const value = change?.value;
      if (!value) return;

      const phoneNumberId = value.metadata?.phone_number_id;

      // Handle delivery status updates (sent, delivered, read, failed)
      if (Array.isArray(value.statuses)) {
        for (const s of value.statuses) {
          const wamId = s.id;
          const status = s.status?.toUpperCase(); // DELIVERED, READ, FAILED
          const errorMsg = s.errors?.[0]?.message;
          if (wamId && status) {
            await whatsappRepository.updateMessageStatusByWamId(wamId, status, errorMsg);
          }
        }
      }

      // Handle incoming messages from customers
      if (Array.isArray(value.messages)) {
        // Find which tenant owns this phone_number_id
        let tenantId = "default";
        if (phoneNumberId) {
          const cfg = await whatsappRepository.getConfigByPhoneNumberId(phoneNumberId);
          if (cfg) tenantId = cfg.tenant_id;
        }

        const contactName = value.contacts?.[0]?.profile?.name;

        for (const m of value.messages) {
          const fromWaId = m.from;
          const wamId = m.id;
          let content = "(Attachment/Interactive message)";

          if (m.type === "text" && m.text?.body) {
            content = m.text.body;
          } else if (m.type === "button" && m.button?.text) {
            content = m.button.text;
          }

          const conv = await whatsappRepository.getOrCreateConversation(
            tenantId,
            fromWaId,
            contactName || `WA +${fromWaId}`
          );

          await whatsappRepository.createMessage({
            tenant_id: tenantId,
            conversation_id: conv.id,
            direction: "INBOUND",
            wam_id: wamId,
            message_type: m.type || "text",
            content,
            status: "READ",
          });

          await whatsappRepository.updateConversationMessage(conv.id, content, true);
        }
      }
    } catch (err) {
      logger.error(`[WhatsApp Webhook] Error processing payload: ${err instanceof Error ? err.message : err}`);
    }
  }

  // ─── Templates ────────────────────────────────────────────────────────────

  async listTemplates(tenantId: string) {
    const rows = await whatsappRepository.listTemplates(tenantId);
    return rows.map((r) => ({
      id: r.id,
      tenantId: r.tenant_id,
      name: r.name,
      category: r.category as "MARKETING" | "UTILITY" | "AUTHENTICATION",
      language: r.language,
      status: r.status as "APPROVED" | "PENDING" | "REJECTED",
      components: typeof r.components === "string" ? JSON.parse(r.components) : r.components,
      createdAt: new Date(r.created_at).toISOString(),
    }));
  }

  async createTemplate(
    tenantId: string,
    input: {
      name: string;
      category: "MARKETING" | "UTILITY" | "AUTHENTICATION";
      language: string;
      headerText?: string;
      bodyText: string;
      footerText?: string;
    }
  ) {
    const components: any[] = [];
    if (input.headerText?.trim()) {
      components.push({ type: "HEADER", format: "TEXT", text: input.headerText.trim() });
    }
    components.push({ type: "BODY", text: input.bodyText.trim() });
    if (input.footerText?.trim()) {
      components.push({ type: "FOOTER", text: input.footerText.trim() });
    }

    const row = await whatsappRepository.createTemplate({
      tenant_id: tenantId,
      name: input.name.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
      category: input.category,
      language: input.language || "id",
      status: "APPROVED",
      components,
    });

    return {
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      category: row.category,
      language: row.language,
      status: row.status,
      components,
      createdAt: new Date(row.created_at).toISOString(),
    };
  }

  /**
   * Broadcast an approved template to multiple WhatsApp numbers.
   */
  async sendBroadcast(
    tenantId: string,
    input: { templateId: string; recipientNumbers: string[]; parameters?: Record<string, string> }
  ) {
    const template = await whatsappRepository.getTemplateById(tenantId, input.templateId);
    if (!template) throw new Error("Template not found");

    const components = typeof template.components === "string" ? JSON.parse(template.components) : template.components;
    const bodyComp = components.find((c: any) => c.type === "BODY");
    let baseText = bodyComp?.text || `Broadcast from ${template.name}`;

    // Replace parameters like {{1}}, {{2}} if provided
    if (input.parameters) {
      Object.entries(input.parameters).forEach(([k, v]) => {
        baseText = baseText.replace(new RegExp(`\\{\\{${k}\\}\\}`, "g"), v);
      });
    }

    const results = [];
    for (const rawNumber of input.recipientNumbers) {
      const cleanNumber = rawNumber.replace(/\D/g, "");
      if (!cleanNumber) continue;

      const conv = await whatsappRepository.getOrCreateConversation(tenantId, cleanNumber);
      const res = await this.sendReply(tenantId, conv.id, baseText);
      results.push({ number: cleanNumber, status: res.status, messageId: res.id });
    }

    return {
      totalSent: results.length,
      templateName: template.name,
      results,
    };
  }
}

export default new WhatsAppService();
