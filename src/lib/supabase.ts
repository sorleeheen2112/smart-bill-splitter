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

    // Retrieve meta embedded in gangs or top-level columns
    const embeddedMeta = (data.gangs as any)?.[0]?._meta || (data.members as any)?.[0]?._meta || {};
    const isPublished = data.is_published !== undefined 
      ? Boolean(data.is_published) 
      : (embeddedMeta.isPublished ?? false);
    const publishedAt = data.published_at || embeddedMeta.publishedAt;
    const serviceChargeRate = data.service_charge_rate !== undefined
      ? Number(data.service_charge_rate)
      : (embeddedMeta.serviceChargeRate !== undefined ? Number(embeddedMeta.serviceChargeRate) : 0);
    const depositAmount = data.deposit_amount !== undefined
      ? Number(data.deposit_amount)
      : (embeddedMeta.depositAmount !== undefined ? Number(embeddedMeta.depositAmount) : 0);

    return {
      id: data.id,
      title: data.title,
      date: data.date,
      location: data.location || '',
      vatMode: data.vat_mode || 'INCLUDE',
      vatRate: Number(data.vat_rate) || 0.07,
      serviceChargeRate: isNaN(serviceChargeRate) ? 0 : serviceChargeRate,
      sponsorBudget: Number(data.sponsor_budget) || 0,
      depositAmount: isNaN(depositAmount) ? 0 : depositAmount,
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

    // Embed meta properties into gangs jsonb for backward schema compatibility
    const metaObj = {
      isPublished: bill.isPublished ?? false,
      publishedAt: bill.publishedAt || null,
      serviceChargeRate: bill.serviceChargeRate || 0,
      depositAmount: bill.depositAmount || 0,
    };

    let safeGangs: any[] = Array.isArray(bill.gangs) ? [...bill.gangs] : [];
    if (safeGangs.length === 0) {
      safeGangs = [{ id: '_meta_container', name: '', membersCount: 0, _meta: metaObj }];
    } else {
      safeGangs[0] = { ...safeGangs[0], _meta: metaObj };
    }

    const payload: Record<string, any> = {
      id: bill.id,
      host_id: validHostId,
      title: bill.title,
      date: bill.date,
      location: bill.location || '',
      vat_mode: bill.vatMode,
      vat_rate: bill.vatRate,
      sponsor_budget: bill.sponsorBudget || 0,
      service_charge_rate: bill.serviceChargeRate || 0,
      deposit_amount: bill.depositAmount || 0,
      promptpay_number: bill.promptPayNumber,
      promptpay_name: bill.promptPayName || '',
      host_pin: bill.hostPin || '1234',
      is_published: bill.isPublished ?? false,
      published_at: bill.publishedAt || null,
      gangs: safeGangs,
      members: bill.members,
      items: bill.items,
      updated_at: new Date().toISOString(),
    };

    // Retry loop: If schema cache is missing optional columns (PGRST204 / 42703), strip missing column and retry
    for (let attempt = 0; attempt < 6; attempt++) {
      const { error } = await supabase.from('party_bills').upsert(payload, { onConflict: 'id' });
      if (!error) {
        return true;
      }

      const errMsg = error.message || '';
      const isMissingColumn =
        error.code === 'PGRST204' ||
        error.code === '42703' ||
        errMsg.includes('Could not find the') ||
        errMsg.includes('column of');

      if (isMissingColumn) {
        // Extract missing column name from message e.g. "Could not find the 'service_charge_rate' column"
        const match = errMsg.match(/['"]([a-zA-Z0-9_]+)['"] column/);
        if (match && match[1] && payload[match[1]] !== undefined) {
          delete payload[match[1]];
          continue;
        }

        // Fallback strip all optional new columns
        let removedAny = false;
        const optionalColumns = ['service_charge_rate', 'deposit_amount', 'is_published', 'published_at'];
        for (const col of optionalColumns) {
          if (payload[col] !== undefined) {
            delete payload[col];
            removedAny = true;
          }
        }
        if (removedAny) continue;
      }

      // If host_id foreign key / RLS error, strip host_id and retry
      if (payload.host_id && (error.code === '42501' || error.code === '23503' || errMsg.includes('foreign key') || errMsg.includes('host_id'))) {
        payload.host_id = null;
        continue;
      }

      console.warn(`Supabase upsert warning (attempt ${attempt + 1}):`, errMsg);
      break;
    }

    return false;
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

    return data.map((d: any) => {
      const embeddedMeta = (d.gangs as any)?.[0]?._meta || (d.members as any)?.[0]?._meta || {};
      const isPublished = d.is_published !== undefined 
        ? Boolean(d.is_published) 
        : (embeddedMeta.isPublished ?? false);
      const publishedAt = d.published_at || embeddedMeta.publishedAt;
      const serviceChargeRate = d.service_charge_rate !== undefined
        ? Number(d.service_charge_rate)
        : (embeddedMeta.serviceChargeRate !== undefined ? Number(embeddedMeta.serviceChargeRate) : 0);
      const depositAmount = d.deposit_amount !== undefined
        ? Number(d.deposit_amount)
        : (embeddedMeta.depositAmount !== undefined ? Number(embeddedMeta.depositAmount) : 0);

      return {
        id: d.id,
        title: d.title,
        date: d.date,
        location: d.location || '',
        serviceChargeRate: isNaN(serviceChargeRate) ? 0 : serviceChargeRate,
        vatMode: d.vat_mode || 'INCLUDE',
        vatRate: Number(d.vat_rate) || 0.07,
        sponsorBudget: Number(d.sponsor_budget) || 0,
        depositAmount: isNaN(depositAmount) ? 0 : depositAmount,
        promptPayNumber: d.promptpay_number || '',
        promptPayName: d.promptpay_name || '',
        hostPin: d.host_pin || '1234',
        payerMemberId: d.payer_member_id || (d.members || []).find((m: any) => m.isPayer)?.id,
        isPublished,
        publishedAt,
        gangs: d.gangs || [],
        members: d.members || [],
        items: d.items || [],
        updatedAt: d.updated_at,
      };
    });
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
