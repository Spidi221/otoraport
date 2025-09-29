import { createAdminClient } from '@/lib/supabase/server';

export interface WhiteLabelPartner {
  id: string;
  company_name: string;
  contact_email: string;
  contact_name: string;
  domain: string;
  subdomain: string;
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  brand_name: string;
  support_email: string;
  support_phone?: string;
  custom_css?: string;
  features_enabled: string[];
  commission_rate: number; // percentage
  status: 'pending' | 'active' | 'suspended' | 'terminated';
  created_at: string;
  activated_at?: string;
  last_login_at?: string;
  total_revenue: number;
  total_commission: number;
  client_count: number;
  settings: {
    allow_custom_pricing: boolean;
    allow_trial_extension: boolean;
    require_approval_for_new_clients: boolean;
    max_clients: number;
    custom_onboarding_flow: boolean;
  };
}

export interface WhiteLabelClient {
  id: string;
  partner_id: string;
  developer_id: string;
  custom_pricing?: {
    monthly_price: number;
    yearly_price: number;
    trial_days: number;
  };
  branded_dashboard_url: string;
  status: 'trial' | 'active' | 'cancelled' | 'suspended';
  created_at: string;
  trial_ends_at?: string;
  subscription_starts_at?: string;
  last_activity_at?: string;
  lifetime_value: number;
  commission_earned: number;
}

export interface PartnerDashboardMetrics {
  total_clients: number;
  active_clients: number;
  trial_clients: number;
  total_revenue: number;
  commission_earned: number;
  conversion_rate: number;
  average_client_value: number;
  churn_rate: number;
  monthly_recurring_revenue: number;
}

export class WhiteLabelEngine {

  // Partner Management
  static async createPartner(partnerData: Omit<WhiteLabelPartner, 'id' | 'created_at' | 'total_revenue' | 'total_commission' | 'client_count'>): Promise<WhiteLabelPartner> {
    const partner: WhiteLabelPartner = {
      id: `partner_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...partnerData,
      created_at: new Date().toISOString(),
      total_revenue: 0,
      total_commission: 0,
      client_count: 0
    };

    try {
      await createAdminClient()
        .from('whitelabel_partners')
        .insert(partner);

      // Set up branded subdomain
      await this.setupBrandedSubdomain(partner.subdomain, partner.id);

    } catch (error) {
      console.error('Error creating partner:', error);
      throw error;
    }

    return partner;
  }

  static async getPartner(partnerId: string): Promise<WhiteLabelPartner | null> {
    try {
      const { data } = await createAdminClient()
        .from('whitelabel_partners')
        .select('*')
        .eq('id', partnerId)
        .single();

      return data;
    } catch (error) {
      return null;
    }
  }

  static async getPartnerByDomain(domain: string): Promise<WhiteLabelPartner | null> {
    try {
      const { data } = await createAdminClient()
        .from('whitelabel_partners')
        .select('*')
        .or(`domain.eq.${domain},subdomain.eq.${domain}`)
        .eq('status', 'active')
        .single();

      return data;
    } catch (error) {
      return null;
    }
  }

  // Client Management
  static async createClient(partnerId: string, clientData: {
    developer_id: string;
    custom_pricing?: WhiteLabelClient['custom_pricing'];
  }): Promise<WhiteLabelClient> {
    const partner = await this.getPartner(partnerId);
    if (!partner) {
      throw new Error('Partner not found');
    }

    const client: WhiteLabelClient = {
      id: `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      partner_id: partnerId,
      developer_id: clientData.developer_id,
      custom_pricing: clientData.custom_pricing,
      branded_dashboard_url: `https://${partner.subdomain}.otoraport.pl/dashboard`,
      status: 'trial',
      created_at: new Date().toISOString(),
      trial_ends_at: this.calculateTrialEndDate(clientData.custom_pricing?.trial_days || 14),
      lifetime_value: 0,
      commission_earned: 0
    };

    try {
      await createAdminClient()
        .from('whitelabel_clients')
        .insert(client);

      // Update partner client count
      await this.updatePartnerMetrics(partnerId);

      // Send branded onboarding email
      await this.sendBrandedOnboardingEmail(client, partner);

    } catch (error) {
      console.error('Error creating white-label client:', error);
      throw error;
    }

    return client;
  }

  static async getPartnerClients(partnerId: string): Promise<WhiteLabelClient[]> {
    try {
      const { data } = await createAdminClient()
        .from('whitelabel_clients')
        .select('*')
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false });

      return data || [];
    } catch (error) {
      console.error('Error fetching partner clients:', error);
      return [];
    }
  }

  // Dashboard Customization
  static async getPartnerBranding(partnerId: string): Promise<{
    brand_name: string;
    logo_url?: string;
    primary_color: string;
    secondary_color: string;
    custom_css?: string;
    support_email: string;
    support_phone?: string;
  } | null> {
    const partner = await this.getPartner(partnerId);
    if (!partner) return null;

    return {
      brand_name: partner.brand_name,
      logo_url: partner.logo_url,
      primary_color: partner.primary_color,
      secondary_color: partner.secondary_color,
      custom_css: partner.custom_css,
      support_email: partner.support_email,
      support_phone: partner.support_phone
    };
  }

  static async updatePartnerBranding(partnerId: string, branding: Partial<{
    logo_url: string;
    primary_color: string;
    secondary_color: string;
    custom_css: string;
    support_email: string;
    support_phone: string;
  }>): Promise<void> {
    try {
      await createAdminClient()
        .from('whitelabel_partners')
        .update({
          ...branding,
          updated_at: new Date().toISOString()
        })
        .eq('id', partnerId);

      // Regenerate branded assets
      await this.regenerateBrandedAssets(partnerId);

    } catch (error) {
      console.error('Error updating partner branding:', error);
      throw error;
    }
  }

  // Metrics and Analytics
  static async getPartnerMetrics(partnerId: string, dateRange: { start: Date; end: Date }): Promise<PartnerDashboardMetrics> {
    try {
      const clients = await this.getPartnerClients(partnerId);
      const partner = await this.getPartner(partnerId);

      if (!partner) {
        throw new Error('Partner not found');
      }

      // Filter clients by date range
      const filteredClients = clients.filter(client => {
        const createdAt = new Date(client.created_at);
        return createdAt >= dateRange.start && createdAt <= dateRange.end;
      });

      const totalClients = filteredClients.length;
      const activeClients = filteredClients.filter(c => c.status === 'active').length;
      const trialClients = filteredClients.filter(c => c.status === 'trial').length;

      // Calculate financial metrics
      const totalRevenue = filteredClients.reduce((sum, client) => sum + client.lifetime_value, 0);
      const commissionEarned = filteredClients.reduce((sum, client) => sum + client.commission_earned, 0);

      // Calculate conversion rate
      const conversions = filteredClients.filter(c => c.status === 'active').length;
      const totalTrials = filteredClients.filter(c => c.status === 'trial' || c.status === 'active').length;
      const conversionRate = totalTrials > 0 ? conversions / totalTrials : 0;

      // Calculate average client value
      const averageClientValue = activeClients > 0 ? totalRevenue / activeClients : 0;

      // Calculate MRR (simplified)
      const monthlyRevenue = filteredClients
        .filter(c => c.status === 'active')
        .reduce((sum, client) => {
          // Assuming standard pricing if no custom pricing
          const monthlyPrice = client.custom_pricing?.monthly_price || 24900; // 249 PLN default
          return sum + monthlyPrice;
        }, 0);

      return {
        total_clients: totalClients,
        active_clients: activeClients,
        trial_clients: trialClients,
        total_revenue: totalRevenue,
        commission_earned: commissionEarned,
        conversion_rate: conversionRate,
        average_client_value: averageClientValue,
        churn_rate: 0.05, // Mock 5% churn rate
        monthly_recurring_revenue: monthlyRevenue
      };

    } catch (error) {
      console.error('Error calculating partner metrics:', error);
      throw error;
    }
  }

  // Commission Calculations
  static async calculateCommission(clientId: string, revenue: number): Promise<number> {
    try {
      const { data: client } = await createAdminClient()
        .from('whitelabel_clients')
        .select('partner_id')
        .eq('id', clientId)
        .single();

      if (!client) return 0;

      const partner = await this.getPartner(client.partner_id);
      if (!partner) return 0;

      return revenue * (partner.commission_rate / 100);

    } catch (error) {
      console.error('Error calculating commission:', error);
      return 0;
    }
  }

  static async processCommissionPayment(partnerId: string, amount: number): Promise<void> {
    try {
      // Record commission payment
      await createAdminClient()
        .from('commission_payments')
        .insert({
          partner_id: partnerId,
          amount,
          currency: 'PLN',
          status: 'pending',
          payment_date: new Date().toISOString(),
          reference: `COMM_${Date.now()}`
        });

      // Update partner total commission
      await createAdminClient()
        .from('whitelabel_partners')
        .update({
          total_commission: createAdminClient.rpc('increment_commission', { amount }),
          last_commission_payment: new Date().toISOString()
        })
        .eq('id', partnerId);

    } catch (error) {
      console.error('Error processing commission payment:', error);
      throw error;
    }
  }

  // Helper Methods
  private static async setupBrandedSubdomain(subdomain: string, partnerId: string): Promise<void> {
    // In production, this would configure DNS and CDN for the subdomain
    console.log(`Setting up branded subdomain: ${subdomain}.otoraport.pl for partner ${partnerId}`);

    // Mock implementation - in reality this would:
    // 1. Create DNS CNAME record
    // 2. Configure SSL certificate
    // 3. Set up CDN routing
    // 4. Update edge workers for branded requests
  }

  private static async updatePartnerMetrics(partnerId: string): Promise<void> {
    try {
      const clients = await this.getPartnerClients(partnerId);
      const clientCount = clients.length;
      const totalRevenue = clients.reduce((sum, client) => sum + client.lifetime_value, 0);
      const totalCommission = clients.reduce((sum, client) => sum + client.commission_earned, 0);

      await createAdminClient()
        .from('whitelabel_partners')
        .update({
          client_count: clientCount,
          total_revenue: totalRevenue,
          total_commission: totalCommission,
          updated_at: new Date().toISOString()
        })
        .eq('id', partnerId);

    } catch (error) {
      console.error('Error updating partner metrics:', error);
    }
  }

  private static calculateTrialEndDate(trialDays: number): string {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + trialDays);
    return endDate.toISOString();
  }

  private static async sendBrandedOnboardingEmail(client: WhiteLabelClient, partner: WhiteLabelPartner): Promise<void> {
    try {
      // This would integrate with the email marketing system
      console.log(`Sending branded onboarding email for client ${client.id} from partner ${partner.brand_name}`);

      // Implementation would:
      // 1. Use partner's branding in email template
      // 2. Include partner's support contact info
      // 3. Use branded URLs and assets
      // 4. Track engagement under partner's metrics

    } catch (error) {
      console.error('Error sending branded onboarding email:', error);
    }
  }

  private static async regenerateBrandedAssets(partnerId: string): Promise<void> {
    try {
      // This would regenerate CSS, logos, and other branded assets
      console.log(`Regenerating branded assets for partner ${partnerId}`);

      // Implementation would:
      // 1. Generate CSS with partner colors
      // 2. Process and optimize partner logo
      // 3. Create branded email templates
      // 4. Update CDN cache

    } catch (error) {
      console.error('Error regenerating branded assets:', error);
    }
  }

  // Mock data for fallback
  static getMockPartnerMetrics(): PartnerDashboardMetrics {
    return {
      total_clients: 34,
      active_clients: 28,
      trial_clients: 6,
      total_revenue: 168000, // 168k PLN
      commission_earned: 25200, // 15% commission
      conversion_rate: 0.82, // 82% trial to paid conversion
      average_client_value: 6000, // Average annual value
      churn_rate: 0.03, // 3% monthly churn
      monthly_recurring_revenue: 69720 // Monthly recurring revenue
    };
  }

  static getMockPartnerData(): WhiteLabelPartner {
    return {
      id: 'partner_mock_001',
      company_name: 'PropertyTech Solutions Sp. z o.o.',
      contact_email: 'partners@propertytech.pl',
      contact_name: 'Anna Kowalska',
      domain: 'propertytech.pl',
      subdomain: 'propertytech',
      logo_url: 'https://propertytech.pl/logo.png',
      primary_color: '#1e40af',
      secondary_color: '#3b82f6',
      brand_name: 'PropertyTech Reporter',
      support_email: 'support@propertytech.pl',
      support_phone: '+48 22 123 4567',
      features_enabled: ['analytics', 'automation', 'custom_domains', 'api_access'],
      commission_rate: 15,
      status: 'active',
      created_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
      activated_at: new Date(Date.now() - 175 * 24 * 60 * 60 * 1000).toISOString(),
      last_login_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      total_revenue: 168000,
      total_commission: 25200,
      client_count: 34,
      settings: {
        allow_custom_pricing: true,
        allow_trial_extension: true,
        require_approval_for_new_clients: false,
        max_clients: 100,
        custom_onboarding_flow: true
      }
    };
  }
}