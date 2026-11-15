import { Router } from "express";
import whatsappService from "../services/whatsapp.service";
import { asyncHandler } from "../utils/asynchandler";
import { created, ctx, ok, str } from "../utils/route";

const whatsappRouter = Router();

// ─── Settings / Configuration ────────────────────────────────────────────────

whatsappRouter.get(
  "/config",
  asyncHandler(async (req, res) => {
    const { tenantId } = ctx(req);
    ok(res, await whatsappService.getConfig(tenantId));
  })
);

whatsappRouter.put(
  "/config",
  asyncHandler(async (req, res) => {
    const { tenantId } = ctx(req);
    ok(res, await whatsappService.updateConfig(tenantId, req.body ?? {}));
  })
);

whatsappRouter.post(
  "/config/test",
  asyncHandler(async (req, res) => {
    const { tenantId } = ctx(req);
    ok(res, await whatsappService.testConnection(tenantId));
  })
);

// ─── Live Chat & Conversations ───────────────────────────────────────────────

whatsappRouter.get(
  "/conversations",
  asyncHandler(async (req, res) => {
    const { tenantId } = ctx(req);
    const search = str(req.query.search);
    ok(res, await whatsappService.listConversations(tenantId, search));
  })
);

whatsappRouter.get(
  "/conversations/:id/messages",
  asyncHandler(async (req, res) => {
    const { tenantId } = ctx(req);
    const conversationId = String(req.params.id);
    ok(res, await whatsappService.getMessages(tenantId, conversationId));
  })
);

whatsappRouter.post(
  "/conversations/:id/reply",
  asyncHandler(async (req, res) => {
    const { tenantId } = ctx(req);
    const conversationId = String(req.params.id);
    const { content } = req.body ?? {};
    if (!content || !String(content).trim()) {
      res.status(400).json({ error: "Message content cannot be empty" });
      return;
    }
    created(res, await whatsappService.sendReply(tenantId, conversationId, String(content)));
  })
);

whatsappRouter.post(
  "/simulate-incoming",
  asyncHandler(async (req, res) => {
    const { tenantId } = ctx(req);
    const { waId, contactName, message } = req.body ?? {};
    if (!waId || !message) {
      res.status(400).json({ error: "waId and message are required" });
      return;
    }
    created(res, await whatsappService.simulateIncoming(tenantId, { waId, contactName, message }));
  })
);

// ─── Templates ───────────────────────────────────────────────────────────────

whatsappRouter.get(
  "/templates",
  asyncHandler(async (req, res) => {
    const { tenantId } = ctx(req);
    ok(res, await whatsappService.listTemplates(tenantId));
  })
);

whatsappRouter.post(
  "/templates",
  asyncHandler(async (req, res) => {
    const { tenantId } = ctx(req);
    created(res, await whatsappService.createTemplate(tenantId, req.body ?? {}));
  })
);

// ─── Broadcast Campaigns ─────────────────────────────────────────────────────

whatsappRouter.post(
  "/broadcast",
  asyncHandler(async (req, res) => {
    const { tenantId } = ctx(req);
    const { templateId, recipientNumbers, parameters } = req.body ?? {};
    if (!templateId || !Array.isArray(recipientNumbers) || recipientNumbers.length === 0) {
      res.status(400).json({ error: "templateId and recipientNumbers array are required" });
      return;
    }
    ok(res, await whatsappService.sendBroadcast(tenantId, { templateId, recipientNumbers, parameters }));
  })
);

export default whatsappRouter;
