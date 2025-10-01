import { supabase } from '@/integrations/supabase/client';
import type { 
  DatabaseProperty, 
  PropertyWithTenant, 
  Tenant, 
  FinancialRecord, 
  PropertyDocument, 
  Notification,
  PropertyInvitation,
  OwnerDashboardStats 
} from '@/types/owner-portal';

// Sync properties by phone - automatically links properties to owner based on phone number
export const syncPropertiesByPhone = async (ownerId: string): Promise<void> => {
  // Get owner's phone from profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('phone')
    .eq('id', ownerId)
    .single();

  if (profileError || !profile?.phone) {
    console.log('No phone found for owner:', ownerId);
    return;
  }

  // Find all properties with matching owner_phone
  const { data: matchingProperties, error: propertiesError } = await supabase
    .from('properties')
    .select('id')
    .eq('owner_phone', profile.phone);

  if (propertiesError || !matchingProperties || matchingProperties.length === 0) {
    console.log('No matching properties found for phone:', profile.phone);
    return;
  }

  // Get existing property_owners records
  const { data: existingOwnership } = await supabase
    .from('property_owners')
    .select('property_id')
    .eq('owner_id', ownerId);

  const existingPropertyIds = new Set(existingOwnership?.map(o => o.property_id) || []);

  // Create property_owners records for properties that aren't already linked
  const newOwnershipRecords = matchingProperties
    .filter(p => !existingPropertyIds.has(p.id))
    .map(p => ({
      property_id: p.id,
      owner_id: ownerId,
      ownership_percentage: 100,
    }));

  if (newOwnershipRecords.length > 0) {
    const { error: insertError } = await supabase
      .from('property_owners')
      .insert(newOwnershipRecords);

    if (insertError) {
      console.error('Error creating property ownership:', insertError);
    } else {
      console.log(`Linked ${newOwnershipRecords.length} properties to owner ${ownerId}`);
    }
  }
};

// Property management functions
export const getOwnerProperties = async (ownerId: string): Promise<PropertyWithTenant[]> => {
  // First, sync properties by phone number
  await syncPropertiesByPhone(ownerId);

  // Then get property IDs for this owner
  const { data: ownershipData, error: ownershipError } = await supabase
    .from('property_owners')
    .select('property_id')
    .eq('owner_id', ownerId);

  if (ownershipError || !ownershipData || ownershipData.length === 0) {
    console.log('No properties found for owner:', ownerId);
    return [];
  }

  const propertyIds = ownershipData.map(o => o.property_id);

  // Then get properties with their tenants
  const { data, error } = await supabase
    .from('properties')
    .select(`
      *,
      tenants(*)
    `)
    .in('id', propertyIds);

  if (error) {
    console.error('Error fetching owner properties:', error);
    return [];
  }

  return (data || []).map(property => {
    const activeTenant = property.tenants && property.tenants.length > 0 
      ? property.tenants.find((t: any) => t.is_active) 
      : null;
    
    return {
      ...property,
      status: property.status as 'unknown' | 'occupied' | 'vacant' | 'maintenance',
      contact_status: property.contact_status as 'not_contacted' | 'called_no_answer' | 'called_answered' | 'needs_callback',
      tenant: activeTenant,
    };
  });
};

export const getPropertyTenant = async (propertyId: string): Promise<Tenant | null> => {
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('property_id', propertyId)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('Error fetching tenant:', error);
    return null;
  }

  return data;
};

export const updateProperty = async (propertyId: string, updates: Partial<DatabaseProperty>) => {
  const { data, error } = await supabase
    .from('properties')
    .update(updates)
    .eq('id', propertyId)
    .select()
    .single();

  return { data, error };
};

export const createTenant = async (tenant: Omit<Tenant, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('tenants')
    .insert(tenant)
    .select()
    .single();

  return { data, error };
};

export const updateTenant = async (tenantId: string, updates: Partial<Tenant>) => {
  const { data, error } = await supabase
    .from('tenants')
    .update(updates)
    .eq('id', tenantId)
    .select()
    .single();

  return { data, error };
};

// Financial management functions
export const getPropertyFinancials = async (propertyId: string): Promise<FinancialRecord[]> => {
  const { data, error } = await supabase
    .from('financial_records')
    .select('*')
    .eq('property_id', propertyId)
    .order('transaction_date', { ascending: false });

  if (error) {
    console.error('Error fetching financial records:', error);
    return [];
  }

  return (data || []) as FinancialRecord[];
};

export const createFinancialRecord = async (record: Omit<FinancialRecord, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('financial_records')
    .insert(record)
    .select()
    .single();

  return { data, error };
};

export const getOwnerDashboardStats = async (ownerId: string): Promise<OwnerDashboardStats> => {
  // First, sync properties by phone number
  await syncPropertiesByPhone(ownerId);

  // Then get property IDs for this owner
  const { data: ownershipData } = await supabase
    .from('property_owners')
    .select('property_id')
    .eq('owner_id', ownerId);

  if (!ownershipData || ownershipData.length === 0) {
    return {
      total_properties: 0,
      occupied_properties: 0,
      vacant_properties: 0,
      total_monthly_income: 0,
      total_monthly_expenses: 0,
      net_monthly_profit: 0,
      properties_needing_attention: 0,
    };
  }

  const propertyIds = ownershipData.map(o => o.property_id);

  // Get owner's properties
  const { data: properties } = await supabase
    .from('properties')
    .select('*')
    .in('id', propertyIds);

  if (!properties) {
    return {
      total_properties: 0,
      occupied_properties: 0,
      vacant_properties: 0,
      total_monthly_income: 0,
      total_monthly_expenses: 0,
      net_monthly_profit: 0,
      properties_needing_attention: 0,
    };
  }

  const occupied = properties.filter(p => p.status === 'occupied').length;
  const vacant = properties.filter(p => p.status === 'vacant').length;
  const needing_attention = properties.filter(p => 
    p.status === 'maintenance' || 
    p.contact_status === 'needs_callback'
  ).length;

  // Calculate total income from active tenants based on lease duration
  const { data: activeTenants } = await supabase
    .from('tenants')
    .select('monthly_rent, lease_start_date')
    .in('property_id', propertyIds)
    .eq('is_active', true);

  const totalIncomeFromTenants = activeTenants?.reduce((sum, t) => {
    if (!t.monthly_rent || !t.lease_start_date) return sum;
    
    const startDate = new Date(t.lease_start_date);
    const today = new Date();
    
    // Calculate number of months from lease start to today
    const monthsDiff = (today.getFullYear() - startDate.getFullYear()) * 12 + 
                       (today.getMonth() - startDate.getMonth()) + 1; // +1 to include current month
    
    const totalRent = t.monthly_rent * Math.max(0, monthsDiff);
    return sum + totalRent;
  }, 0) || 0;

  // Get financial summary for current month
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const { data: financials } = await supabase
    .from('financial_records')
    .select('type, amount')
    .in('property_id', properties.map(p => p.id))
    .gte('transaction_date', `${currentMonth}-01`)
    .lt('transaction_date', `${currentMonth}-32`);

  const income = financials?.filter(f => f.type === 'income').reduce((sum, f) => sum + f.amount, 0) || 0;
  const expenses = financials?.filter(f => f.type === 'expense').reduce((sum, f) => sum + f.amount, 0) || 0;

  // Total income = recorded income + calculated income from lease periods
  const totalIncome = income + totalIncomeFromTenants;

  return {
    total_properties: properties.length,
    occupied_properties: occupied,
    vacant_properties: vacant,
    total_monthly_income: totalIncome,
    total_monthly_expenses: expenses,
    net_monthly_profit: totalIncome - expenses,
    properties_needing_attention: needing_attention,
  };
};

// Document management functions
export const getPropertyDocuments = async (propertyId: string): Promise<PropertyDocument[]> => {
  const { data, error } = await supabase
    .from('property_documents')
    .select('*')
    .eq('property_id', propertyId)
    .order('uploaded_at', { ascending: false });

  if (error) {
    console.error('Error fetching documents:', error);
    return [];
  }

  return (data || []) as PropertyDocument[];
};

// Notification functions
export const getOwnerNotifications = async (ownerId: string): Promise<Notification[]> => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('recipient_id', ownerId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }

  return (data || []) as Notification[];
};

export const markNotificationAsRead = async (notificationId: string) => {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  return { error };
};

// Invitation functions (admin only)
export const createPropertyInvitation = async (
  email: string,
  propertyIds: string[],
  invitedBy: string
): Promise<{ data: PropertyInvitation | null; error: any }> => {
  const token = crypto.randomUUID();
  
  const { data, error } = await supabase
    .from('property_invitations')
    .insert({
      email,
      property_ids: propertyIds,
      invitation_token: token,
      invited_by: invitedBy,
    })
    .select()
    .single();

  return { data, error };
};

export const getInvitationByToken = async (token: string): Promise<PropertyInvitation | null> => {
  const { data, error } = await supabase
    .from('property_invitations')
    .select('*')
    .eq('invitation_token', token)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error) {
    console.error('Error fetching invitation:', error);
    return null;
  }

  return data;
};

export const useInvitation = async (token: string, userId: string) => {
  const invitation = await getInvitationByToken(token);
  if (!invitation) {
    return { error: 'Invalid or expired invitation' };
  }

  // Mark invitation as used
  const { error: invitationError } = await supabase
    .from('property_invitations')
    .update({ used_at: new Date().toISOString() })
    .eq('invitation_token', token);

  if (invitationError) {
    return { error: invitationError };
  }

  // Update user role to property_owner
  const { error: roleError } = await supabase
    .from('profiles')
    .update({ role: 'property_owner' })
    .eq('id', userId);

  if (roleError) {
    return { error: roleError };
  }

  // Assign properties to owner
  const ownershipRecords = invitation.property_ids.map(propertyId => ({
    property_id: propertyId,
    owner_id: userId,
  }));

  const { error: ownershipError } = await supabase
    .from('property_owners')
    .insert(ownershipRecords);

  return { error: ownershipError };
};