import fs from "node:fs";
import zlib from "node:zlib";
import crypto from "node:crypto";
import path from "node:path";
import { Readable } from "node:stream";
import { dbPool, googleAuth, drive } from "./google-auth.mjs";

const BACKUP_DIR = "Backup-Auto";
const KEEP_DAYS = 30;
const SKIP_TABLES = new Set(["users_backup_1773898881424"]);

/**
 * Dump all database tables with strict password hash redaction
 */
async function dumpDatabase(pool) {
  const raw = await pool.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema='public' ORDER BY table_name`
  );
  const tables = {};
  for (const { table_name } of raw.rows) {
    if (SKIP_TABLES.has(table_name)) continue;
    let { rows, rowCount } = await pool.query(`SELECT * FROM "${table_name}"`);

    // CRITICAL: Redact password hash for safety
    if (table_name === "users") {
      rows = rows.map((u) => {
        const copy = { ...u };
        if ("password" in copy) {
          copy.password = "[REDACTED]";
        }
        return copy;
      });
    }

    tables[table_name] = { type: "rows", rows, count: rowCount };
  }

  return {
    meta: {
      kind: "micro-business-suite-db-backup",
      created_at: new Date().toISOString(),
      source: "auto-backup.mjs",
      passwords_redacted: true,
      table_count: Object.keys(tables).length,
    },
    tables,
  };
}

/**
 * Optional encryption with AES-256-GCM using BACKUP_ENCRYPTION_KEY env
 */
function encryptBuffer(buffer, keyString) {
  const key = crypto.createHash("sha256").update(keyString).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Header: 12 bytes IV + 16 bytes auth tag + cipher text
  return Buffer.concat([iv, authTag, enc]);
}

async function ensureFolder(service, name) {
  const find = await service.files.list({
    q: `name='${name.replaceAll("'", "\\'")}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: "files(id)",
    pageSize: 1,
  });
  if (find.data.files?.length) return find.data.files[0].id;
  const created = await service.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [],
    },
    fields: "id",
  });
  return created.data.id;
}

async function upload(service, folderId, name, data, mimeType, parents) {
  const find = await service.files.list({
    q: `name='${name.replaceAll("'", "\\'")}' and '${folderId}' in parents and trashed=false`,
    fields: "files(id)",
    pageSize: 1,
  });
  const media = { mimeType, body: Buffer.isBuffer(data) ? Readable.from(data) : data };
  if (find.data.files?.length) {
    const updated = await service.files.update({
      fileId: find.data.files[0].id,
      requestBody: { name, mimeType },
      media,
      fields: "id,modifiedTime",
    });
    return { id: updated.data.id, replaced: true };
  }
  const created = await service.files.create({
    requestBody: { name, mimeType, parents: parents || [folderId] },
    media,
    fields: "id,createdTime",
  });
  return { id: created.data.id, replaced: false };
}

async function cleanupOld(service, folderId) {
  const list = await service.files.list({
    q: `'${folderId}' in parents and mimeType!='application/vnd.google-apps.folder' and trashed=false`,
    fields: "files(id,name,modifiedTime)",
    pageSize: 100,
  });
  const cutoff = Date.now() - KEEP_DAYS * 86400000;
  let removed = 0;
  for (const f of list.data.files || []) {
    if (new Date(f.modifiedTime).getTime() < cutoff) {
      await service.files.delete({ fileId: f.id });
      removed++;
    }
  }
  return removed;
}

async function main() {
  const pool = await dbPool();
  const dump = await dumpDatabase(pool);
  await pool.end();

  const gz = zlib.gzipSync(Buffer.from(JSON.stringify(dump, null, 0)));
  const stamp = new Date().toISOString().slice(0, 10);
  
  const encryptionKey = process.env.BACKUP_ENCRYPTION_KEY;
  let payloadBuffer = gz;
  let name = `db-backup-${stamp}.json.gz`;
  let mimeType = "application/gzip";

  if (encryptionKey) {
    payloadBuffer = encryptBuffer(gz, encryptionKey);
    name = `db-backup-${stamp}.json.gz.enc`;
    mimeType = "application/octet-stream";
    console.log(`[SECURITY] Backup encrypted with AES-256-GCM using BACKUP_ENCRYPTION_KEY`);
  } else {
    console.log(`[SECURITY NOTE] BACKUP_ENCRYPTION_KEY not set. Archive uploaded compressed but unencrypted.`);
  }

  const auth = await googleAuth();
  const service = await drive(auth);
  const folderId = await ensureFolder(service, BACKUP_DIR);
  const uploaded = await upload(service, folderId, name, payloadBuffer, mimeType);
  const removed = await cleanupOld(service, folderId);

  console.log(
    `BACKUP OK ${stamp} | ${uploaded.replaced ? "replaced" : "new"} | tables=${dump.meta.table_count} (passwords redacted)`
  );
  console.log(`file=${name} size=${Math.round(payloadBuffer.length / 1024)} KB folder=${BACKUP_DIR}`);
  console.log(`cleanup: removed ${removed} old backups (> ${KEEP_DAYS} days)`);
}

main().catch((e) => {
  console.error("BACKUP FAILED:", e.message);
  process.exit(1);
});