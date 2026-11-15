import { Selectable } from "kysely";
import { db } from "../../db/connection";
import type { platform_email_providers } from "../../db/types";

export type PlatformProviderRow = Selectable<platform_email_providers>;

class ProviderRepository {
  async getDefault(): Promise<PlatformProviderRow | undefined> {
    const row = await db
      .selectFrom("platform_email_providers")
      .selectAll()
      .where("id", "=", "default")
      .executeTakeFirst();

    if (row) return row;

    // Auto-create default row if missing
    return db
      .insertInto("platform_email_providers")
      .values({
        id: "default",
        provider_type: "SES",
        name: "Amazon SES",
        is_active: true,
        config: JSON.stringify({ region: "ap-southeast-1", fromName: "ZSender" }),
        status: "UNTESTED",
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async updateDefault(data: {
    provider_type?: string;
    name?: string;
    is_active?: boolean;
    credentials?: string | null;
    config?: Record<string, unknown>;
    status?: string;
    last_error?: string | null;
    last_tested_at?: Date | null;
  }): Promise<PlatformProviderRow> {
    const patch: Record<string, unknown> = { updated_at: new Date() };

    if (data.provider_type !== undefined) patch.provider_type = data.provider_type;
    if (data.name !== undefined) patch.name = data.name;
    if (data.is_active !== undefined) patch.is_active = data.is_active;
    if (data.credentials !== undefined) patch.credentials = data.credentials;
    if (data.config !== undefined) patch.config = JSON.stringify(data.config);
    if (data.status !== undefined) patch.status = data.status;
    if (data.last_error !== undefined) patch.last_error = data.last_error;
    if (data.last_tested_at !== undefined) patch.last_tested_at = data.last_tested_at;

    return db
      .updateTable("platform_email_providers")
      .set(patch)
      .where("id", "=", "default")
      .returningAll()
      .executeTakeFirstOrThrow();
  }
}

export default new ProviderRepository();
