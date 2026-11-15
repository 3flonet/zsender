-- 0003_whatsapp_module.sql
-- Multi-tenant Official WhatsApp Business (Meta Cloud API) integration
-- Adds phone number to contacts, tenant WhatsApp configurations, live chat conversations, messages, and templates.

-- 1. Add phone column to contacts
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "phone" TEXT;
CREATE INDEX IF NOT EXISTS "contacts_tenant_phone_idx" ON "contacts"("tenant_id", "phone");

-- 2. Tenant WhatsApp Configuration (Meta Cloud API credentials per tenant)
CREATE TABLE IF NOT EXISTS "tenant_whatsapp_configs" (
  "id" VARCHAR(64) PRIMARY KEY,
  "tenant_id" TEXT NOT NULL,
  "waba_id" VARCHAR(64),
  "phone_number_id" VARCHAR(64),
  "phone_number" VARCHAR(32),
  "display_name" VARCHAR(100),
  "access_token" TEXT, -- AES-256 encrypted
  "webhook_verify_token" VARCHAR(64) NOT NULL DEFAULT 'zsender_wa_verify_token',
  "status" VARCHAR(32) NOT NULL DEFAULT 'UNCONFIGURED', -- 'CONNECTED', 'ERROR', 'UNCONFIGURED'
  "last_tested_at" TIMESTAMPTZ,
  "last_error" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "tenant_whatsapp_configs_tenant_unique" UNIQUE ("tenant_id"),
  CONSTRAINT "tenant_whatsapp_configs_tenant_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
);

-- 3. WhatsApp Conversations (Threads for Live Chat)
CREATE TABLE IF NOT EXISTS "whatsapp_conversations" (
  "id" VARCHAR(64) PRIMARY KEY,
  "tenant_id" TEXT NOT NULL,
  "contact_id" TEXT,
  "wa_id" VARCHAR(32) NOT NULL, -- Customer WhatsApp number / ID (e.g. 628123456789)
  "contact_name" VARCHAR(100),
  "last_message" TEXT,
  "last_message_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "unread_count" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "whatsapp_conversations_tenant_wa_unique" UNIQUE ("tenant_id", "wa_id"),
  CONSTRAINT "whatsapp_conversations_tenant_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
  CONSTRAINT "whatsapp_conversations_contact_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "whatsapp_conversations_tenant_time_idx" ON "whatsapp_conversations"("tenant_id", "last_message_at" DESC);

-- 4. WhatsApp Messages (Individual chat bubbles)
CREATE TABLE IF NOT EXISTS "whatsapp_messages" (
  "id" VARCHAR(64) PRIMARY KEY,
  "tenant_id" TEXT NOT NULL,
  "conversation_id" VARCHAR(64) NOT NULL,
  "direction" VARCHAR(10) NOT NULL, -- 'INBOUND' (from customer) | 'OUTBOUND' (from agent)
  "wam_id" VARCHAR(128), -- Meta message ID
  "message_type" VARCHAR(32) NOT NULL DEFAULT 'text', -- 'text', 'template', 'image', 'document'
  "content" TEXT NOT NULL,
  "media_url" TEXT,
  "status" VARCHAR(32) NOT NULL DEFAULT 'SENT', -- 'PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED'
  "error_message" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "whatsapp_messages_tenant_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
  CONSTRAINT "whatsapp_messages_conversation_fkey" FOREIGN KEY ("conversation_id") REFERENCES "whatsapp_conversations"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "whatsapp_messages_conv_created_idx" ON "whatsapp_messages"("conversation_id", "created_at" ASC);
CREATE INDEX IF NOT EXISTS "whatsapp_messages_wamid_idx" ON "whatsapp_messages"("wam_id");

-- 5. WhatsApp Approved Templates
CREATE TABLE IF NOT EXISTS "whatsapp_templates" (
  "id" VARCHAR(64) PRIMARY KEY,
  "tenant_id" TEXT NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "category" VARCHAR(32) NOT NULL DEFAULT 'MARKETING', -- 'MARKETING', 'UTILITY', 'AUTHENTICATION'
  "language" VARCHAR(10) NOT NULL DEFAULT 'id',
  "status" VARCHAR(32) NOT NULL DEFAULT 'APPROVED', -- 'APPROVED', 'PENDING', 'REJECTED'
  "components" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "meta_template_id" VARCHAR(64),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "whatsapp_templates_tenant_name_lang_unique" UNIQUE ("tenant_id", "name", "language"),
  CONSTRAINT "whatsapp_templates_tenant_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
);

-- Seed Starter WhatsApp Templates for existing tenants
INSERT INTO "whatsapp_templates" ("id", "tenant_id", "name", "category", "language", "status", "components")
SELECT 
  'starter_promo_' || t.id,
  t.id,
  'promo_spesial_pelanggan',
  'MARKETING',
  'id',
  'APPROVED',
  '[
    {"type": "HEADER", "format": "TEXT", "text": "Promo Spesial ZSender!"},
    {"type": "BODY", "text": "Halo {{1}}, terima kasih telah menjadi pelanggan setia kami. Dapatkan diskon spesial hari ini dengan kode promo KHAIR2026. Balas pesan ini untuk info lebih lanjut!"},
    {"type": "FOOTER", "text": "Ketik STOP untuk berhenti berlangganan"}
  ]'::jsonb
FROM "tenants" t
ON CONFLICT DO NOTHING;

INSERT INTO "whatsapp_templates" ("id", "tenant_id", "name", "category", "language", "status", "components")
SELECT 
  'starter_order_' || t.id,
  t.id,
  'konfirmasi_pesanan',
  'UTILITY',
  'id',
  'APPROVED',
  '[
    {"type": "HEADER", "format": "TEXT", "text": "Konfirmasi Pesanan"},
    {"type": "BODY", "text": "Halo {{1}}, pesanan Anda dengan nomor #{{2}} telah berhasil kami terima dan sedang diproses. Tim kami akan segera menghubungi Anda."},
    {"type": "FOOTER", "text": "Layanan Pelanggan Resmi ZSender"}
  ]'::jsonb
FROM "tenants" t
ON CONFLICT DO NOTHING;
