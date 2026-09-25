import { PartyBill } from './types';
import { initialSamplePartyBill } from './sampleData';

const STORAGE_KEY = 'smart_party_bill_data_v1';

export function loadPartyBillFromStorage(billId?: string): PartyBill {
  if (typeof window === 'undefined') {
    return initialSamplePartyBill;
  }
  try {
    if (billId) {
      const specificRaw = localStorage.getItem(`smart_party_bill_${billId}`);
      if (specificRaw) {
        const parsed = JSON.parse(specificRaw);
        if (parsed && Array.isArray(parsed.members) && Array.isArray(parsed.items)) {
          return parsed;
        }
      }
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.members) && Array.isArray(parsed.items)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load bill from localStorage', e);
  }
  return initialSamplePartyBill;
}

export function savePartyBillToStorage(bill: PartyBill): void {
  if (typeof window === 'undefined' || !bill) return;
  try {
    const updated = {
      ...bill,
      updatedAt: new Date().toISOString(),
    };
    const serialized = JSON.stringify(updated);
    localStorage.setItem(STORAGE_KEY, serialized);
    if (bill.id) {
      localStorage.setItem(`smart_party_bill_${bill.id}`, serialized);
    }
  } catch (e) {
    console.warn('LocalStorage save error (likely quota exceeded):', e);
    // If quota exceeded, try saving without large slip previews in local cache as fallback
    try {
      const strippedMembers = bill.members.map((m) => {
        if (m.slipUrl && m.slipUrl.length > 5000) {
          return { ...m, slipUrl: undefined };
        }
        return m;
      });
      const compactBill = { ...bill, members: strippedMembers, updatedAt: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(compactBill));
    } catch {}
  }
}

export function resetToDefaultSample(): PartyBill {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
  return JSON.parse(JSON.stringify(initialSamplePartyBill));
}

export function removePartyBillFromStorage(billId?: string): void {
  if (typeof window === 'undefined') return;
  try {
    if (billId) {
      localStorage.removeItem(`smart_party_bill_${billId}`);
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!billId || parsed.id === billId) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  } catch (e) {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function exportBillToJson(bill: PartyBill): string {
  return JSON.stringify(bill, null, 2);
}

export function importBillFromJson(jsonString: string): PartyBill | null {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed && Array.isArray(parsed.members) && Array.isArray(parsed.items) && Array.isArray(parsed.gangs)) {
      return parsed;
    }
  } catch (e) {
    console.error('Invalid JSON structure', e);
  }
  return null;
}
