import type {
  CreateWhatsAppTemplateInput,
  SendWhatsAppBroadcastInput,
  SimulateIncomingWhatsAppInput,
  UpdateWhatsAppConfigInput,
  WhatsAppConfig,
  WhatsAppConversation,
  WhatsAppMessage,
  WhatsAppTemplate,
} from "@open-email/types";
import { apiGet, apiPost, apiPut } from "./client";
import { toArray } from "./shape";

export const getWhatsAppConfig = () => apiGet<WhatsAppConfig>("/whatsapp/config");

export const updateWhatsAppConfig = (input: UpdateWhatsAppConfigInput) =>
  apiPut<WhatsAppConfig>("/whatsapp/config", input);

export const testWhatsAppConnection = () =>
  apiPost<{
    success: boolean;
    displayName?: string;
    qualityRating?: string;
    error?: string;
  }>("/whatsapp/config/test");

export const listWhatsAppConversations = async (search?: string) =>
  toArray<WhatsAppConversation>(
    await apiGet<unknown>("/whatsapp/conversations" + (search ? `?search=${encodeURIComponent(search)}` : ""))
  );

export const getWhatsAppMessages = async (conversationId: string) =>
  toArray<WhatsAppMessage>(
    await apiGet<unknown>(`/whatsapp/conversations/${conversationId}/messages`)
  );

export const sendWhatsAppReply = (conversationId: string, content: string) =>
  apiPost<WhatsAppMessage>(`/whatsapp/conversations/${conversationId}/reply`, { content });

export const simulateIncomingWhatsApp = (input: SimulateIncomingWhatsAppInput) =>
  apiPost<{
    conversationId: string;
    messageId: string;
    waId: string;
    content: string;
    createdAt: string;
  }>("/whatsapp/simulate-incoming", input);

export const listWhatsAppTemplates = async () =>
  toArray<WhatsAppTemplate>(await apiGet<unknown>("/whatsapp/templates"));

export const createWhatsAppTemplate = (input: CreateWhatsAppTemplateInput) =>
  apiPost<WhatsAppTemplate>("/whatsapp/templates", input);

export const sendWhatsAppBroadcast = (input: SendWhatsAppBroadcastInput) =>
  apiPost<{
    totalSent: number;
    templateName: string;
    results: Array<{ number: string; status: string; messageId: string }>;
  }>("/whatsapp/broadcast", input);
