// The operator email endpoints. Paths are relative to the console's base URL,
// which already ends in /api/v1/operator.

import { apiGet, apiPost, apiPut } from "@/lib/api/client";
import type {
  AccountHealth,
  DlqSummary,
  EmailProviderConfig,
  FleetOverview,
  OperatorTenantEmail,
  OperatorUnpauseInput,
  SendTestEmailInput,
  SendTestEmailResult,
  UpdateEmailProviderInput,
} from "@open-email/types";

export const getFleet = () => apiGet<FleetOverview>("/email/fleet");

export const getAccountHealth = () => apiGet<AccountHealth>("/email/account-health");

export const getDlq = () => apiGet<DlqSummary>("/email/dlq");

export const getTenantEmail = (tenantId: string) =>
  apiGet<OperatorTenantEmail>(`/tenants/${tenantId}/email`);

export const unpauseTenant = (tenantId: string, payload: OperatorUnpauseInput) =>
  apiPost<OperatorTenantEmail>(`/tenants/${tenantId}/email/unpause`, payload);

export const getProviderConfig = () => apiGet<EmailProviderConfig>("/email/provider");

export const updateProviderConfig = (payload: UpdateEmailProviderInput) =>
  apiPut<EmailProviderConfig>("/email/provider", payload);

export const testProviderConnection = () =>
  apiPost<{ success: boolean; error?: string; accountInfo?: EmailProviderConfig["accountInfo"] }>(
    "/email/provider/test"
  );

export const sendTestEmail = (payload: SendTestEmailInput) =>
  apiPost<SendTestEmailResult>("/email/provider/send-test", payload);
