-- ============================================================
-- Migration: fix group_permissions schema + seed Support group
-- Description:
--   1. The column-level UNIQUE constraints on group_permissions.group_id and
--      .module (present in the legacy backup schema) prevent a group from
--      holding more than one module and a module from being granted to more
--      than one group. Drop them and keep only the composite unique that the
--      application code already assumes.
--   2. Seed a dedicated "Support" group (least privilege) with read/create/
--      update on the `support` module. Admin/superadmin still bypass via role.
-- Scope: Core only. Idempotent.
-- ============================================================

BEGIN;

-- Ensure the table exists for environments that were bootstrapped without it.
CREATE TABLE IF NOT EXISTS group_permissions (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL,
    module VARCHAR(50) NOT NULL,
    can_create BOOLEAN DEFAULT FALSE,
    can_read BOOLEAN DEFAULT FALSE,
    can_update BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    can_export BOOLEAN DEFAULT FALSE,
    can_manage BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT group_permissions_group_id_module_key UNIQUE (group_id, module)
);

-- Drop the legacy single-column UNIQUE constraints if present.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'group_permissions_group_id_key') THEN
    ALTER TABLE group_permissions DROP CONSTRAINT group_permissions_group_id_key;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'group_permissions_module_key') THEN
    ALTER TABLE group_permissions DROP CONSTRAINT group_permissions_module_key;
  END IF;
END $$;

-- Deduplicate permission rows before (re)creating the composite unique constraint.
DELETE FROM group_permissions a USING group_permissions b
WHERE a.id > b.id AND a.group_id = b.group_id AND a.module = b.module;

-- Ensure the composite unique constraint exists.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'group_permissions_group_id_module_key') THEN
    ALTER TABLE group_permissions
      ADD CONSTRAINT group_permissions_group_id_module_key UNIQUE (group_id, module);
  END IF;
END $$;

-- Foreign key to groups (idempotent).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'group_permissions_group_id_fkey') THEN
    ALTER TABLE group_permissions
      ADD CONSTRAINT group_permissions_group_id_fkey
      FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Seed the Support group (least privilege, system group).
INSERT INTO groups (name, is_system)
SELECT 'Support', TRUE
WHERE NOT EXISTS (SELECT 1 FROM groups WHERE name = 'Support');

-- Seed support-module permissions for the Support group.
INSERT INTO group_permissions (group_id, module, can_create, can_read, can_update, can_delete, can_export, can_manage)
SELECT g.id, 'support', TRUE, TRUE, TRUE, FALSE, FALSE, FALSE
FROM groups g
WHERE g.name = 'Support'
  AND NOT EXISTS (
    SELECT 1 FROM group_permissions gp
    WHERE gp.group_id = g.id AND gp.module = 'support'
  );

COMMIT;
