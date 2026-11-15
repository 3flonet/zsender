/**
 * Clean Seed for ZSender by Khair Studio.
 * Creates plans, platform operator, and a clean initial workspace ready for use.
 *
 *   pnpm demo:seed            seeds only when the database has no tenants
 *   pnpm demo:seed --force    wipes everything and reseeds
 *
 * Logins:
 *   Operator Console:  admin@khairstudio.com
 *   Tenant App:        admin@khairstudio.com
 *   Password:          EMAIL_DEMO_PASSWORD (from deploy/compose/.env or fallback)
 */
process.env.TZ = "UTC";

import bcrypt from "bcrypt";
import { ulid } from "ulid";
import { MODULES } from "../src/constants/modules.const";
import { closeDB, db } from "../src/db/connection";
import type { PlanRow } from "../src/repositories/operator/plans.repository";
import { planSnapshotSpecs } from "../src/services/operator/plan-snapshot";
import { ensureStarterTemplates } from "../src/services/starter-templates";
import { computeDnsRecords } from "../src/utils/email-dns";

export const DEMO_PASSWORD_FALLBACK = "Demo-Password123!";
const password = (): string => process.env.EMAIL_DEMO_PASSWORD || process.env.DEMO_PASSWORD || DEMO_PASSWORD_FALLBACK;

const PLANS = [
  {
    key: "STARTER",
    name: "Starter",
    description: "Paket awal untuk newsletter dan audience skala kecil",
    modules: ["audience", "templates", "campaigns", "analytics", "email"],
    limits: { monthlyEmails: 10000, maxContacts: 5000, maxDomains: 2, maxUsers: 3 },
    sort_order: 0,
  },
  {
    key: "GROWTH",
    name: "Growth",
    description: "Kampanye reguler, multi-sender, dan kolaborasi tim",
    modules: [...MODULES],
    limits: { monthlyEmails: 100000, maxContacts: 50000, maxDomains: 10, maxUsers: 15 },
    sort_order: 1,
  },
  {
    key: "SCALE",
    name: "Enterprise",
    description: "Volume tak terbatas untuk bisnis berkembang dan platform skala besar",
    modules: [...MODULES],
    limits: { monthlyEmails: 1000000, maxContacts: 1000000, maxDomains: 50, maxUsers: 100 },
    sort_order: 2,
  },
];

async function wipe() {
  console.log("[seed] Membersihkan database lama...");
  await db.deleteFrom("tenants").execute(); // cascades to all tenant tables
  await db.deleteFrom("operator_audit_logs").execute();
  await db.deleteFrom("operator_users").execute();
  await db.deleteFrom("plans").execute();
}

async function seedPlansAndOperator() {
  const t = new Date();
  for (const p of PLANS) {
    await db
      .insertInto("plans")
      .values({
        id: ulid(),
        key: p.key,
        name: p.name,
        description: p.description,
        modules: JSON.stringify(p.modules),
        limits: JSON.stringify(p.limits),
        is_active: true,
        sort_order: p.sort_order,
        created_at: t,
        updated_at: t,
      })
      .execute();
  }

  // Operator account
  const passHash = await bcrypt.hash(password(), 12);
  await db
    .insertInto("operator_users")
    .values({
      id: ulid(),
      email: "admin@khairstudio.com",
      name: "Khair Studio Admin",
      password_hash: passHash,
      role: "SUPERADMIN",
      status: "ACTIVE",
      created_at: t,
      updated_at: t,
    })
    .execute();
  console.log("[seed] Operator Platform berhasil dibuat: admin@khairstudio.com");
}

async function seedKhairStudio() {
  const plan = (await db.selectFrom("plans").selectAll().where("key", "=", "SCALE").executeTakeFirstOrThrow()) as PlanRow;
  const t = new Date();
  const tenantId = ulid();

  // Create Workspace Khair Studio
  await db
    .insertInto("tenants")
    .values({
      id: tenantId,
      slug: "khair-studio",
      name: "Khair Studio",
      plan_key: "SCALE",
      brand_color: "#ab1757",
      timezone: "Asia/Jakarta",
      company_address: "Khair Studio",
      status: "ACTIVE",
      email_sending_status: "ACTIVE",
      email_sending_status_changed_at: null,
      created_at: t,
      updated_at: t,
    })
    .execute();

  // Set Entitlements
  await db
    .insertInto("tenant_entitlements")
    .values(
      planSnapshotSpecs(plan).map((s) => ({
        id: ulid(),
        tenant_id: tenantId,
        code: s.code,
        enabled: s.enabled,
        limit_value: s.limit_value,
        source: "PLAN" as const,
        created_at: t,
        updated_at: t,
      }))
    )
    .execute();

  // Add Admin User to Khair Studio workspace
  const passHash = await bcrypt.hash(password(), 12);
  await db
    .insertInto("users")
    .values({
      id: ulid(),
      tenant_id: tenantId,
      name: "Admin Khair Studio",
      email: "admin@khairstudio.com",
      password_hash: passHash,
      role: "ADMIN",
      status: "ACTIVE",
      created_at: t,
      updated_at: t,
    })
    .execute();

  // Add Default Starter Templates
  await ensureStarterTemplates(tenantId);

  // Setup sample pending sending domain for illustration
  const domainId = ulid();
  const records = computeDnsRecords("mail.khairstudio.com", ["sim4h2k9a1x0z", "sim7p3m5c8q2w", "sim9d6t1v4n3b"], "us-east-1", "track.khairstudio.com");
  await db
    .insertInto("email_sending_domains")
    .values({
      id: domainId,
      tenant_id: tenantId,
      subdomain: "mail.khairstudio.com",
      mail_from_subdomain: "bounce.mail.khairstudio.com",
      ses_configuration_set: `email-tenant-${tenantId}`,
      status: "PENDING",
      dkim_status: "PENDING",
      mail_from_status: "PENDING",
      dns_records: JSON.stringify(records),
      tracking_domain: "track.mail.khairstudio.com",
      tracking_status: "PENDING",
      created_at: t,
      updated_at: t,
    })
    .execute();

  // Custom fields
  await db
    .insertInto("custom_fields")
    .values([
      { id: ulid(), tenant_id: tenantId, key: "company", label: "Perusahaan", type: "text", created_at: t },
      { id: ulid(), tenant_id: tenantId, key: "phone", label: "Nomor WhatsApp/HP", type: "text", created_at: t },
      { id: ulid(), tenant_id: tenantId, key: "city", label: "Kota", type: "text", created_at: t },
    ])
    .execute();

  // Clean initial lists
  await db
    .insertInto("lists")
    .values([
      { id: ulid(), tenant_id: tenantId, name: "Newsletter", description: "Langganan newsletter utama", double_opt_in: false, created_at: t, updated_at: t },
      { id: ulid(), tenant_id: tenantId, name: "Pelanggan", description: "Daftar pelanggan aktif", double_opt_in: false, created_at: t, updated_at: t },
      { id: ulid(), tenant_id: tenantId, name: "Leads", description: "Prospek dan calon pelanggan", double_opt_in: false, created_at: t, updated_at: t },
    ])
    .execute();

  console.log("[seed] Workspace Khair Studio berhasil dibuat (Bersih tanpa kontak fiktif).");
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Seeder ini menolak dijalankan pada mode production.");
  }
  const force = process.argv.includes("--force");
  const existing = await db.selectFrom("tenants").select("id").limit(1).executeTakeFirst();
  const op = await db.selectFrom("operator_users").select("id").limit(1).executeTakeFirst();
  if ((existing || op) && !force) {
    console.log("[seed] Data sudah ada; jalankan dengan flag --force untuk mereset.");
    return;
  }
  if (force) await wipe();
  await seedPlansAndOperator();
  await seedKhairStudio();
  console.log("====================================================");
  console.log("🎉 SEEDING SELESAI!");
  console.log("Platform: ZSender by Khair Studio");
  console.log("Operator Console (http://localhost:3660): admin@khairstudio.com");
  console.log("Tenant App (http://localhost:3650):       admin@khairstudio.com");
  console.log("Password:                                ", password());
  console.log("====================================================");
}

main()
  .catch((err) => {
    console.error("[seed] GAGAL:", err instanceof Error ? err.stack : err);
    process.exitCode = 1;
  })
  .finally(() => closeDB());
