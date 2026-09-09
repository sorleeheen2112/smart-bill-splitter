import { createClient } from '@supabase/supabase-js';
import { PartyBill } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project-id')
);

// Create Supabase client (fallback client if not configured yet)
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

export interface HostProfile {
  id: string;
  email: string;
  firstName: string;
  lastName?: string;
  phoneNumber?: string;
  defaultPromptPay?: string;
}

// Database helper functions for Party Bills
export async function fetchPartyBillFromSupabase(billId: string): Promise<PartyBill | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('party_bills')
      .select('*')
      .eq('id', billId)
      .single();

    if (error || !data) return null;

    // Check if is_published is saved in top-level column or metadata
    const isPublished = data.is_published !== undefined 
      ? Boolean(data.is_published) 
      : ((data.gangs as any)?.[0]?._meta?.isPublished ?? false);
    const publishedAt = data.published_at || (data.gangs as any)?.[0]?._meta?.publishedAt;

    return {
      id: data.id,
      title: data.title,
      date: data.date,
      location: data.location || '',
      vatMode: data.vat_mode || 'INCLUDE',
      vatRate: Number(data.vat_rate) || 0.07,
      serviceChargeRate: Number(data.service_charge_rate) || 0,
      sponsorBudget: Number(data.sponsor_budget) || 0,
      promptPayNumber: data.promptpay_number || '',
      promptPayName: data.promptpay_name || '',
      payerMemberId: data.payer_member_id || (data.members || []).find((m: any) => m.isPayer)?.id,
      hostPin: data.host_pin || '1234',
      isPublished,
      publishedAt,
      gangs: data.gangs || [],
      members: data.members || [],
      items: data.items || [],
      updatedAt: data.updated_at,
    };
  } catch (err) {
    console.error('Failed to fetch bill from Supabase:', err);
    return null;
  }
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function savePartyBillToSupabase(bill: PartyBill, hostId?: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    // Check if there is an active authenticated session
    let validHostId: string | null = null;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id && UUID_REGEX.test(session.user.id)) {
        validHostId = session.user.id;
      } else if (hostId && UUID_REGEX.test(hostId)) {
        validHostId = hostId;
      }
    } catch {
      if (hostId && UUID_REGEX.test(hostId)) {
        validHostId = hostId;
      }
    }

    const payload: any = {
      id: bill.id,
      host_id: validHostId,
      title: bill.title,
      date: bill.date,
      location: bill.location || '',
      service_charge_rate: bill.serviceChargeRate || 0,
      vat_mode: bill.vatMode,
      vat_rate: bill.vatRate,
      sponsor_budget: bill.sponsorBudget,
      promptpay_number: bill.promptPayNumber,
      promptpay_name: bill.promptPayName || '',
      host_pin: bill.hostPin || '1234',
      is_published: bill.isPublished ?? false,
      published_at: bill.publishedAt || null,
      gangs: bill.gangs,
      members: bill.members,
      items: bill.items,
      updated_at: new Date().toISOString(),
    };

    let { error } = await supabase
      .from('party_bills')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      if (error.message?.includes('service_charge_rate') || error.code === '42703') {
        delete payload.service_charge_rate;
      }
      // If error is because is_published column doesn't exist yet in Supabase table
      if (error.message?.includes('is_published') || error.message?.includes('published_at') || error.code === '42703') {
        delete payload.is_published;
        delete payload.published_at;
      }
      const res = await supabase.from('party_bills').upsert(payload, { onConflict: 'id' });
      error = res.error;

      // Fallback: If host_id caused RLS / FK error, retry without host_id
      if (error && validHostId && (error.code === '42501' || error.code === '23503')) {
        const fallbackPayload = { ...payload, host_id: null };
        const { error: retryErr } = await supabase
          .from('party_bills')
          .upsert(fallbackPayload, { onConflict: 'id' });
        if (!retryErr) return true;
      }

      if (error) {
        console.warn('Supabase upsert warning:', error.message || error);
        return false;
      }
    }
    return true;
  } catch (err: any) {
    console.warn('Failed to save bill to Supabase:', err?.message || err);
    return false;
  }
}

export async function fetchHostPartyBills(hostId: string): Promise<PartyBill[]> {
  if (!isSupabaseConfigured || !hostId) return [];
  try {
    const { data, error } = await supabase
      .from('party_bills')
      .select('*')
      .eq('host_id', hostId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((d: any) => ({
      id: d.id,
      title: d.title,
      date: d.date,
      location: d.location || '',
      serviceChargeRate: Number(d.service_charge_rate) || 0,
      vatMode: d.vat_mode || 'INCLUDE',
      vatRate: Number(d.vat_rate) || 0.07,
      sponsorBudget: Number(d.sponsor_budget) || 0,
      promptPayNumber: d.promptpay_number || '',
      promptPayName: d.promptpay_name || '',
      hostPin: d.host_pin || '1234',
      payerMemberId: d.payer_member_id || (d.members || []).find((m: any) => m.isPayer)?.id,
      isPublished: d.is_published ?? false,
      publishedAt: d.published_at,
      gangs: d.gangs || [],
      members: d.members || [],
      items: d.items || [],
      updatedAt: d.updated_at,
    }));
  } catch (err) {
    console.error('Failed to fetch host bills:', err);
    return [];
  }
}

export async function deletePartyBillFromSupabase(billId: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase
      .from('party_bills')
      .delete()
      .eq('id', billId);

    return !error;
  } catch (err) {
    console.error('Failed to delete bill:', err);
    return false;
  }
}
