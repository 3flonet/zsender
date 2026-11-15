-- Platform-level email provider configuration (AWS SES, SMTP, Simulated)
-- Allows operator to configure credentials and settings via web console UI.

CREATE TABLE "platform_email_providers" (
  "id" VARCHAR(36) PRIMARY KEY,
  "provider_type" VARCHAR(32) NOT NULL DEFAULT 'SES',
  "name" VARCHAR(100) NOT NULL DEFAULT 'Amazon SES',
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "credentials" TEXT, -- AES-256 encrypted JSON string of secret keys
  "config" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "status" VARCHAR(32) NOT NULL DEFAULT 'UNTESTED',
  "last_tested_at" TIMESTAMPTZ,
  "last_error" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed with a default row if empty, so there's always a record to read and edit
INSERT INTO "platform_email_providers" ("id", "provider_type", "name", "is_active", "config", "status")
VALUES ('default', 'SES', 'Amazon SES', true, '{"region": "ap-southeast-1", "fromName": "ZSender"}'::jsonb, 'UNTESTED')
ON CONFLICT ("id") DO NOTHING;
