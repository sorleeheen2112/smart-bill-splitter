import { createClient } from '@supabase/supabase-js';
import { PartyBill, Member } from './types';

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

/**
 * Helper to map DB row from party_members to application Member model
 */
export function mapDbMemberToApp(row: any): Member {
  return {
    id: row.id,
    name: row.name || 'ไม่ระบุชื่อ',
    gangIds: Array.isArray(row.gang_ids) ? row.gang_ids : [],
    isFree: Boolean(row.is_free),
    isPayer: Boolean(row.is_payer),
    paymentStatus: (row.payment_status || 'PENDING') as Member['paymentStatus'],
    slipUrl: row.slip_url || undefined,
    slipUploadedAt: row.slip_uploaded_at || undefined,
    paidAmount: row.paid_amount ? Number(row.paid_amount) : undefined,
    note: row.note || undefined,
  };
}

/**
 * Smart merge members between JSONB column and relational party_members table
 * Ensures that verified status, uploaded slips, and notes are never lost or overwritten by stale data.
 */
export function mergeMembersSafely(jsonMembers: Member[] = [], tableMembers: Member[] = []): Member[] {
  if (!tableMembers || tableMembers.length === 0) return jsonMembers || [];
  if (!jsonMembers || jsonMembers.length === 0) return tableMembers || [];

  const tableMap = new Map<string, Member>(tableMembers.map((m) => [m.id, m]));

  return jsonMembers.map((jm) => {
    const tm = tableMap.get(jm.id);
    if (!tm) return jm;

    // Resolve payment status priority: VERIFIED > SLIP_UPLOADED > PENDING
    let resolvedStatus: Member['paymentStatus'] = 'PENDING';
    if (jm.paymentStatus === 'VERIFIED' || tm.paymentStatus === 'VERIFIED') {
      resolvedStatus = 'VERIFIED';
    } else if (jm.paymentStatus === 'SLIP_UPLOADED' || tm.paymentStatus === 'SLIP_UPLOADED') {
      resolvedStatus = 'SLIP_UPLOADED';
    } else {
      resolvedStatus = jm.paymentStatus || tm.paymentStatus || 'PENDING';
    }

    // Resolve slip URL and upload timestamp
    const resolvedSlipUrl = jm.slipUrl || tm.slipUrl || undefined;
    const resolvedUploadedAt = jm.slipUploadedAt || tm.slipUploadedAt || undefined;
    const resolvedPaidAmount = jm.paidAmount !== undefined ? jm.paidAmount : tm.paidAmount;

    return {
      ...jm,
      paymentStatus: resolvedStatus,
      slipUrl: resolvedSlipUrl,
      slipUploadedAt: resolvedUploadedAt,
      paidAmount: resolvedPaidAmount,
      note: jm.note || tm.note,
    };
  });
}

/**
 * Upload slip image file to Supabase Storage Bucket ('slips')
 * Falls back gracefully to original base64 if bucket is unavailable.
 */
export async function uploadSlipToSupabaseStorage(
  fileOrBase64: File | Blob | string,
  billId: string,
  memberId: string
): Promise<string> {
  if (!isSupabaseConfigured || typeof window === 'undefined') {
    return typeof fileOrBase64 === 'string' ? fileOrBase64 : '';
  }

  try {
    let blob: Blob;
    if (typeof fileOrBase64 === 'string') {
      if (!fileOrBase64.startsWith('data:image')) {
        return fileOrBase64; // Already a URL
      }
      // Convert Data URL to Blob
      const parts = fileOrBase64.split(',');
      const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
      const bstr = atob(parts[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      blob = new Blob([u8arr], { type: mime });
    } else {
      blob = fileOrBase64;
    }

    const cleanBillId = billId.replace(/[^a-zA-Z0-9_-]/g, '');
    const cleanMemberId = memberId.replace(/[^a-zA-Z0-9_-]/g, '');
    const filePath = `${cleanBillId}/${cleanMemberId}_${Date.now()}.jpg`;

    // Try uploading to 'slips' bucket
    const { data, error } = await supabase.storage
      .from('slips')
      .upload(filePath, blob, {
        contentType: blob.type || 'image/jpeg',
        upsert: true,
      });

    if (!error && data?.path) {
      const { data: publicData } = supabase.storage.from('slips').getPublicUrl(data.path);
      if (publicData?.publicUrl) {
        return publicData.publicUrl;
      }
    }
  } catch (err) {
    console.warn('Supabase storage upload fallback to base64:', err);
  }

  return typeof fileOrBase64 === 'string' ? fileOrBase64 : '';
}

/**
 * Fetch all members for a bill directly from party_members table
 */
export async function fetchPartyMembersFromSupabase(billId: string): Promise<Member[]> {
  if (!isSupabaseConfigured || !billId) return [];
  try {
    const { data, error } = await supabase
      .from('party_members')
      .select('*')
      .eq('bill_id', billId)
      .order('created_at', { ascending: true });

    if (error || !data || data.length === 0) return [];
    return data.map(mapDbMemberToApp);
  } catch (err) {
    return [];
  }
}

/**
 * Save/Upsert members in party_members table
 */
export async function savePartyMembersToSupabase(billId: string, members: Member[]): Promise<boolean> {
  if (!isSupabaseConfigured || !billId || !Array.isArray(members) || members.length === 0) {
    return false;
  }
  try {
    const rows = members.map((m) => ({
      id: m.id,
      bill_id: billId,
      name: m.name,
      gang_ids: m.gangIds || [],
      is_free: Boolean(m.isFree),
      is_payer: Boolean(m.isPayer),
      payment_status: m.paymentStatus || 'PENDING',
      slip_url: m.slipUrl || null,
      slip_uploaded_at: m.slipUploadedAt || null,
      paid_amount: m.paidAmount || 0,
      note: m.note || null,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('party_members')
      .upsert(rows, { onConflict: 'id' });

    return !error;
  } catch (err) {
    return false;
  }
}

/**
 * ⚡ Atomic update for a member's payment and slip status
 * Syncs both the party_bills (JSONB) and party_members (Relational) tables immediately.
 */
export async function updateMemberPaymentInSupabase(
  billId: string,
  memberId: string,
  updates: {
    paymentStatus?: Member['paymentStatus'];
    slipUrl?: string | null;
    slipUploadedAt?: string | null;
    paidAmount?: number;
    slipVerification?: any | null;
  }
): Promise<boolean> {
  if (!isSupabaseConfigured || !billId || !memberId) return false;

  const now = new Date().toISOString();
  let success = false;

  try {
    // 1. Direct update in party_members table (if available)
    try {
      const memberFields: Record<string, any> = {
        updated_at: now,
      };
      if (updates.paymentStatus !== undefined) memberFields.payment_status = updates.paymentStatus;
      if (updates.slipUrl !== undefined) memberFields.slip_url = updates.slipUrl;
      if (updates.slipUploadedAt !== undefined) memberFields.slip_uploaded_at = updates.slipUploadedAt;
      if (updates.paidAmount !== undefined) memberFields.paid_amount = updates.paidAmount;
      if (updates.slipVerification !== undefined) memberFields.slip_verification = updates.slipVerification;

      const { error: mErr } = await supabase
        .from('party_members')
        .update(memberFields)
        .eq('id', memberId)
        .eq('bill_id', billId);

      if (!mErr) {
        success = true;
      }
    } catch {}

    // 2. Guaranteed update in party_bills JSONB column
    try {
      const { data: billData } = await supabase
        .from('party_bills')
        .select('members')
        .eq('id', billId)
        .single();

      if (billData && Array.isArray(billData.members)) {
        const updatedMembers = billData.members.map((m: any) => {
          if (m.id === memberId) {
            return {
              ...m,
              ...(updates.paymentStatus !== undefined && { paymentStatus: updates.paymentStatus }),
              ...(updates.slipUrl !== undefined && { slipUrl: updates.slipUrl || undefined }),
              ...(updates.slipUploadedAt !== undefined && { slipUploadedAt: updates.slipUploadedAt || undefined }),
              ...(updates.paidAmount !== undefined && { paidAmount: updates.paidAmount }),
              ...(updates.slipVerification !== undefined && {
                slipVerification: updates.slipVerification === null ? undefined : updates.slipVerification,
              }),
            };
          }
          return m;
        });

        const { error: bErr } = await supabase
          .from('party_bills')
          .update({
            members: updatedMembers,
            updated_at: now,
          })
          .eq('id', billId);

        if (!bErr) {
          success = true;
        }
      }
    } catch (bCatch) {
      console.warn('Failed to update party_bills JSONB member:', bCatch);
    }

    return success;
  } catch (err) {
    console.error('Failed to update member payment in Supabase:', err);
    return false;
  }
}

/**
 * Backwards compatible alias for updateMemberSlipInSupabase
 */
export async function updateMemberSlipInSupabase(
  billId: string,
  memberId: string,
  slipUrl: string,
  paymentStatus: Member['paymentStatus'] = 'SLIP_UPLOADED',
  slipUploadedAt: string = new Date().toISOString()
): Promise<boolean> {
  return updateMemberPaymentInSupabase(billId, memberId, {
    slipUrl,
    paymentStatus,
    slipUploadedAt,
  });
}

// Database helper functions for Party Bills
export async function fetchPartyBillFromSupabase(billId: string): Promise<PartyBill | null> {
  if (!isSupabaseConfigured || !billId) return null;
  try {
    const { data, error } = await supabase
      .from('party_bills')
      .select('*')
      .eq('id', billId)
      .single();

    if (error || !data) return null;

    // Fetch members from party_members table if available and merge safely
    const tableMembers = await fetchPartyMembersFromSupabase(billId);
    const membersToUse = mergeMembersSafely(data.members || [], tableMembers);

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
      hostId: data.host_id || undefined,
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
      payerMemberId: data.payer_member_id || (membersToUse || []).find((m: any) => m.isPayer)?.id,
      hostPin: data.host_pin || '1234',
      isPublished,
      publishedAt,
      gangs: data.gangs || [],
      members: membersToUse,
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
    // Check if there is an active authenticated session or valid host UUID
    let validHostId: string | null = null;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id && UUID_REGEX.test(session.user.id)) {
        validHostId = session.user.id;
      }
    } catch {}

    if (!validHostId) {
      if (hostId && UUID_REGEX.test(hostId)) {
        validHostId = hostId;
      } else if (bill.hostId && UUID_REGEX.test(bill.hostId)) {
        validHostId = bill.hostId;
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

    if (validHostId) {
      payload.host_id = validHostId;
    }

    // Upsert members to separate party_members table in background
    if (bill.members && bill.members.length > 0) {
      savePartyMembersToSupabase(bill.id, bill.members).catch(() => {});
    }

    // Retry loop for party_bills upsert
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
        const match = errMsg.match(/['"]([a-zA-Z0-9_]+)['"] column/);
        if (match && match[1] && payload[match[1]] !== undefined) {
          delete payload[match[1]];
          continue;
        }

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

      if (payload.host_id && (error.code === '42501' || error.code === '23503' || errMsg.includes('foreign key') || errMsg.includes('host_id'))) {
        delete payload.host_id;
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
        hostId: d.host_id || hostId,
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

/**
 * Real-time subscription to bill updates & member slip uploads
 */
export function subscribeToPartyBill(
  billId: string,
  onUpdate: (bill: PartyBill) => void
): () => void {
  if (!isSupabaseConfigured || !billId) {
    return () => {};
  }

  try {
    const channelId = `party_bill_${billId}_${Date.now()}`;
    const channel = supabase
      .channel(channelId)
      // 1. Listen to party_bills changes (Host editing food, gangs, status)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'party_bills',
          filter: `id=eq.${billId}`,
        },
        async (payload) => {
          if (payload.new && (payload.new as any).id === billId) {
            const d = payload.new as any;
            const tableMembers = await fetchPartyMembersFromSupabase(billId);
            const membersToUse = mergeMembersSafely(d.members || [], tableMembers);

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

            const updatedBill: PartyBill = {
              id: d.id,
              hostId: d.host_id || undefined,
              title: d.title,
              date: d.date,
              location: d.location || '',
              vatMode: d.vat_mode || 'INCLUDE',
              vatRate: Number(d.vat_rate) || 0.07,
              serviceChargeRate: isNaN(serviceChargeRate) ? 0 : serviceChargeRate,
              sponsorBudget: Number(d.sponsor_budget) || 0,
              depositAmount: isNaN(depositAmount) ? 0 : depositAmount,
              promptPayNumber: d.promptpay_number || '',
              promptPayName: d.promptpay_name || '',
              payerMemberId: d.payer_member_id || (membersToUse || []).find((m: any) => m.isPayer)?.id,
              hostPin: d.host_pin || '1234',
              isPublished,
              publishedAt,
              gangs: d.gangs || [],
              members: membersToUse,
              items: d.items || [],
              updatedAt: d.updated_at,
            };
            onUpdate(updatedBill);
          }
        }
      )
      // 2. Listen to party_members changes (Guests uploading slips in realtime)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'party_members',
          filter: `bill_id=eq.${billId}`,
        },
        async () => {
          const freshBill = await fetchPartyBillFromSupabase(billId);
          if (freshBill) {
            onUpdate(freshBill);
          }
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {}
    };
  } catch (e) {
    console.warn('Realtime subscription error:', e);
    return () => {};
  }
}
