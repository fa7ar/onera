/*
# Onera Core Identity Schema (restructured)

Creates all tables first, then applies all RLS policies.
Tables: profiles, organizations, workspaces, roles, permissions, role_permissions, memberships, invitations.
*/

-- ============ TABLES (all first) ============

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, slug)
);

CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, name)
);

CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  description text,
  module text NOT NULL DEFAULT 'core',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, user_id)
);

CREATE TABLE IF NOT EXISTS invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email text NOT NULL,
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'revoked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, email) DEFERRABLE INITIALLY DEFERRED
);

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_organizations_owner ON organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_workspaces_org ON workspaces(organization_id);
CREATE INDEX IF NOT EXISTS idx_memberships_workspace ON memberships(workspace_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_roles_org ON roles(organization_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_perm ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_invitations_workspace ON invitations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);

-- ============ RLS ENABLE ============
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- ============ POLICIES: PROFILES ============
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_select_org_members" ON profiles;
CREATE POLICY "profiles_select_org_members" ON profiles FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.user_id = auth.uid()
      AND m.workspace_id IN (
        SELECT w2.id FROM workspaces w2
        JOIN memberships m2 ON m2.workspace_id = w2.id
        WHERE m2.user_id = profiles.id
      )
    )
  );

-- ============ POLICIES: ORGANIZATIONS ============
DROP POLICY IF EXISTS "orgs_select_member" ON organizations;
CREATE POLICY "orgs_select_member" ON organizations FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM memberships m
      JOIN workspaces w ON w.id = m.workspace_id
      WHERE m.user_id = auth.uid() AND w.organization_id = organizations.id
    )
  );

DROP POLICY IF EXISTS "orgs_insert_owner" ON organizations;
CREATE POLICY "orgs_insert_owner" ON organizations FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "orgs_update_owner" ON organizations;
CREATE POLICY "orgs_update_owner" ON organizations FOR UPDATE
  TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "orgs_delete_owner" ON organizations;
CREATE POLICY "orgs_delete_owner" ON organizations FOR DELETE
  TO authenticated USING (auth.uid() = owner_id);

-- ============ POLICIES: WORKSPACES ============
DROP POLICY IF EXISTS "workspaces_select_member" ON workspaces;
CREATE POLICY "workspaces_select_member" ON workspaces FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.workspace_id = workspaces.id AND m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "workspaces_insert_member" ON workspaces;
CREATE POLICY "workspaces_insert_member" ON workspaces FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM memberships m
      JOIN workspaces w ON w.id = m.workspace_id
      WHERE m.user_id = auth.uid() AND w.organization_id = workspaces.organization_id
    )
  );

DROP POLICY IF EXISTS "workspaces_update_org_owner" ON workspaces;
CREATE POLICY "workspaces_update_org_owner" ON workspaces FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = workspaces.organization_id AND o.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.workspace_id = workspaces.id AND m.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = workspaces.organization_id AND o.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.workspace_id = workspaces.id AND m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "workspaces_delete_org_owner" ON workspaces;
CREATE POLICY "workspaces_delete_org_owner" ON workspaces FOR DELETE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = workspaces.organization_id AND o.owner_id = auth.uid()
    )
  );

-- ============ POLICIES: ROLES ============
DROP POLICY IF EXISTS "roles_select_member" ON roles;
CREATE POLICY "roles_select_member" ON roles FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM memberships m
      JOIN workspaces w ON w.id = m.workspace_id
      WHERE m.user_id = auth.uid() AND w.organization_id = roles.organization_id
    )
  );

DROP POLICY IF EXISTS "roles_insert_org_owner" ON roles;
CREATE POLICY "roles_insert_org_owner" ON roles FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = roles.organization_id AND o.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "roles_update_org_owner" ON roles;
CREATE POLICY "roles_update_org_owner" ON roles FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = roles.organization_id AND o.owner_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = roles.organization_id AND o.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "roles_delete_org_owner" ON roles;
CREATE POLICY "roles_delete_org_owner" ON roles FOR DELETE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = roles.organization_id AND o.owner_id = auth.uid()
    )
  );

-- ============ POLICIES: PERMISSIONS ============
DROP POLICY IF EXISTS "permissions_select_all" ON permissions;
CREATE POLICY "permissions_select_all" ON permissions FOR SELECT
  TO authenticated USING (true);

-- ============ POLICIES: ROLE_PERMISSIONS ============
DROP POLICY IF EXISTS "role_perms_select_member" ON role_permissions;
CREATE POLICY "role_perms_select_member" ON role_permissions FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM roles r
      JOIN workspaces w ON w.organization_id = r.organization_id
      JOIN memberships m ON m.workspace_id = w.id
      WHERE r.id = role_permissions.role_id AND m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "role_perms_insert_org_owner" ON role_permissions;
CREATE POLICY "role_perms_insert_org_owner" ON role_permissions FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM roles r
      JOIN organizations o ON o.id = r.organization_id
      WHERE r.id = role_permissions.role_id AND o.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "role_perms_delete_org_owner" ON role_permissions;
CREATE POLICY "role_perms_delete_org_owner" ON role_permissions FOR DELETE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM roles r
      JOIN organizations o ON o.id = r.organization_id
      WHERE r.id = role_permissions.role_id AND o.owner_id = auth.uid()
    )
  );

-- ============ POLICIES: MEMBERSHIPS ============
DROP POLICY IF EXISTS "memberships_select_member" ON memberships;
CREATE POLICY "memberships_select_member" ON memberships FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM memberships m2
      WHERE m2.workspace_id = memberships.workspace_id AND m2.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "memberships_insert_self_or_org_owner" ON memberships;
CREATE POLICY "memberships_insert_self_or_org_owner" ON memberships FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = memberships.user_id
    OR EXISTS (
      SELECT 1 FROM workspaces w
      JOIN organizations o ON o.id = w.organization_id
      WHERE w.id = memberships.workspace_id AND o.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM memberships m3
      JOIN role_permissions rp ON rp.role_id = m3.role_id
      JOIN permissions p ON p.id = rp.permission_id AND p.key = 'member.invite'
      WHERE m3.workspace_id = memberships.workspace_id AND m3.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "memberships_update_org_owner" ON memberships;
CREATE POLICY "memberships_update_org_owner" ON memberships FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM workspaces w
      JOIN organizations o ON o.id = w.organization_id
      WHERE w.id = memberships.workspace_id AND o.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM memberships m3
      JOIN role_permissions rp ON rp.role_id = m3.role_id
      JOIN permissions p ON p.id = rp.permission_id AND p.key = 'member.manage'
      WHERE m3.workspace_id = memberships.workspace_id AND m3.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspaces w
      JOIN organizations o ON o.id = w.organization_id
      WHERE w.id = memberships.workspace_id AND o.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM memberships m3
      JOIN role_permissions rp ON rp.role_id = m3.role_id
      JOIN permissions p ON p.id = rp.permission_id AND p.key = 'member.manage'
      WHERE m3.workspace_id = memberships.workspace_id AND m3.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "memberships_delete_org_owner_or_self" ON memberships;
CREATE POLICY "memberships_delete_org_owner_or_self" ON memberships FOR DELETE
  TO authenticated USING (
    auth.uid() = memberships.user_id
    OR EXISTS (
      SELECT 1 FROM workspaces w
      JOIN organizations o ON o.id = w.organization_id
      WHERE w.id = memberships.workspace_id AND o.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM memberships m3
      JOIN role_permissions rp ON rp.role_id = m3.role_id
      JOIN permissions p ON p.id = rp.permission_id AND p.key = 'member.remove'
      WHERE m3.workspace_id = memberships.workspace_id AND m3.user_id = auth.uid()
    )
  );

-- ============ POLICIES: INVITATIONS ============
DROP POLICY IF EXISTS "invitations_select_member" ON invitations;
CREATE POLICY "invitations_select_member" ON invitations FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.workspace_id = invitations.workspace_id AND m.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.email = invitations.email
    )
  );

DROP POLICY IF EXISTS "invitations_insert_member" ON invitations;
CREATE POLICY "invitations_insert_member" ON invitations FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspaces w
      JOIN organizations o ON o.id = w.organization_id
      WHERE w.id = invitations.workspace_id AND o.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM memberships m3
      JOIN role_permissions rp ON rp.role_id = m3.role_id
      JOIN permissions p ON p.id = rp.permission_id AND p.key = 'member.invite'
      WHERE m3.workspace_id = invitations.workspace_id AND m3.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "invitations_update_member" ON invitations;
CREATE POLICY "invitations_update_member" ON invitations FOR UPDATE
  TO authenticated USING (
    invited_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM workspaces w
      JOIN organizations o ON o.id = w.organization_id
      WHERE w.id = invitations.workspace_id AND o.owner_id = auth.uid()
    )
  ) WITH CHECK (
    invited_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM workspaces w
      JOIN organizations o ON o.id = w.organization_id
      WHERE w.id = invitations.workspace_id AND o.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "invitations_delete_member" ON invitations;
CREATE POLICY "invitations_delete_member" ON invitations FOR DELETE
  TO authenticated USING (
    invited_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM workspaces w
      JOIN organizations o ON o.id = w.organization_id
      WHERE w.id = invitations.workspace_id AND o.owner_id = auth.uid()
    )
  );

-- ============ AUTO-CREATE PROFILE ON SIGNUP ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ SEED DEFAULT PERMISSIONS ============
INSERT INTO permissions (key, description, module) VALUES
  ('org.manage', 'Manage organization settings', 'core'),
  ('org.delete', 'Delete the organization', 'core'),
  ('workspace.create', 'Create workspaces', 'core'),
  ('workspace.manage', 'Manage workspace settings', 'core'),
  ('workspace.delete', 'Delete workspace', 'core'),
  ('member.invite', 'Invite members to workspace', 'core'),
  ('member.remove', 'Remove members from workspace', 'core'),
  ('member.manage', 'Manage member roles', 'core'),
  ('role.manage', 'Manage roles and permissions', 'core'),
  ('billing.manage', 'Manage billing and subscriptions', 'core'),
  ('invoice.read', 'View invoices', 'core'),
  ('invoice.write', 'Create and edit invoices', 'core')
ON CONFLICT (key) DO NOTHING;
