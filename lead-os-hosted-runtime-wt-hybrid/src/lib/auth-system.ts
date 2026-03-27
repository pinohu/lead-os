import { createHash } from "node:crypto";
import { getPool } from "./db.ts";

export type UserRole = "owner" | "admin" | "operator" | "viewer" | "billing-admin";

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  tenantId: string;
  role: UserRole;
  apiKeys: ApiKeyRecord[];
  ssoProvider?: string;
  ssoSubject?: string;
  lastLoginAt?: string;
  status: "active" | "suspended" | "invited";
  createdAt: string;
  updatedAt: string;
}

export interface ApiKeyRecord {
  id: string;
  name: string;
  keyHash: string;
  prefix: string;
  permissions: string[];
  lastUsedAt?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface SessionRecord {
  id: string;
  userId: string;
  tenantId: string;
  role: UserRole;
  expiresAt: string;
  createdAt: string;
}

export interface TeamInvite {
  id: string;
  email: string;
  tenantId: string;
  role: UserRole;
  invitedBy: string;
  expiresAt: string;
  status: "pending" | "accepted" | "expired";
  createdAt: string;
}

const ROLE_PERMISSIONS: Record<UserRole, Set<string>> = {
  owner: new Set(["*"]),
  admin: new Set([
    "read:leads", "write:leads",
    "read:funnels", "write:funnels",
    "read:magnets", "write:magnets",
    "read:experiments", "write:experiments",
    "read:analytics",
    "read:team", "write:team",
    "read:settings", "write:settings",
    "read:marketplace", "write:marketplace",
    "read:provisioning", "write:provisioning",
  ]),
  operator: new Set([
    "read:leads", "write:leads",
    "read:funnels", "write:funnels",
    "read:magnets", "write:magnets",
    "read:experiments", "write:experiments",
    "read:analytics",
    "read:marketplace",
  ]),
  viewer: new Set([
    "read:leads",
    "read:funnels",
    "read:magnets",
    "read:experiments",
    "read:analytics",
    "read:team",
    "read:settings",
    "read:marketplace",
    "read:provisioning",
  ]),
  "billing-admin": new Set([
    "read:analytics",
    "read:billing", "write:billing",
    "read:usage",
  ]),
};

const userStore = new Map<string, UserAccount>();
const emailIndex = new Map<string, string>();
const apiKeyStore = new Map<string, ApiKeyRecord & { userId: string }>();
const sessionStore = new Map<string, SessionRecord>();
const inviteStore = new Map<string, TeamInvite>();

let schemaReady: Promise<void> | null = null;

async function ensureSchema(): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  if (schemaReady) return schemaReady;

  schemaReady = (async () => {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS lead_os_users (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL,
          tenant_id TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          payload JSONB NOT NULL
        );
        CREATE UNIQUE INDEX IF NOT EXISTS idx_lead_os_users_email_tenant
          ON lead_os_users (email, tenant_id);
        CREATE INDEX IF NOT EXISTS idx_lead_os_users_tenant
          ON lead_os_users (tenant_id);

        CREATE TABLE IF NOT EXISTS lead_os_api_keys (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES lead_os_users(id) ON DELETE CASCADE,
          prefix TEXT NOT NULL,
          key_hash TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          payload JSONB NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_lead_os_api_keys_prefix
          ON lead_os_api_keys (prefix);
        CREATE INDEX IF NOT EXISTS idx_lead_os_api_keys_user
          ON lead_os_api_keys (user_id);

        CREATE TABLE IF NOT EXISTS lead_os_sessions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES lead_os_users(id) ON DELETE CASCADE,
          tenant_id TEXT NOT NULL,
          role TEXT NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_lead_os_sessions_user
          ON lead_os_sessions (user_id);

        CREATE TABLE IF NOT EXISTS lead_os_invites (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL,
          tenant_id TEXT NOT NULL,
          role TEXT NOT NULL,
          invited_by TEXT NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_lead_os_invites_tenant
          ON lead_os_invites (tenant_id);
        CREATE INDEX IF NOT EXISTS idx_lead_os_invites_email
          ON lead_os_invites (email);
      `);
    } catch (error) {
      schemaReady = null;
      throw error;
    }
  })();

  return schemaReady;
}

function hashKey(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

function generateId(): string {
  return crypto.randomUUID();
}

function nowISO(): string {
  return new Date().toISOString();
}

function emailKey(email: string, tenantId: string): string {
  return `${email.trim().toLowerCase()}::${tenantId}`;
}

function userToRecord(row: { id: string; email: string; tenant_id: string; created_at: Date; updated_at: Date; payload: Record<string, unknown> }): UserAccount {
  const p = row.payload;
  return {
    id: row.id,
    email: row.email,
    name: p.name as string,
    tenantId: row.tenant_id,
    role: p.role as UserRole,
    apiKeys: (p.apiKeys as ApiKeyRecord[]) ?? [],
    ssoProvider: p.ssoProvider as string | undefined,
    ssoSubject: p.ssoSubject as string | undefined,
    lastLoginAt: p.lastLoginAt as string | undefined,
    status: p.status as UserAccount["status"],
    createdAt: row.created_at.toISOString?.() ?? String(row.created_at),
    updatedAt: row.updated_at.toISOString?.() ?? String(row.updated_at),
  };
}

export interface CreateUserInput {
  email: string;
  name: string;
  tenantId: string;
  role: UserRole;
  ssoProvider?: string;
  ssoSubject?: string;
  status?: UserAccount["status"];
}

export async function createUser(input: CreateUserInput): Promise<UserAccount> {
  await ensureSchema();

  const id = generateId();
  const now = nowISO();
  const normalizedEmail = input.email.trim().toLowerCase();

  const user: UserAccount = {
    id,
    email: normalizedEmail,
    name: input.name,
    tenantId: input.tenantId,
    role: input.role,
    apiKeys: [],
    ssoProvider: input.ssoProvider,
    ssoSubject: input.ssoSubject,
    status: input.status ?? "active",
    createdAt: now,
    updatedAt: now,
  };

  const pool = getPool();
  if (pool) {
    const payload = {
      name: user.name,
      role: user.role,
      apiKeys: user.apiKeys,
      ssoProvider: user.ssoProvider,
      ssoSubject: user.ssoSubject,
      lastLoginAt: user.lastLoginAt,
      status: user.status,
    };
    await pool.query(
      `INSERT INTO lead_os_users (id, email, tenant_id, created_at, updated_at, payload)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [user.id, user.email, user.tenantId, now, now, JSON.stringify(payload)],
    );
  }

  userStore.set(id, user);
  emailIndex.set(emailKey(normalizedEmail, input.tenantId), id);
  return user;
}

export async function getUserByEmail(email: string, tenantId: string): Promise<UserAccount | null> {
  await ensureSchema();

  const normalizedEmail = email.trim().toLowerCase();
  const memId = emailIndex.get(emailKey(normalizedEmail, tenantId));
  if (memId) return userStore.get(memId) ?? null;

  const pool = getPool();
  if (!pool) return null;

  const result = await pool.query(
    `SELECT id, email, tenant_id, created_at, updated_at, payload
     FROM lead_os_users WHERE email = $1 AND tenant_id = $2 LIMIT 1`,
    [normalizedEmail, tenantId],
  );

  if (result.rows.length === 0) return null;

  const user = userToRecord(result.rows[0]);
  userStore.set(user.id, user);
  emailIndex.set(emailKey(user.email, user.tenantId), user.id);
  return user;
}

export async function getUserById(id: string): Promise<UserAccount | null> {
  await ensureSchema();

  const memUser = userStore.get(id);
  if (memUser) return memUser;

  const pool = getPool();
  if (!pool) return null;

  const result = await pool.query(
    `SELECT id, email, tenant_id, created_at, updated_at, payload
     FROM lead_os_users WHERE id = $1 LIMIT 1`,
    [id],
  );

  if (result.rows.length === 0) return null;

  const user = userToRecord(result.rows[0]);
  userStore.set(user.id, user);
  emailIndex.set(emailKey(user.email, user.tenantId), user.id);
  return user;
}

export async function listUsers(tenantId: string): Promise<UserAccount[]> {
  await ensureSchema();

  const pool = getPool();
  if (pool) {
    const result = await pool.query(
      `SELECT id, email, tenant_id, created_at, updated_at, payload
       FROM lead_os_users WHERE tenant_id = $1 ORDER BY created_at ASC`,
      [tenantId],
    );
    const users = result.rows.map(userToRecord);
    for (const u of users) {
      userStore.set(u.id, u);
      emailIndex.set(emailKey(u.email, u.tenantId), u.id);
    }
    return users;
  }

  return Array.from(userStore.values()).filter((u) => u.tenantId === tenantId);
}

export async function updateUser(id: string, patch: Partial<Pick<UserAccount, "name" | "role" | "status" | "lastLoginAt">>): Promise<UserAccount | null> {
  await ensureSchema();

  const existing = await getUserById(id);
  if (!existing) return null;

  const now = nowISO();
  const updated: UserAccount = {
    ...existing,
    ...patch,
    updatedAt: now,
  };

  const pool = getPool();
  if (pool) {
    const payload = {
      name: updated.name,
      role: updated.role,
      apiKeys: updated.apiKeys,
      ssoProvider: updated.ssoProvider,
      ssoSubject: updated.ssoSubject,
      lastLoginAt: updated.lastLoginAt,
      status: updated.status,
    };
    await pool.query(
      `UPDATE lead_os_users SET updated_at = $1, payload = $2 WHERE id = $3`,
      [now, JSON.stringify(payload), id],
    );
  }

  userStore.set(id, updated);
  return updated;
}

export async function suspendUser(id: string): Promise<UserAccount | null> {
  return updateUser(id, { status: "suspended" });
}

export async function createApiKey(
  userId: string,
  name: string,
  permissions: string[],
  expiresAt?: string,
): Promise<{ record: ApiKeyRecord; rawKey: string } | null> {
  await ensureSchema();

  const user = await getUserById(userId);
  if (!user) return null;

  const keyId = generateId();
  const rawSuffix = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const rawKey = `los_${rawSuffix}`;
  const prefix = rawKey.slice(0, 8);
  const keyHashValue = hashKey(rawKey);
  const now = nowISO();

  const record: ApiKeyRecord = {
    id: keyId,
    name,
    keyHash: keyHashValue,
    prefix,
    permissions,
    expiresAt,
    createdAt: now,
  };

  const pool = getPool();
  if (pool) {
    const payload = { name, permissions, expiresAt };
    await pool.query(
      `INSERT INTO lead_os_api_keys (id, user_id, prefix, key_hash, created_at, payload)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [keyId, userId, prefix, keyHashValue, now, JSON.stringify(payload)],
    );
  }

  apiKeyStore.set(keyId, { ...record, userId });
  user.apiKeys.push(record);
  userStore.set(userId, { ...user, updatedAt: now });

  return { record, rawKey };
}

export async function validateApiKey(rawKey: string): Promise<{ user: UserAccount; permissions: string[] } | null> {
  await ensureSchema();

  if (!rawKey.startsWith("los_")) return null;

  const prefix = rawKey.slice(0, 8);
  const keyHashValue = hashKey(rawKey);

  const pool = getPool();
  if (pool) {
    const result = await pool.query(
      `SELECT k.id, k.user_id, k.prefix, k.key_hash, k.created_at, k.payload,
              u.id AS u_id, u.email, u.tenant_id, u.created_at AS u_created_at,
              u.updated_at AS u_updated_at, u.payload AS u_payload
       FROM lead_os_api_keys k
       JOIN lead_os_users u ON u.id = k.user_id
       WHERE k.prefix = $1 AND k.key_hash = $2
       LIMIT 1`,
      [prefix, keyHashValue],
    );

    if (result.rows.length > 0) {
      const row = result.rows[0];
      const keyPayload = row.payload as Record<string, unknown>;
      const permissions = (keyPayload.permissions as string[]) ?? [];

      if (keyPayload.expiresAt && new Date(keyPayload.expiresAt as string) < new Date()) {
        return null;
      }

      await pool.query(
        `UPDATE lead_os_api_keys SET payload = jsonb_set(payload, '{lastUsedAt}', $1::jsonb) WHERE id = $2`,
        [JSON.stringify(new Date().toISOString()), row.id],
      );

      const user = userToRecord({
        id: row.u_id,
        email: row.email,
        tenant_id: row.tenant_id,
        created_at: row.u_created_at,
        updated_at: row.u_updated_at,
        payload: row.u_payload,
      });
      return { user, permissions };
    }
  }

  for (const entry of apiKeyStore.values()) {
    if (entry.prefix === prefix && entry.keyHash === keyHashValue) {
      if (entry.expiresAt && new Date(entry.expiresAt) < new Date()) {
        return null;
      }
      entry.lastUsedAt = nowISO();
      const user = userStore.get(entry.userId);
      if (!user || user.status !== "active") return null;
      return { user, permissions: entry.permissions };
    }
  }

  return null;
}

export async function revokeApiKey(keyId: string): Promise<boolean> {
  await ensureSchema();

  const entry = apiKeyStore.get(keyId);

  const pool = getPool();
  if (pool) {
    const result = await pool.query(`DELETE FROM lead_os_api_keys WHERE id = $1 RETURNING user_id`, [keyId]);
    if (result.rows.length > 0) {
      const userId = result.rows[0].user_id as string;
      const user = await getUserById(userId);
      if (user) {
        user.apiKeys = user.apiKeys.filter((k) => k.id !== keyId);
        userStore.set(userId, { ...user, updatedAt: nowISO() });
      }
    }
  }

  if (entry) {
    apiKeyStore.delete(keyId);
    const user = userStore.get(entry.userId);
    if (user) {
      user.apiKeys = user.apiKeys.filter((k) => k.id !== keyId);
      userStore.set(entry.userId, { ...user, updatedAt: nowISO() });
    }
    return true;
  }

  return pool ? true : false;
}

export async function createSession(userId: string): Promise<{ session: SessionRecord; token: string } | null> {
  await ensureSchema();

  const user = await getUserById(userId);
  if (!user || user.status !== "active") return null;

  const sessionId = generateId();
  const token = `sess_${Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")}`;
  const now = nowISO();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const session: SessionRecord = {
    id: sessionId,
    userId,
    tenantId: user.tenantId,
    role: user.role,
    expiresAt,
    createdAt: now,
  };

  const pool = getPool();
  if (pool) {
    await pool.query(
      `INSERT INTO lead_os_sessions (id, user_id, tenant_id, role, expires_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [sessionId, userId, user.tenantId, user.role, expiresAt, now],
    );
  }

  sessionStore.set(token, session);

  await updateUser(userId, { lastLoginAt: now });

  return { session, token };
}

export async function validateSession(token: string): Promise<SessionRecord | null> {
  await ensureSchema();

  if (!token.startsWith("sess_")) return null;

  const memSession = sessionStore.get(token);
  if (memSession) {
    if (new Date(memSession.expiresAt) < new Date()) {
      sessionStore.delete(token);
      return null;
    }
    return memSession;
  }

  return null;
}

export async function destroySession(token: string): Promise<void> {
  await ensureSchema();

  const session = sessionStore.get(token);

  if (session) {
    const pool = getPool();
    if (pool) {
      await pool.query(`DELETE FROM lead_os_sessions WHERE id = $1`, [session.id]);
    }
    sessionStore.delete(token);
  }
}

export async function createTeamInvite(
  email: string,
  tenantId: string,
  role: UserRole,
  invitedBy: string,
): Promise<TeamInvite> {
  await ensureSchema();

  const id = generateId();
  const now = nowISO();
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
  const normalizedEmail = email.trim().toLowerCase();

  const invite: TeamInvite = {
    id,
    email: normalizedEmail,
    tenantId,
    role,
    invitedBy,
    expiresAt,
    status: "pending",
    createdAt: now,
  };

  const pool = getPool();
  if (pool) {
    await pool.query(
      `INSERT INTO lead_os_invites (id, email, tenant_id, role, invited_by, expires_at, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id, normalizedEmail, tenantId, role, invitedBy, expiresAt, "pending", now],
    );
  }

  inviteStore.set(id, invite);
  return invite;
}

export async function acceptInvite(inviteId: string, name: string): Promise<UserAccount | null> {
  await ensureSchema();

  const invite = inviteStore.get(inviteId);
  if (!invite) {
    const pool = getPool();
    if (pool) {
      const result = await pool.query(
        `SELECT * FROM lead_os_invites WHERE id = $1 AND status = 'pending' LIMIT 1`,
        [inviteId],
      );
      if (result.rows.length === 0) return null;
      const row = result.rows[0];
      const dbInvite: TeamInvite = {
        id: row.id,
        email: row.email,
        tenantId: row.tenant_id,
        role: row.role as UserRole,
        invitedBy: row.invited_by,
        expiresAt: row.expires_at instanceof Date ? row.expires_at.toISOString() : String(row.expires_at),
        status: row.status,
        createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
      };
      if (dbInvite.status !== "pending") return null;
      if (new Date(dbInvite.expiresAt) < new Date()) {
        await pool.query(`UPDATE lead_os_invites SET status = 'expired' WHERE id = $1`, [inviteId]);
        return null;
      }
      inviteStore.set(inviteId, dbInvite);
      return acceptInviteInternal(dbInvite, name);
    }
    return null;
  }

  if (invite.status !== "pending") return null;
  if (new Date(invite.expiresAt) < new Date()) {
    invite.status = "expired";
    inviteStore.set(inviteId, invite);
    return null;
  }

  return acceptInviteInternal(invite, name);
}

async function acceptInviteInternal(invite: TeamInvite, name: string): Promise<UserAccount> {
  const user = await createUser({
    email: invite.email,
    name,
    tenantId: invite.tenantId,
    role: invite.role,
    status: "active",
  });

  invite.status = "accepted";
  inviteStore.set(invite.id, invite);

  const pool = getPool();
  if (pool) {
    await pool.query(`UPDATE lead_os_invites SET status = 'accepted' WHERE id = $1`, [invite.id]);
  }

  return user;
}

export async function listInvites(tenantId: string): Promise<TeamInvite[]> {
  await ensureSchema();

  const pool = getPool();
  if (pool) {
    const result = await pool.query(
      `SELECT * FROM lead_os_invites WHERE tenant_id = $1 ORDER BY created_at DESC`,
      [tenantId],
    );
    return result.rows.map((row) => ({
      id: row.id as string,
      email: row.email as string,
      tenantId: row.tenant_id as string,
      role: row.role as UserRole,
      invitedBy: row.invited_by as string,
      expiresAt: row.expires_at instanceof Date ? row.expires_at.toISOString() : String(row.expires_at),
      status: row.status as TeamInvite["status"],
      createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    }));
  }

  return Array.from(inviteStore.values()).filter((i) => i.tenantId === tenantId);
}

export function hasPermission(role: UserRole, permission: string): boolean {
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return false;
  if (perms.has("*")) return true;
  return perms.has(permission);
}

export function resetAuthStore(): void {
  userStore.clear();
  emailIndex.clear();
  apiKeyStore.clear();
  sessionStore.clear();
  inviteStore.clear();
  schemaReady = null;
}
