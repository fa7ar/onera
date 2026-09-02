export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
        };
        Update: {
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
        };
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          owner_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          slug: string;
          owner_id: string;
        };
        Update: {
          name?: string;
          slug?: string;
        };
      };
      workspaces: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          slug: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          organization_id: string;
          name: string;
          slug: string;
        };
        Update: {
          name?: string;
          slug?: string;
        };
      };
      roles: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          is_system: boolean;
          created_at: string;
        };
        Insert: {
          organization_id: string;
          name: string;
          is_system?: boolean;
        };
        Update: {
          name?: string;
        };
      };
      permissions: {
        Row: {
          id: string;
          key: string;
          description: string | null;
          module: string;
          created_at: string;
        };
        Insert: {
          key: string;
          description?: string | null;
          module?: string;
        };
        Update: {};
      };
      role_permissions: {
        Row: {
          role_id: string;
          permission_id: string;
          created_at: string;
        };
        Insert: {
          role_id: string;
          permission_id: string;
        };
        Update: {};
      };
      memberships: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          role_id: string;
          created_at: string;
        };
        Insert: {
          workspace_id: string;
          user_id: string;
          role_id: string;
        };
        Update: {
          role_id?: string;
        };
      };
      invitations: {
        Row: {
          id: string;
          workspace_id: string;
          email: string;
          role_id: string;
          invited_by: string;
          status: 'pending' | 'accepted' | 'declined' | 'revoked';
          created_at: string;
        };
        Insert: {
          workspace_id: string;
          email: string;
          role_id: string;
          invited_by: string;
          status?: 'pending' | 'accepted' | 'declined' | 'revoked';
        };
        Update: {
          status?: 'pending' | 'accepted' | 'declined' | 'revoked';
        };
      };
    };
  };
}
