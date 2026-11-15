import {
  GetAccountCommand,
  SESv2Client,
  SendEmailCommand,
} from "@aws-sdk/client-sesv2";
import config from "../../config";
import providerRepository from "../../repositories/operator/provider.repository";
import { decryptCredentials, encryptCredentials } from "../../utils/crypto";
import logger from "../../utils/logger";
import emailSesClient from "../email-ses.client";

export type EmailProviderType = "SES" | "SMTP" | "SIMULATED";

export interface EmailProviderConfig {
  id: string;
  providerType: EmailProviderType;
  name: string;
  isActive: boolean;
  status: "CONNECTED" | "ERROR" | "UNTESTED";
  lastTestedAt: string | null;
  lastError: string | null;
  config: {
    region?: string;
    fromEmail?: string;
    fromName?: string;
    host?: string;
    port?: number;
    secure?: boolean;
    username?: string;
    sesEventsTopicArn?: string;
    sesEventsQueueUrl?: string;
  };
  hasCredentials: boolean;
  credentialsMasked?: {
    accessKeyId?: string;
    hasSecretKey?: boolean;
  };
  accountInfo?: {
    sendingEnabled: boolean;
    sandbox: boolean;
    max24Hour: number;
    maxPerSecond: number;
    sentLast24Hours: number;
  };
}

export interface UpdateEmailProviderInput {
  providerType: EmailProviderType;
  name?: string;
  isActive?: boolean;
  config: {
    region?: string;
    fromEmail?: string;
    fromName?: string;
    host?: string;
    port?: number;
    secure?: boolean;
    username?: string;
    sesEventsTopicArn?: string;
    sesEventsQueueUrl?: string;
  };
  credentials?: {
    accessKeyId?: string;
    secretAccessKey?: string;
    password?: string;
  };
}

export interface SendTestEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface StoredCredentials {
  accessKeyId?: string;
  secretAccessKey?: string;
  password?: string;
}

interface StoredConfig {
  region?: string;
  fromEmail?: string;
  fromName?: string;
  host?: string;
  port?: number;
  secure?: boolean;
  username?: string;
  sesEventsTopicArn?: string;
  sesEventsQueueUrl?: string;
}

class ProviderService {
  /**
   * Load active provider configuration and mask sensitive credentials.
   */
  async getConfig(): Promise<EmailProviderConfig> {
    const row = await providerRepository.getDefault();
    if (!row) throw new Error("Default provider not found");

    const creds = decryptCredentials<StoredCredentials>(row.credentials);
    const parsedConfig = (typeof row.config === "string" ? JSON.parse(row.config) : row.config || {}) as StoredConfig;

    // Fallbacks from environment variables if not set in DB
    const region = parsedConfig.region || config.AWS_SES_REGION || "ap-southeast-1";
    const fromEmail = parsedConfig.fromEmail || config.AWS_SES_FROM_EMAIL || "";
    const fromName = parsedConfig.fromName || config.AWS_SES_FROM_NAME || "ZSender";

    const accessKeyId = creds?.accessKeyId || config.AWS_SES_ACCESS_KEY || "";
    const hasSecretKey = Boolean(creds?.secretAccessKey || config.AWS_SES_SECRET_KEY);

    // Mask access key id: show first 4 and last 4 chars
    const maskedKey = accessKeyId
      ? `${accessKeyId.slice(0, 4)}••••••••${accessKeyId.slice(-4)}`
      : undefined;

    let accountInfo: EmailProviderConfig["accountInfo"] = undefined;
    if (row.provider_type === "SES") {
      try {
        const acct = await emailSesClient.getAccount();
        accountInfo = {
          sendingEnabled: acct.sendingEnabled,
          sandbox: acct.sandbox,
          max24Hour: acct.max24Hour,
          maxPerSecond: acct.maxPerSecond,
          sentLast24Hours: acct.sentLast24Hours,
        };
      } catch (err) {
        logger.warn(`Could not read SES account info: ${err instanceof Error ? err.message : err}`);
      }
    }

    return {
      id: row.id,
      providerType: (row.provider_type as EmailProviderType) || "SES",
      name: row.name,
      isActive: row.is_active,
      status: (row.status as EmailProviderConfig["status"]) || "UNTESTED",
      lastTestedAt: row.last_tested_at ? new Date(row.last_tested_at).toISOString() : null,
      lastError: row.last_error,
      config: {
        region,
        fromEmail,
        fromName,
        host: parsedConfig.host,
        port: parsedConfig.port,
        secure: parsedConfig.secure,
        username: parsedConfig.username,
        sesEventsTopicArn: parsedConfig.sesEventsTopicArn || config.SES_EVENTS_SNS_TOPIC_ARN,
        sesEventsQueueUrl: parsedConfig.sesEventsQueueUrl || config.SES_EVENTS_QUEUE_URL,
      },
      hasCredentials: Boolean(accessKeyId && hasSecretKey),
      credentialsMasked: {
        accessKeyId: maskedKey,
        hasSecretKey,
      },
      accountInfo,
    };
  }

  /**
   * Save provider configuration and optionally encrypt new credentials.
   */
  async updateConfig(input: UpdateEmailProviderInput): Promise<EmailProviderConfig> {
    const row = await providerRepository.getDefault();
    const existingCreds = decryptCredentials<StoredCredentials>(row?.credentials) || {};

    let newEncryptedCreds = row?.credentials ?? null;

    if (input.credentials) {
      const mergedCreds: StoredCredentials = {
        accessKeyId: input.credentials.accessKeyId || existingCreds.accessKeyId,
        secretAccessKey: input.credentials.secretAccessKey || existingCreds.secretAccessKey,
        password: input.credentials.password || existingCreds.password,
      };
      newEncryptedCreds = encryptCredentials(mergedCreds);
    }

    const updated = await providerRepository.updateDefault({
      provider_type: input.providerType,
      name: input.name || (input.providerType === "SES" ? "Amazon SES" : input.providerType === "SMTP" ? "Custom SMTP" : "Simulated"),
      is_active: input.isActive ?? true,
      credentials: newEncryptedCreds,
      config: input.config as Record<string, unknown>,
    });

    // Reconfigure email client live in memory
    if (input.providerType === "SES") {
      const creds = decryptCredentials<StoredCredentials>(newEncryptedCreds);
      if (creds?.accessKeyId && creds?.secretAccessKey) {
        emailSesClient.reconfigure({
          region: input.config.region || config.AWS_SES_REGION || "ap-southeast-1",
          accessKeyId: creds.accessKeyId,
          secretAccessKey: creds.secretAccessKey,
        });
      }
    } else if (input.providerType === "SIMULATED") {
      emailSesClient.reconfigure(null);
    }

    return this.getConfig();
  }

  /**
   * Test the connection to the provider.
   */
  async testConnection(): Promise<{
    success: boolean;
    error?: string;
    accountInfo?: EmailProviderConfig["accountInfo"];
  }> {
    const row = await providerRepository.getDefault();
    const creds = decryptCredentials<StoredCredentials>(row?.credentials);
    const parsedConfig = (typeof row?.config === "string" ? JSON.parse(row.config) : row?.config || {}) as StoredConfig;

    const providerType = row?.provider_type || "SES";

    if (providerType === "SIMULATED") {
      await providerRepository.updateDefault({
        status: "CONNECTED",
        last_error: null,
        last_tested_at: new Date(),
      });
      return {
        success: true,
        accountInfo: {
          sendingEnabled: true,
          sandbox: false,
          max24Hour: 50000,
          maxPerSecond: 14,
          sentLast24Hours: 0,
        },
      };
    }

    if (providerType === "SES") {
      const region = parsedConfig.region || config.AWS_SES_REGION || "ap-southeast-1";
      const accessKeyId = creds?.accessKeyId || config.AWS_SES_ACCESS_KEY;
      const secretAccessKey = creds?.secretAccessKey || config.AWS_SES_SECRET_KEY;

      if (!accessKeyId || !secretAccessKey) {
        const error = "AWS credentials (Access Key ID and Secret Access Key) are missing.";
        await providerRepository.updateDefault({
          status: "ERROR",
          last_error: error,
          last_tested_at: new Date(),
        });
        return { success: false, error };
      }

      try {
        const client = new SESv2Client({
          region,
          credentials: { accessKeyId, secretAccessKey },
          ...(config.AWS_ENDPOINT_URL ? { endpoint: config.AWS_ENDPOINT_URL } : {}),
        });

        const res = await client.send(new GetAccountCommand({}));

        const accountInfo = {
          sendingEnabled: res.SendingEnabled ?? false,
          sandbox: !(res.ProductionAccessEnabled ?? false),
          max24Hour: res.SendQuota?.Max24HourSend ?? 0,
          maxPerSecond: res.SendQuota?.MaxSendRate ?? 0,
          sentLast24Hours: res.SendQuota?.SentLast24Hours ?? 0,
        };

        await providerRepository.updateDefault({
          status: "CONNECTED",
          last_error: null,
          last_tested_at: new Date(),
        });

        // Also update memory client
        emailSesClient.reconfigure({ region, accessKeyId, secretAccessKey });

        return { success: true, accountInfo };
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        await providerRepository.updateDefault({
          status: "ERROR",
          last_error: errorMsg,
          last_tested_at: new Date(),
        });
        return { success: false, error: errorMsg };
      }
    }

    return { success: false, error: `Unsupported provider type: ${providerType}` };
  }

  /**
   * Send a test email to verify real delivery.
   */
  async sendTestEmail(to: string, subject?: string): Promise<SendTestEmailResult> {
    const row = await providerRepository.getDefault();
    const creds = decryptCredentials<StoredCredentials>(row?.credentials);
    const parsedConfig = (typeof row?.config === "string" ? JSON.parse(row.config) : row?.config || {}) as StoredConfig;

    const fromEmail = parsedConfig.fromEmail || config.AWS_SES_FROM_EMAIL;
    const fromName = parsedConfig.fromName || config.AWS_SES_FROM_NAME || "ZSender";

    if (!fromEmail) {
      throw new Error("Sender From Email is not configured. Please set From Email first.");
    }

    const region = parsedConfig.region || config.AWS_SES_REGION || "ap-southeast-1";
    const accessKeyId = creds?.accessKeyId || config.AWS_SES_ACCESS_KEY;
    const secretAccessKey = creds?.secretAccessKey || config.AWS_SES_SECRET_KEY;

    const sub = subject || `[ZSender] Test Email Delivery - ${new Date().toLocaleTimeString()}`;
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 40px 20px;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <div style="display: flex; align-items: center; margin-bottom: 24px;">
            <div style="background-color: #ab1757; color: white; border-radius: 8px; width: 40px; height: 40px; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; font-size: 20px; line-height: 40px; text-align: center; margin-right: 12px;">Z</div>
            <h2 style="margin: 0; color: #0f172a; font-size: 20px;">ZSender Connection Test</h2>
          </div>
          <p style="color: #334155; font-size: 15px; line-height: 1.6;">Selamat! Integrasi pengiriman email <strong>ZSender</strong> dengan <strong>Amazon Simple Email Service (SES)</strong> telah berhasil terhubung dan berfungsi dengan sempurna.</p>
          <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 24px 0; font-size: 13px; color: #475569;">
            <p style="margin: 4px 0;"><strong>Provider:</strong> Amazon Simple Email Service (SES)</p>
            <p style="margin: 4px 0;"><strong>Region:</strong> ${region}</p>
            <p style="margin: 4px 0;"><strong>Sender:</strong> ${fromName} &lt;${fromEmail}&gt;</p>
            <p style="margin: 4px 0;"><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          </div>
          <p style="color: #64748b; font-size: 13px; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 16px;">Email ini dikirim secara otomatis oleh ZSender Operator Console.</p>
        </div>
      </body>
      </html>
    `;

    const result = await emailSesClient.sendEmail({
      from: `${fromName} <${fromEmail}>`,
      to,
      subject: sub,
      html: htmlBody,
      text: `ZSender test email sent to ${to}`,
    });

    return { success: true, messageId: result.messageId };
  }
}

export default new ProviderService();
