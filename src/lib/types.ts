export interface Gang {
  id: string;
  name: string;
  colorTag?: string; // Hex or tailwind badge style key
  description?: string;
}

export interface Member {
  id: string;
  name: string;
  gangIds: string[]; // IDs of Gangs the member belongs to
  isFree: boolean; // Tag 'F': VIP / Free (Payable = 0, excluded from group divisors)
  isPayer?: boolean; // The person who paid the upfront bill at the restaurant (auto-verified)
  paymentStatus: 'PENDING' | 'SLIP_UPLOADED' | 'VERIFIED';
  slipUrl?: string;
  slipUploadedAt?: string;
  paidAmount?: number;
  note?: string;
}

export interface BillItem {
  id: string;
  name: string;
  price: number; // Unit price
  quantity: number; // Default 1
  assignedTo: 'COMMON' | string; // 'COMMON' or gang.id
  category?: string;
}

export interface PartyBill {
  id: string;
  hostId?: string; // Host UUID who created/owns this party bill
  title: string;
  date: string;
  location?: string;
  serviceChargeRate?: number; // e.g. 0.10 for 10%, 0 for 0%
  vatMode: 'INCLUDE' | 'EXCLUDE';
  vatRate: number; // e.g. 0.07 for 7%
  sponsorBudget: number; // e.g. 5000
  depositAmount?: number; // e.g. 1000 (pre-paid deposit to be deducted from common)
  promptPayNumber: string; // e.g. "0812345678"
  promptPayName?: string;
  payerMemberId?: string; // ID of the member who paid upfront (auto-verified)
  hostPin: string;
  isPublished?: boolean; // false = Host is still organizing, true = Ready for guests to pay
  publishedAt?: string;
  gangs: Gang[];
  members: Member[];
  items: BillItem[];
  updatedAt?: string;
}

export interface GangCalculationBreakdown {
  gangId: string;
  gangName: string;
  colorTag?: string;
  rawTotal: number;
  effectiveTotal: number;
  totalMembersCount: number;
  payingMembersCount: number;
  sharePerPerson: number;
  items: BillItem[];
}

export interface MemberCalculationBreakdown {
  member: Member;
  commonShare: number;
  gangShares: {
    gangId: string;
    gangName: string;
    share: number;
    colorTag?: string;
  }[];
  totalGangShare: number;
  totalPayable: number; // 0 if isFree is true
}

export interface CalculationResult {
  rawGrandTotal: number;
  serviceChargeTotal: number;
  vatTotal: number;
  effectiveGrandTotal: number; // After SC & VAT applied
  rawCommonTotal: number;
  effectiveCommonTotal: number;
  sponsorBudget: number;
  depositAmount: number;
  netCommonTotal: number; // Math.max(0, effectiveCommonTotal - sponsorBudget - depositAmount)
  payingCommonMembersCount: number;
  commonSharePerPerson: number;
  gangsBreakdown: Record<string, GangCalculationBreakdown>;
  membersBreakdown: Record<string, MemberCalculationBreakdown>;
  sumTotalPayable: number;
  reconciliationDiff: number; // (sumTotalPayable + sponsorBudget + depositAmount) - effectiveGrandTotal
  isReconciled: boolean;
}
