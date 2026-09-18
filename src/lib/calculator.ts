import { PartyBill, CalculationResult, GangCalculationBreakdown, MemberCalculationBreakdown, BillItem } from './types';

export function roundTo2Decimals(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

export function formatTHB(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getItemEffectivePrice(
  item: BillItem,
  vatMode: 'INCLUDE' | 'EXCLUDE',
  vatRate: number,
  serviceChargeRate: number = 0
): number {
  const rawPrice = (item.price || 0) * (item.quantity || 1);
  if (vatMode === 'EXCLUDE') {
    // Restaurant '++' standard: Subtotal * (1 + SC) * (1 + VAT)
    const priceWithSC = rawPrice * (1 + (serviceChargeRate || 0));
    return priceWithSC * (1 + (vatRate || 0.07));
  }
  return rawPrice;
}

export function calculatePartyBill(bill: PartyBill): CalculationResult {
  const vatMode = bill.vatMode || 'INCLUDE';
  const vatRate = bill.vatRate ?? 0.07;
  const serviceChargeRate = bill.serviceChargeRate || 0;
  const sponsorBudget = bill.sponsorBudget || 0;
  const depositAmount = bill.depositAmount || 0;
  const totalCommonDeductions = sponsorBudget + depositAmount;

  // 1. Calculate raw and effective totals
  let rawGrandTotal = 0;
  let effectiveGrandTotal = 0;
  let rawCommonTotal = 0;
  let effectiveCommonTotal = 0;

  const gangItemsMap: Record<string, BillItem[]> = {};
  bill.gangs.forEach((gang) => {
    gangItemsMap[gang.id] = [];
  });

  const commonItems: BillItem[] = [];

  (bill.items || []).forEach((item) => {
    const rawItemTotal = (item.price || 0) * (item.quantity || 1);
    const effItemTotal = getItemEffectivePrice(item, vatMode, vatRate, serviceChargeRate);

    rawGrandTotal += rawItemTotal;
    effectiveGrandTotal += effItemTotal;

    if (!item.assignedTo || item.assignedTo === 'COMMON') {
      rawCommonTotal += rawItemTotal;
      effectiveCommonTotal += effItemTotal;
      commonItems.push(item);
    } else {
      if (!gangItemsMap[item.assignedTo]) {
        gangItemsMap[item.assignedTo] = [];
      }
      gangItemsMap[item.assignedTo].push(item);
    }
  });

  // Calculate Service Charge & VAT breakdowns
  let serviceChargeTotal = 0;
  let vatTotal = 0;

  if (vatMode === 'EXCLUDE') {
    serviceChargeTotal = rawGrandTotal * serviceChargeRate;
    vatTotal = (rawGrandTotal + serviceChargeTotal) * vatRate;
  } else {
    // In Net Include mode, VAT is extracted from the gross total
    vatTotal = rawGrandTotal - rawGrandTotal / (1 + vatRate);
    serviceChargeTotal = 0;
  }

  // 2. Common calculation
  const payingCommonMembers = (bill.members || []).filter((m) => !m.isFree);
  const payingCommonMembersCount = payingCommonMembers.length;
  const netCommonTotal = Math.max(0, effectiveCommonTotal - totalCommonDeductions);
  const commonSharePerPerson = payingCommonMembersCount > 0 ? netCommonTotal / payingCommonMembersCount : 0;

  // 3. Gang calculations
  const gangsBreakdown: Record<string, GangCalculationBreakdown> = {};

  bill.gangs.forEach((gang) => {
    const items = gangItemsMap[gang.id] || [];
    let rawTotal = 0;
    let effectiveTotal = 0;

    items.forEach((it) => {
      rawTotal += (it.price || 0) * (it.quantity || 1);
      effectiveTotal += getItemEffectivePrice(it, vatMode, vatRate, serviceChargeRate);
    });

    const membersInGang = (bill.members || []).filter((m) => (m.gangIds || []).includes(gang.id));
    const payingMembersInGang = membersInGang.filter((m) => !m.isFree);
    const payingMembersCount = payingMembersInGang.length;
    const sharePerPerson = payingMembersCount > 0 ? effectiveTotal / payingMembersCount : 0;

    gangsBreakdown[gang.id] = {
      gangId: gang.id,
      gangName: gang.name,
      colorTag: gang.colorTag,
      rawTotal,
      effectiveTotal,
      totalMembersCount: membersInGang.length,
      payingMembersCount,
      sharePerPerson,
      items,
    };
  });

  // 4. Member breakdowns
  const membersBreakdown: Record<string, MemberCalculationBreakdown> = {};
  let sumTotalPayable = 0;

  (bill.members || []).forEach((member) => {
    if (member.isFree) {
      // Tag F: Free VIP guest
      const gangShares = (member.gangIds || []).map((gId) => {
        const gang = bill.gangs.find((g) => g.id === gId);
        return {
          gangId: gId,
          gangName: gang?.name || gId,
          colorTag: gang?.colorTag,
          share: 0,
        };
      });

      membersBreakdown[member.id] = {
        member,
        commonShare: 0,
        gangShares,
        totalGangShare: 0,
        totalPayable: 0,
      };
    } else {
      // Paying member
      const memberCommonShare = commonSharePerPerson;
      let totalGangShare = 0;
      const gangShares: { gangId: string; gangName: string; share: number; colorTag?: string }[] = [];

      (member.gangIds || []).forEach((gId) => {
        const gBreakdown = gangsBreakdown[gId];
        if (gBreakdown) {
          const share = gBreakdown.sharePerPerson;
          totalGangShare += share;
          gangShares.push({
            gangId: gId,
            gangName: gBreakdown.gangName,
            colorTag: gBreakdown.colorTag,
            share,
          });
        }
      });

      const totalPayable = memberCommonShare + totalGangShare;
      sumTotalPayable += totalPayable;

      membersBreakdown[member.id] = {
        member,
        commonShare: memberCommonShare,
        gangShares,
        totalGangShare,
        totalPayable,
      };
    }
  });

  // 5. Reconciliation calculation
  // Total bill = sum(paying member amounts) + actual sponsor/deposit used (up to common total)
  const actualDeductionsUsed = Math.min(totalCommonDeductions, effectiveCommonTotal);
  const totalAccounted = sumTotalPayable + actualDeductionsUsed;
  const reconciliationDiff = totalAccounted - effectiveGrandTotal;
  const isReconciled = Math.abs(reconciliationDiff) < 0.05 || payingCommonMembersCount === 0;

  return {
    rawGrandTotal: roundTo2Decimals(rawGrandTotal),
    serviceChargeTotal: roundTo2Decimals(serviceChargeTotal),
    vatTotal: roundTo2Decimals(vatTotal),
    effectiveGrandTotal: roundTo2Decimals(effectiveGrandTotal),
    rawCommonTotal: roundTo2Decimals(rawCommonTotal),
    effectiveCommonTotal: roundTo2Decimals(effectiveCommonTotal),
    sponsorBudget: roundTo2Decimals(sponsorBudget),
    depositAmount: roundTo2Decimals(depositAmount),
    netCommonTotal: roundTo2Decimals(netCommonTotal),
    payingCommonMembersCount,
    commonSharePerPerson: roundTo2Decimals(commonSharePerPerson),
    gangsBreakdown,
    membersBreakdown,
    sumTotalPayable: roundTo2Decimals(sumTotalPayable),
    reconciliationDiff: roundTo2Decimals(reconciliationDiff),
    isReconciled,
  };
}
