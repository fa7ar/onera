/*
# Fix RLS infinite recursion on memberships and profiles

## Problem
The `memberships_select_member` policy queries `memberships` in its USING clause,
creating infinite RLS recursion (PostgreSQL evaluates the policy on the inner query too).
Similarly, INSERT/UPDATE/DELETE policies on memberships reference `memberships m3`
for permission checks, causing the same recursion.
The `profiles_select_org_members` policy also references `memberships`, triggering the cascade.

## Fix
1. Create SECURITY DEFINER helper functions that bypass RLS:
   - `is_workspace_member(user_uuid, workspace_uuid)` — checks workspace membership
   - `has_workspace_permission(user_uuid, workspace_uuid, perm_key)` — checks permission via role
   - `is_org_owner(user_uuid, org_uuid)` — checks if user owns the org
   - `is_org_member(user_uuid, org_uuid)` — checks if user is in any workspace of the org
2. Replace all self-referential policies with calls to these functions.
3. Replace `profiles_select_org_members` to use `is_org_member`.

## Security
- Helper functions are SECURITY DEFINER (run as owner, bypass RLS) but only expose boolean results.
- No sensitive data is leaked — they return true/false only.
- All policies still enforce proper access control.
*/

-- ============ HELPER FUNCTIONS (SECURITY DEFINER, bypass RLS) ============

CREATE OR REPLACE FUNCTION public.is_workspace_member(user_uuid uuid, workspace_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM memberships
    WHERE user_id = user_uuid AND workspace_id = workspace_uuid
  );
$$;

CREATE OR REPLACE FUNCTION public.has_workspace_permission(
  user_uuid uuid, workspace_uuid uuid, perm_key text
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM memberships m
    JOIN role_permissions rp ON rp.role_id = m.role_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE m.user_id = user_uuid
      AND m.workspace_id = workspace_uuid
      AND p.key = perm_key
  );
$$;

CREATE OR REPLACE FUNCTION public.is_org_owner(user_uuid uuid, org_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organizations
    WHERE id = org_uuid AND owner_id = user_uuid
  );
$$;

CREATE OR REPLACE FUNCTION public.is_org_member(user_uuid uuid, org_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM memberships m
    JOIN workspaces w ON w.id = m.workspace_id
    WHERE m.user_id = user_uuid AND w.organization_id = org_uuid
  );
$$;

-- ============ FIX PROFILES POLICIES ============

DROP POLICY IF EXISTS "profiles_select_org_members" ON profiles;
CREATE POLICY "profiles_select_org_members" ON profiles FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM memberships m
      JOIN workspaces w ON w.id = m.workspace_id
      WHERE m.user_id = auth.uid()
        AND w.organization_id IN (
          SELECT w2.organization_id FROM workspaces w2
          JOIN memberships m2 ON m2.workspace_id = w2.id
          WHERE m2.user_id = profiles.id
        )
    )
  );

-- Simpler: just use is_org_member for both sides
DROP POLICY IF EXISTS "profiles_select_org_members" ON profiles;
CREATE POLICY "profiles_select_org_members" ON profiles FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM organizations o
      WHERE is_org_member(auth.uid(), o.id)
        AND is_org_member(profiles.id, o.id)
    )
  );

-- ============ FIX MEMBERSHIPS POLICIES ============

DROP POLICY IF EXISTS "memberships_select_member" ON memberships;
CREATE POLICY "memberships_select_member" ON memberships FOR SELECT
  TO authenticated USING (
    public.is_workspace_member(auth.uid(), memberships.workspace_id)
  );

DROP POLICY IF EXISTS "memberships_insert_self_or_org_owner" ON memberships;
CREATE POLICY "memberships_insert_self_or_org_owner" ON memberships FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = memberships.user_id
    OR public.is_org_owner(auth.uid(), (
      SELECT w.organization_id FROM workspaces w WHERE w.id = memberships.workspace_id
    ))
    OR public.has_workspace_permission(auth.uid(), memberships.workspace_id, 'member.invite')
  );

DROP POLICY IF EXISTS "memberships_update_org_owner" ON memberships;
CREATE POLICY "memberships_update_org_owner" ON memberships FOR UPDATE
  TO authenticated USING (
    public.is_org_owner(auth.uid(), (
      SELECT w.organization_id FROM workspaces w WHERE w.id = memberships.workspace_id
    ))
    OR public.has_workspace_permission(auth.uid(), memberships.workspace_id, 'member.manage')
  ) WITH CHECK (
    public.is_org_owner(auth.uid(), (
      SELECT w.organization_id FROM workspaces w WHERE w.id = memberships.workspace_id
    ))
    OR public.has_workspace_permission(auth.uid(), memberships.workspace_id, 'member.manage')
  );

DROP POLICY IF EXISTS "memberships_delete_org_owner_or_self" ON memberships;
CREATE POLICY "memberships_delete_org_owner_or_self" ON memberships FOR DELETE
  TO authenticated USING (
    auth.uid() = memberships.user_id
    OR public.is_org_owner(auth.uid(), (
      SELECT w.organization_id FROM workspaces w WHERE w.id = memberships.workspace_id
    ))
    OR public.has_workspace_permission(auth.uid(), memberships.workspace_id, 'member.remove')
  );

-- ============ FIX ORGANIZATIONS POLICIES ============

DROP POLICY IF EXISTS "orgs_select_member" ON organizations;
CREATE POLICY "orgs_select_member" ON organizations FOR SELECT
  TO authenticated USING (
    public.is_org_member(auth.uid(), organizations.id)
  );

-- ============ FIX WORKSPACES POLICIES ============

DROP POLICY IF EXISTS "workspaces_select_member" ON workspaces;
CREATE POLICY "workspaces_select_member" ON workspaces FOR SELECT
  TO authenticated USING (
    public.is_workspace_member(auth.uid(), workspaces.id)
  );

DROP POLICY IF EXISTS "workspaces_insert_member" ON workspaces;
CREATE POLICY "workspaces_insert_member" ON workspaces FOR INSERT
  TO authenticated WITH CHECK (
    public.is_org_member(auth.uid(), workspaces.organization_id)
  );

DROP POLICY IF EXISTS "workspaces_update_org_owner" ON workspaces;
CREATE POLICY "workspaces_update_org_owner" ON workspaces FOR UPDATE
  TO authenticated USING (
    public.is_org_owner(auth.uid(), workspaces.organization_id)
    OR public.is_workspace_member(auth.uid(), workspaces.id)
  ) WITH CHECK (
    public.is_org_owner(auth.uid(), workspaces.organization_id)
    OR public.is_workspace_member(auth.uid(), workspaces.id)
  );

DROP POLICY IF EXISTS "workspaces_delete_org_owner" ON workspaces;
CREATE POLICY "workspaces_delete_org_owner" ON workspaces FOR DELETE
  TO authenticated USING (
    public.is_org_owner(auth.uid(), workspaces.organization_id)
  );

-- ============ FIX ROLES POLICIES ============

DROP POLICY IF EXISTS "roles_select_member" ON roles;
CREATE POLICY "roles_select_member" ON roles FOR SELECT
  TO authenticated USING (
    public.is_org_member(auth.uid(), roles.organization_id)
  );

DROP POLICY IF EXISTS "roles_insert_org_owner" ON roles;
CREATE POLICY "roles_insert_org_owner" ON roles FOR INSERT
  TO authenticated WITH CHECK (
    public.is_org_owner(auth.uid(), roles.organization_id)
  );

DROP POLICY IF EXISTS "roles_update_org_owner" ON roles;
CREATE POLICY "roles_update_org_owner" ON roles FOR UPDATE
  TO authenticated USING (
    public.is_org_owner(auth.uid(), roles.organization_id)
  ) WITH CHECK (
    public.is_org_owner(auth.uid(), roles.organization_id)
  );

DROP POLICY IF EXISTS "roles_delete_org_owner" ON roles;
CREATE POLICY "roles_delete_org_owner" ON roles FOR DELETE
  TO authenticated USING (
    public.is_org_owner(auth.uid(), roles.organization_id)
  );

-- ============ FIX ROLE_PERMISSIONS POLICIES ============

DROP POLICY IF EXISTS "role_perms_select_member" ON role_permissions;
CREATE POLICY "role_perms_select_member" ON role_permissions FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM roles r
      WHERE r.id = role_permissions.role_id
        AND public.is_org_member(auth.uid(), r.organization_id)
    )
  );

DROP POLICY IF EXISTS "role_perms_insert_org_owner" ON role_permissions;
CREATE POLICY "role_perms_insert_org_owner" ON role_permissions FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM roles r
      WHERE r.id = role_permissions.role_id
        AND public.is_org_owner(auth.uid(), r.organization_id)
    )
  );

DROP POLICY IF EXISTS "role_perms_delete_org_owner" ON role_permissions;
CREATE POLICY "role_perms_delete_org_owner" ON role_permissions FOR DELETE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM roles r
      WHERE r.id = role_permissions.role_id
        AND public.is_org_owner(auth.uid(), r.organization_id)
    )
  );

-- ============ FIX INVITATIONS POLICIES ============

DROP POLICY IF EXISTS "invitations_select_member" ON invitations;
CREATE POLICY "invitations_select_member" ON invitations FOR SELECT
  TO authenticated USING (
    public.is_workspace_member(auth.uid(), invitations.workspace_id)
    OR EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.email = invitations.email
    )
  );

DROP POLICY IF EXISTS "invitations_insert_member" ON invitations;
CREATE POLICY "invitations_insert_member" ON invitations FOR INSERT
  TO authenticated WITH CHECK (
    public.is_org_owner(auth.uid(), (
      SELECT w.organization_id FROM workspaces w WHERE w.id = invitations.workspace_id
    ))
    OR public.has_workspace_permission(auth.uid(), invitations.workspace_id, 'member.invite')
  );

DROP POLICY IF EXISTS "invitations_update_member" ON invitations;
CREATE POLICY "invitations_update_member" ON invitations FOR UPDATE
  TO authenticated USING (
    invited_by = auth.uid()
    OR public.is_org_owner(auth.uid(), (
      SELECT w.organization_id FROM workspaces w WHERE w.id = invitations.workspace_id
    ))
  ) WITH CHECK (
    invited_by = auth.uid()
    OR public.is_org_owner(auth.uid(), (
      SELECT w.organization_id FROM workspaces w WHERE w.id = invitations.workspace_id
    ))
  );

DROP POLICY IF EXISTS "invitations_delete_member" ON invitations;
CREATE POLICY "invitations_delete_member" ON invitations FOR DELETE
  TO authenticated USING (
    invited_by = auth.uid()
    OR public.is_org_owner(auth.uid(), (
      SELECT w.organization_id FROM workspaces w WHERE w.id = invitations.workspace_id
    ))
  );
