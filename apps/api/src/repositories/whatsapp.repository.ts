import { Selectable, sql } from "kysely";
import { ulid } from "ulid";
import { db } from "../db/connection";
import type {
  tenant_whatsapp_configs,
  whatsapp_conversations,
  whatsapp_messages,
  whatsapp_templates,
} from "../db/types";

export type TenantWhatsAppConfigRow = Selectable<tenant_whatsapp_configs>;
export type WhatsAppConversationRow = Selectable<whatsapp_conversations>;
export type WhatsAppMessageRow = Selectable<whatsapp_messages>;
export type WhatsAppTemplateRow = Selectable<whatsapp_templates>;

class WhatsAppRepository {
  // ─── Config ───────────────────────────────────────────────────────────────

  async getConfig(tenantId: string): Promise<TenantWhatsAppConfigRow | undefined> {
    return db
      .selectFrom("tenant_whatsapp_configs")
      .selectAll()
      .where("tenant_id", "=", tenantId)
      .executeTakeFirst();
  }

  async getConfigByPhoneNumberId(phoneNumberId: string): Promise<TenantWhatsAppConfigRow | undefined> {
    return db
      .selectFrom("tenant_whatsapp_configs")
      .selectAll()
      .where("phone_number_id", "=", phoneNumberId)
      .executeTakeFirst();
  }

  async upsertConfig(
    tenantId: string,
    data: {
      waba_id?: string | null;
      phone_number_id?: string | null;
      phone_number?: string | null;
      display_name?: string | null;
      access_token?: string | null;
      webhook_verify_token?: string;
      status?: string;
      last_error?: string | null;
      last_tested_at?: Date | null;
    }
  ): Promise<TenantWhatsAppConfigRow> {
    const existing = await this.getConfig(tenantId);
    const now = new Date();

    if (existing) {
      const patch: Record<string, unknown> = { updated_at: now };
      if (data.waba_id !== undefined) patch.waba_id = data.waba_id;
      if (data.phone_number_id !== undefined) patch.phone_number_id = data.phone_number_id;
      if (data.phone_number !== undefined) patch.phone_number = data.phone_number;
      if (data.display_name !== undefined) patch.display_name = data.display_name;
      if (data.access_token !== undefined) patch.access_token = data.access_token;
      if (data.webhook_verify_token !== undefined) patch.webhook_verify_token = data.webhook_verify_token;
      if (data.status !== undefined) patch.status = data.status;
      if (data.last_error !== undefined) patch.last_error = data.last_error;
      if (data.last_tested_at !== undefined) patch.last_tested_at = data.last_tested_at;

      return db
        .updateTable("tenant_whatsapp_configs")
        .set(patch)
        .where("tenant_id", "=", tenantId)
        .returningAll()
        .executeTakeFirstOrThrow();
    }

    return db
      .insertInto("tenant_whatsapp_configs")
      .values({
        id: ulid(),
        tenant_id: tenantId,
        waba_id: data.waba_id ?? null,
        phone_number_id: data.phone_number_id ?? null,
        phone_number: data.phone_number ?? null,
        display_name: data.display_name ?? null,
        access_token: data.access_token ?? null,
        webhook_verify_token: data.webhook_verify_token ?? "zsender_wa_verify_token",
        status: data.status ?? "UNCONFIGURED",
        created_at: now,
        updated_at: now,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  // ─── Conversations ────────────────────────────────────────────────────────

  async listConversations(tenantId: string, search?: string): Promise<WhatsAppConversationRow[]> {
    let q = db
      .selectFrom("whatsapp_conversations")
      .selectAll()
      .where("tenant_id", "=", tenantId);

    if (search && search.trim()) {
      const pattern = `%${search.trim().toLowerCase()}%`;
      q = q.where(
        sql<boolean>`(lower(wa_id) like ${pattern} or lower(contact_name) like ${pattern} or lower(last_message) like ${pattern})`
      );
    }

    return q.orderBy("last_message_at", "desc").execute();
  }

  async getConversationById(
    tenantId: string,
    id: string
  ): Promise<WhatsAppConversationRow | undefined> {
    return db
      .selectFrom("whatsapp_conversations")
      .selectAll()
      .where("tenant_id", "=", tenantId)
      .where("id", "=", id)
      .executeTakeFirst();
  }

  async getOrCreateConversation(
    tenantId: string,
    waId: string,
    contactName?: string | null,
    contactId?: string | null
  ): Promise<WhatsAppConversationRow> {
    const cleanWaId = waId.replace(/\D/g, "");
    const existing = await db
      .selectFrom("whatsapp_conversations")
      .selectAll()
      .where("tenant_id", "=", tenantId)
      .where("wa_id", "=", cleanWaId)
      .executeTakeFirst();

    if (existing) {
      if (contactName && !existing.contact_name) {
        return db
          .updateTable("whatsapp_conversations")
          .set({ contact_name: contactName, updated_at: new Date() })
          .where("id", "=", existing.id)
          .returningAll()
          .executeTakeFirstOrThrow();
      }
      return existing;
    }

    // Try linking with contact if not provided
    let linkedContactId = contactId;
    if (!linkedContactId) {
      const contact = await db
        .selectFrom("contacts")
        .select("id")
        .where("tenant_id", "=", tenantId)
        .where("phone", "=", cleanWaId)
        .executeTakeFirst();
      if (contact) linkedContactId = contact.id;
    }

    const now = new Date();
    return db
      .insertInto("whatsapp_conversations")
      .values({
        id: ulid(),
        tenant_id: tenantId,
        contact_id: linkedContactId ?? null,
        wa_id: cleanWaId,
        contact_name: contactName ?? cleanWaId,
        last_message: null,
        last_message_at: now,
        unread_count: 0,
        created_at: now,
        updated_at: now,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async updateConversationMessage(
    id: string,
    lastMessage: string,
    incrementUnread = false
  ): Promise<void> {
    const patch: Record<string, unknown> = {
      last_message: lastMessage,
      last_message_at: new Date(),
      updated_at: new Date(),
    };
    if (incrementUnread) {
      patch.unread_count = sql`unread_count + 1`;
    }

    await db
      .updateTable("whatsapp_conversations")
      .set(patch)
      .where("id", "=", id)
      .execute();
  }

  async markAsRead(tenantId: string, id: string): Promise<void> {
    await db
      .updateTable("whatsapp_conversations")
      .set({ unread_count: 0, updated_at: new Date() })
      .where("tenant_id", "=", tenantId)
      .where("id", "=", id)
      .execute();
  }

  // ─── Messages ─────────────────────────────────────────────────────────────

  async listMessages(tenantId: string, conversationId: string): Promise<WhatsAppMessageRow[]> {
    return db
      .selectFrom("whatsapp_messages")
      .selectAll()
      .where("tenant_id", "=", tenantId)
      .where("conversation_id", "=", conversationId)
      .orderBy("created_at", "asc")
      .execute();
  }

  async createMessage(data: {
    tenant_id: string;
    conversation_id: string;
    direction: "INBOUND" | "OUTBOUND";
    wam_id?: string | null;
    message_type?: string;
    content: string;
    media_url?: string | null;
    status?: string;
    error_message?: string | null;
  }): Promise<WhatsAppMessageRow> {
    const now = new Date();
    return db
      .insertInto("whatsapp_messages")
      .values({
        id: ulid(),
        tenant_id: data.tenant_id,
        conversation_id: data.conversation_id,
        direction: data.direction,
        wam_id: data.wam_id ?? null,
        message_type: data.message_type ?? "text",
        content: data.content,
        media_url: data.media_url ?? null,
        status: data.status ?? (data.direction === "INBOUND" ? "READ" : "SENT"),
        error_message: data.error_message ?? null,
        created_at: now,
        updated_at: now,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async updateMessageStatusByWamId(
    wamId: string,
    status: string,
    errorMessage?: string | null
  ): Promise<void> {
    await db
      .updateTable("whatsapp_messages")
      .set({
        status,
        error_message: errorMessage ?? null,
        updated_at: new Date(),
      })
      .where("wam_id", "=", wamId)
      .execute();
  }

  // ─── Templates ────────────────────────────────────────────────────────────

  async listTemplates(tenantId: string): Promise<WhatsAppTemplateRow[]> {
    return db
      .selectFrom("whatsapp_templates")
      .selectAll()
      .where("tenant_id", "=", tenantId)
      .orderBy("created_at", "desc")
      .execute();
  }

  async getTemplateById(tenantId: string, id: string): Promise<WhatsAppTemplateRow | undefined> {
    return db
      .selectFrom("whatsapp_templates")
      .selectAll()
      .where("tenant_id", "=", tenantId)
      .where("id", "=", id)
      .executeTakeFirst();
  }

  async createTemplate(data: {
    tenant_id: string;
    name: string;
    category?: string;
    language?: string;
    status?: string;
    components: unknown;
    meta_template_id?: string | null;
  }): Promise<WhatsAppTemplateRow> {
    const now = new Date();
    return db
      .insertInto("whatsapp_templates")
      .values({
        id: ulid(),
        tenant_id: data.tenant_id,
        name: data.name,
        category: data.category ?? "MARKETING",
        language: data.language ?? "id",
        status: data.status ?? "APPROVED",
        components: JSON.stringify(data.components),
        meta_template_id: data.meta_template_id ?? null,
        created_at: now,
        updated_at: now,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }
}

export default new WhatsAppRepository();
