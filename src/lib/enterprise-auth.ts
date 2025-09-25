import { supabaseAdmin } from '@/lib/supabase';

export interface EnterpriseUser {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
  department: string;
  organization_id: string;
  sso_provider?: 'google' | 'microsoft' | 'okta' | 'auth0' | 'saml';
  sso_id?: string;
  last_login_at?: string;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  organization_id: string;
  is_system_role: boolean;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  conditions?: any;
  description: string;
}

export interface Organization {
  id: string;
  name: string;
  domain: string;
  sso_enabled: boolean;
  sso_provider?: string;
  sso_config?: any;
  subscription_plan: string;
  max_users: number;
  current_users: number;
  admin_users: string[];
  settings: {
    require_mfa: boolean;
    password_policy: {
      min_length: number;
      require_special_chars: boolean;
      require_numbers: boolean;
      require_uppercase: boolean;
    };
    session_timeout: number; // minutes
    ip_whitelist?: string[];
  };
  created_at: string;
  updated_at: string;
}

export interface SSOConfig {
  provider: 'google' | 'microsoft' | 'okta' | 'auth0' | 'saml';
  client_id: string;
  client_secret?: string;
  tenant_id?: string; // For Microsoft
  domain?: string; // For Auth0/Okta
  metadata_url?: string; // For SAML
  certificate?: string; // For SAML
  attribute_mapping: {
    email: string;
    name: string;
    role?: string;
    department?: string;
  };
  auto_provision: boolean;
  default_role: string;
}

export class EnterpriseAuthManager {

  // Organization Management
  static async createOrganization(orgData: Omit<Organization, 'id' | 'created_at' | 'updated_at' | 'current_users'>): Promise<Organization> {
    const org: Organization = {
      id: `org_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...orgData,
      current_users: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      await supabaseAdmin
        .from('organizations')
        .insert(org);

      // Create default roles for the organization
      await this.createDefaultRoles(org.id);

    } catch (error) {
      console.error('Error creating organization:', error);
      throw error;
    }

    return org;
  }

  static async getOrganization(orgId: string): Promise<Organization | null> {
    try {
      const { data } = await supabaseAdmin
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single();

      return data;
    } catch (error) {
      return null;
    }
  }

  static async getOrganizationByDomain(domain: string): Promise<Organization | null> {
    try {
      const { data } = await supabaseAdmin
        .from('organizations')
        .select('*')
        .eq('domain', domain)
        .single();

      return data;
    } catch (error) {
      return null;
    }
  }

  // User Management
  static async createEnterpriseUser(userData: Omit<EnterpriseUser, 'id' | 'created_at' | 'updated_at'>): Promise<EnterpriseUser> {
    const user: EnterpriseUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...userData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      await supabaseAdmin
        .from('enterprise_users')
        .insert(user);

      // Update organization user count
      await this.updateOrganizationUserCount(user.organization_id);

    } catch (error) {
      console.error('Error creating enterprise user:', error);
      throw error;
    }

    return user;
  }

  static async getEnterpriseUser(userId: string): Promise<EnterpriseUser | null> {
    try {
      const { data } = await supabaseAdmin
        .from('enterprise_users')
        .select('*')
        .eq('id', userId)
        .single();

      return data;
    } catch (error) {
      return null;
    }
  }

  static async getUserByEmail(email: string, organizationId: string): Promise<EnterpriseUser | null> {
    try {
      const { data } = await supabaseAdmin
        .from('enterprise_users')
        .select('*')
        .eq('email', email)
        .eq('organization_id', organizationId)
        .single();

      return data;
    } catch (error) {
      return null;
    }
  }

  // Role-Based Access Control (RBAC)
  static async createRole(roleData: Omit<Role, 'id' | 'created_at' | 'updated_at'>): Promise<Role> {
    const role: Role = {
      id: `role_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...roleData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      await supabaseAdmin
        .from('roles')
        .insert(role);

    } catch (error) {
      console.error('Error creating role:', error);
      throw error;
    }

    return role;
  }

  static async assignRole(userId: string, roleId: string): Promise<void> {
    try {
      await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: userId,
          role_id: roleId,
          assigned_at: new Date().toISOString()
        });

      // Update user permissions cache
      await this.refreshUserPermissions(userId);

    } catch (error) {
      console.error('Error assigning role:', error);
      throw error;
    }
  }

  static async getUserPermissions(userId: string): Promise<string[]> {
    try {
      const { data } = await supabaseAdmin
        .from('user_permissions_view')
        .select('permission')
        .eq('user_id', userId);

      return (data || []).map(row => row.permission);

    } catch (error) {
      console.error('Error getting user permissions:', error);
      return [];
    }
  }

  static async hasPermission(userId: string, permission: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.includes(permission) || permissions.includes('*');
  }

  // SSO Configuration
  static async configureSSOProvider(organizationId: string, config: SSOConfig): Promise<void> {
    try {
      await supabaseAdmin
        .from('organizations')
        .update({
          sso_enabled: true,
          sso_provider: config.provider,
          sso_config: config,
          updated_at: new Date().toISOString()
        })
        .eq('id', organizationId);

    } catch (error) {
      console.error('Error configuring SSO provider:', error);
      throw error;
    }
  }

  static async getSSOConfig(organizationId: string): Promise<SSOConfig | null> {
    try {
      const org = await this.getOrganization(organizationId);
      return org?.sso_config || null;

    } catch (error) {
      return null;
    }
  }

  // SSO Authentication Flow
  static async handleSSOCallback(
    organizationId: string,
    ssoUserId: string,
    userAttributes: {
      email: string;
      name: string;
      role?: string;
      department?: string;
    }
  ): Promise<EnterpriseUser> {
    try {
      const org = await this.getOrganization(organizationId);
      if (!org || !org.sso_enabled) {
        throw new Error('SSO not enabled for organization');
      }

      const ssoConfig = org.sso_config;
      if (!ssoConfig) {
        throw new Error('SSO configuration not found');
      }

      // Check if user already exists
      let user = await this.getUserByEmail(userAttributes.email, organizationId);

      if (!user && ssoConfig.auto_provision) {
        // Auto-provision new user
        const defaultRole = await this.getRoleByName(ssoConfig.default_role, organizationId);

        user = await this.createEnterpriseUser({
          email: userAttributes.email,
          name: userAttributes.name,
          role: defaultRole?.name || 'user',
          permissions: defaultRole?.permissions.map(p => p.name) || [],
          department: userAttributes.department || '',
          organization_id: organizationId,
          sso_provider: ssoConfig.provider,
          sso_id: ssoUserId,
          status: 'active'
        });

        if (defaultRole) {
          await this.assignRole(user.id, defaultRole.id);
        }

      } else if (!user) {
        throw new Error('User not found and auto-provisioning disabled');
      }

      // Update last login
      await supabaseAdmin
        .from('enterprise_users')
        .update({
          last_login_at: new Date().toISOString(),
          sso_id: ssoUserId,
          updated_at: new Date().toISOString()
        })
        .eq('id', user!.id);

      return user!;

    } catch (error) {
      console.error('Error handling SSO callback:', error);
      throw error;
    }
  }

  // Permission Checking
  static async checkResourceAccess(
    userId: string,
    resource: string,
    action: string,
    context?: any
  ): Promise<boolean> {
    try {
      const permissions = await this.getUserPermissions(userId);

      // Check for wildcard permission
      if (permissions.includes('*')) {
        return true;
      }

      // Check for exact permission
      const exactPermission = `${resource}:${action}`;
      if (permissions.includes(exactPermission)) {
        return true;
      }

      // Check for resource-level permission
      const resourcePermission = `${resource}:*`;
      if (permissions.includes(resourcePermission)) {
        return true;
      }

      // Check for conditional permissions
      for (const permission of permissions) {
        if (await this.evaluateConditionalPermission(userId, permission, resource, action, context)) {
          return true;
        }
      }

      return false;

    } catch (error) {
      console.error('Error checking resource access:', error);
      return false;
    }
  }

  // Helper Methods
  private static async createDefaultRoles(organizationId: string): Promise<void> {
    const defaultRoles = [
      {
        name: 'admin',
        description: 'Full administrative access',
        permissions: [
          { name: '*', resource: '*', action: '*', description: 'All permissions' }
        ],
        is_system_role: true
      },
      {
        name: 'manager',
        description: 'Management access to organization resources',
        permissions: [
          { name: 'properties:*', resource: 'properties', action: '*', description: 'All property operations' },
          { name: 'reports:*', resource: 'reports', action: '*', description: 'All report operations' },
          { name: 'users:read', resource: 'users', action: 'read', description: 'View users' }
        ],
        is_system_role: true
      },
      {
        name: 'user',
        description: 'Standard user access',
        permissions: [
          { name: 'properties:read', resource: 'properties', action: 'read', description: 'View properties' },
          { name: 'properties:create', resource: 'properties', action: 'create', description: 'Create properties' },
          { name: 'reports:read', resource: 'reports', action: 'read', description: 'View reports' }
        ],
        is_system_role: true
      },
      {
        name: 'viewer',
        description: 'Read-only access',
        permissions: [
          { name: 'properties:read', resource: 'properties', action: 'read', description: 'View properties' },
          { name: 'reports:read', resource: 'reports', action: 'read', description: 'View reports' }
        ],
        is_system_role: true
      }
    ];

    for (const roleData of defaultRoles) {
      await this.createRole({
        ...roleData,
        organization_id: organizationId
      });
    }
  }

  private static async getRoleByName(roleName: string, organizationId: string): Promise<Role | null> {
    try {
      const { data } = await supabaseAdmin
        .from('roles')
        .select('*')
        .eq('name', roleName)
        .eq('organization_id', organizationId)
        .single();

      return data;
    } catch (error) {
      return null;
    }
  }

  private static async refreshUserPermissions(userId: string): Promise<void> {
    // This would rebuild the user permissions cache
    // Implementation depends on your caching strategy
  }

  private static async updateOrganizationUserCount(organizationId: string): Promise<void> {
    try {
      const { count } = await supabaseAdmin
        .from('enterprise_users')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('status', 'active');

      await supabaseAdmin
        .from('organizations')
        .update({
          current_users: count || 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', organizationId);

    } catch (error) {
      console.error('Error updating organization user count:', error);
    }
  }

  private static async evaluateConditionalPermission(
    userId: string,
    permission: string,
    resource: string,
    action: string,
    context?: any
  ): Promise<boolean> {
    // This would evaluate conditional permissions based on context
    // For example: "properties:edit" where user owns the property
    return false;
  }

  // Mock data for development
  static getMockOrganization(): Organization {
    return {
      id: 'org_enterprise_001',
      name: 'Enterprise Real Estate Corp',
      domain: 'enterprise.otoraport.pl',
      sso_enabled: true,
      sso_provider: 'microsoft',
      subscription_plan: 'enterprise',
      max_users: 100,
      current_users: 25,
      admin_users: ['admin@enterprise.otoraport.pl'],
      settings: {
        require_mfa: true,
        password_policy: {
          min_length: 12,
          require_special_chars: true,
          require_numbers: true,
          require_uppercase: true
        },
        session_timeout: 480, // 8 hours
        ip_whitelist: ['192.168.1.0/24', '10.0.0.0/8']
      },
      created_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    };
  }

  static getMockEnterpriseUsers(): EnterpriseUser[] {
    return [
      {
        id: 'user_ent_001',
        email: 'admin@enterprise.otoraport.pl',
        name: 'Anna Kowalska',
        role: 'admin',
        permissions: ['*'],
        department: 'IT',
        organization_id: 'org_enterprise_001',
        sso_provider: 'microsoft',
        sso_id: 'akowalska@enterprise.onmicrosoft.com',
        last_login_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        created_at: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'user_ent_002',
        email: 'manager@enterprise.otoraport.pl',
        name: 'Piotr Nowak',
        role: 'manager',
        permissions: ['properties:*', 'reports:*', 'users:read'],
        department: 'Operations',
        organization_id: 'org_enterprise_001',
        sso_provider: 'microsoft',
        sso_id: 'pnowak@enterprise.onmicrosoft.com',
        last_login_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'user_ent_003',
        email: 'user@enterprise.otoraport.pl',
        name: 'Maria Wiśniewska',
        role: 'user',
        permissions: ['properties:read', 'properties:create', 'reports:read'],
        department: 'Sales',
        organization_id: 'org_enterprise_001',
        sso_provider: 'microsoft',
        sso_id: 'mwisniewska@enterprise.onmicrosoft.com',
        last_login_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  }
}