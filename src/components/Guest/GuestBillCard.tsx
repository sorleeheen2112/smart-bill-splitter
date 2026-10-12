'use client';

import React, { useState } from 'react';
import { Utensils, Users, Crown, Percent, Receipt, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { PartyBill, Member, CalculationResult } from '@/lib/types';
import { formatTHB, getItemEffectivePrice } from '@/lib/calculator';

interface GuestBillCardProps {
  bill: PartyBill;
  member: Member;
  calculation: CalculationResult;
}

export const GuestBillCard: React.FC<GuestBillCardProps> = ({
  bill,
  member,
  calculation,
}) => {
  const [showTableDetails, setShowTableDetails] = useState(false);
  const breakdown = calculation.membersBreakdown[member.id];
  const commonItems = bill.items.filter((it) => !it.assignedTo || it.assignedTo === 'COMMON');

  const payingCommonCount = calculation.payingCommonMembersCount || 1;
  const rawCommonShare = member.isFree ? 0 : (calculation.rawCommonTotal / payingCommonCount);

  let totalRawGangShare = 0;
  (member.gangIds || []).forEach((gangId) => {
    const gBreakdown = calculation.gangsBreakdown[gangId];
    if (gBreakdown && !member.isFree) {
      const gangPayingCount = gBreakdown.payingMembersCount || 1;
      totalRawGangShare += gBreakdown.rawTotal / gangPayingCount;
    }
  });

  const memberRawSubtotal = rawCommonShare + totalRawGangShare;
  const vatRate = bill.vatRate ?? 0.07;
  const scRate = bill.serviceChargeRate || 0;

  let memberServiceCharge = 0;
  let memberVat = 0;

  if (bill.vatMode === 'EXCLUDE') {
    memberServiceCharge = memberRawSubtotal * scRate;
    memberVat = (memberRawSubtotal + memberServiceCharge) * vatRate;
  } else {
    // Net Include mode: VAT is included
    memberServiceCharge = 0;
    memberVat = memberRawSubtotal - (memberRawSubtotal / (1 + vatRate));
  }

  const sponsorDeduction = member.isFree ? 0 : ((bill.sponsorBudget || 0) / payingCommonCount);
  const depositDeduction = member.isFree ? 0 : ((bill.depositAmount || 0) / payingCommonCount);

  if (member.isFree) {
    return (
      <div className="rounded-2xl border border-amber-300 bg-gradient-to-b from-amber-50 to-white p-6 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-100 text-amber-700 border border-amber-300 shadow-md mb-4 animate-bounce">
          <Crown className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-black text-amber-900">
          ยินดีด้วยคุณ {member.name}! 🎉
        </h3>
        <p className="mt-1 text-sm text-amber-800">
          คุณได้รับแท็ก <span className="font-bold text-amber-900">[F] VIP แขกพิเศษ</span> (มื้อนี้กินฟรี)
        </p>

        <div className="my-6 rounded-xl bg-white p-4 border border-amber-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">ยอดที่ต้องชำระ</span>
          <div className="text-3xl font-black text-amber-700 mt-1 font-mono">
            0.00 บาท
          </div>
          <span className="text-xs text-amber-700 font-medium">
            เพื่อนๆ ร่วมกันดูแลค่าใช้จ่ายมื้อนี้ให้คุณเรียบร้อยแล้ว ❤️
          </span>
        </div>

        {member.note && (
          <div className="text-xs text-slate-500 italic">
            หมายเหตุ: {member.note}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <span className="text-xs text-slate-500 font-medium">ใบเสร็จสรุปยอดของคุณ</span>
          <h3 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <span>{member.name}</span>
          </h3>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-500 font-medium">ยอดสุทธิที่ต้องจ่าย</span>
          <div className="text-2xl font-black text-teal-800 font-mono">
            {formatTHB(breakdown?.totalPayable || 0)}
          </div>
        </div>
      </div>

      {/* VAT & Service Charge Mode Banner */}
      {bill.vatMode === 'EXCLUDE' ? (
        <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-800 font-bold text-xs">
              %
            </span>
            <div>
              <span className="font-bold text-blue-950 block">
                บิลนี้คิดภาษีแยกนอก: VAT {(vatRate * 100).toFixed(0)}%
                {scRate > 0 && ` + Service Charge ${(scRate * 100).toFixed(0)}%`}
              </span>
              <p className="text-[11px] text-blue-800 mt-0.5">
                ราคาอาหารแต่ละรายการถูกบวกภาษีและค่าบริการตามสัดส่วนที่สั่งแล้ว
              </p>
            </div>
          </div>
          <span className="shrink-0 rounded-md bg-blue-200/80 px-2 py-0.5 text-[10px] font-extrabold text-blue-900 border border-blue-300">
            +VAT {(vatRate * 100).toFixed(0)}%
          </span>
        </div>
      ) : (
        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-2.5 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 font-bold text-[10px]">
              ✓
            </span>
            <span className="font-semibold text-emerald-950 text-[11px]">
              ราคาสุทธิ รวมภาษีมูลค่าเพิ่ม VAT {(vatRate * 100).toFixed(0)}% แล้ว (Net Include)
            </span>
          </div>
          <span className="shrink-0 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
            รวม VAT แล้ว
          </span>
        </div>
      )}

      <div className="divide-y divide-slate-100 mt-4 space-y-4">
        {/* Section 1: Common Items */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
              <Utensils className="h-3.5 w-3.5 text-teal-700" />
              <span>[1] กองกลาง / ส่วนรวม (หาร {calculation.payingCommonMembersCount} คน)</span>
            </span>
            <span className="text-xs font-bold text-teal-900 font-mono">
              {formatTHB(breakdown?.commonShare || 0)}
            </span>
          </div>

          <div className="rounded-xl bg-slate-50 p-3 text-xs space-y-1.5 border border-slate-200">
            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
              {commonItems.map((item) => {
                const rawPrice = (item.price || 0) * (item.quantity || 1);
                const effPrice = getItemEffectivePrice(item, bill.vatMode, vatRate, scRate);

                return (
                  <div key={item.id} className="flex items-center justify-between text-slate-600">
                    <span className="truncate max-w-[200px] font-medium">
                      {item.name} × {item.quantity || 1}
                    </span>
                    <div className="text-right">
                      <span className="font-mono text-slate-900 font-semibold">
                        {formatTHB(effPrice)}
                      </span>
                      {bill.vatMode === 'EXCLUDE' && (
                        <div className="text-[10px] text-slate-400 font-normal">
                          (เมนู {formatTHB(rawPrice)} + VAT{scRate > 0 ? '/SC' : ''})
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-slate-200 pt-2 text-[11px] text-slate-600 space-y-1 font-medium">
              {bill.vatMode === 'EXCLUDE' && (
                <div className="flex justify-between text-slate-500">
                  <span>ค่าอาหารกองกลางตามเมนู (ก่อน VAT):</span>
                  <span className="font-mono font-semibold">{formatTHB(calculation.rawCommonTotal)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>ยอดรวมกองกลาง{bill.vatMode === 'EXCLUDE' ? ' (รวม VAT/SC)' : ''}:</span>
                <span className="font-mono font-bold text-slate-900">{formatTHB(calculation.effectiveCommonTotal)}</span>
              </div>
            </div>

            {(bill.sponsorBudget || 0) > 0 && (
              <div className="text-[11px] text-amber-700 flex justify-between font-semibold">
                <span>หักงบสนับสนุน Sponsor:</span>
                <span className="font-mono">-{formatTHB(bill.sponsorBudget || 0)}</span>
              </div>
            )}

            {(bill.depositAmount || 0) > 0 && (
              <div className="text-[11px] text-blue-700 flex justify-between font-semibold">
                <span>หักเงินมัดจำล่วงหน้า:</span>
                <span className="font-mono">-{formatTHB(bill.depositAmount || 0)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Gangs Specific Items */}
        {(member.gangIds || []).length > 0 && (
          <div className="pt-4 space-y-3">
            <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
              <Users className="h-3.5 w-3.5 text-teal-700" />
              <span>[2..N] ก้อนอาหารประจำแก๊งที่คุณสังกัด</span>
            </span>

            {member.gangIds.map((gangId) => {
              const gang = bill.gangs.find((g) => g.id === gangId);
              const gBreakdown = calculation.gangsBreakdown[gangId];
              if (!gang || !gBreakdown) return null;

              return (
                <div key={gangId} className="rounded-xl border border-teal-200 bg-teal-50/40 p-3 text-xs">
                  <div className="flex items-center justify-between font-bold text-teal-950 mb-1.5">
                    <span>👥 {gang.name}</span>
                    <span className="font-mono text-teal-900 font-bold">
                      +{formatTHB(gBreakdown.sharePerPerson)}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-slate-600 max-h-32 overflow-y-auto pr-1 font-medium">
                    {gBreakdown.items.map((item) => {
                      const rawPrice = (item.price || 0) * (item.quantity || 1);
                      const effPrice = getItemEffectivePrice(item, bill.vatMode, vatRate, scRate);

                      return (
                        <div key={item.id} className="flex items-center justify-between">
                          <span className="truncate max-w-[200px]">
                            {item.name} × {item.quantity || 1}
                          </span>
                          <div className="text-right">
                            <span className="font-mono text-slate-900 font-bold">
                              {formatTHB(effPrice)}
                            </span>
                            {bill.vatMode === 'EXCLUDE' && (
                              <div className="text-[10px] text-slate-400 font-normal">
                                (เมนู {formatTHB(rawPrice)} + VAT{scRate > 0 ? '/SC' : ''})
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-2 border-t border-teal-200 pt-1.5 flex justify-between text-[11px] text-slate-600 font-medium">
                    <span>ยอดรวมก้อนนี้: {formatTHB(gBreakdown.effectiveTotal)}</span>
                    <span className="font-bold text-teal-900">หาร {gBreakdown.payingMembersCount} คน</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Section 2.5: Personal VAT & Service Charge Detailed Breakdown */}
        <div className="pt-4">
          {bill.vatMode === 'EXCLUDE' ? (
            <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3.5 text-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-blue-950 flex items-center space-x-1.5">
                  <Percent className="h-4 w-4 text-blue-700" />
                  <span>แจกแจงค่าอาหารและภาษี (ส่วนของคุณ)</span>
                </span>
                <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-900 border border-blue-300">
                  VAT {(vatRate * 100).toFixed(0)}% แยกนอก
                </span>
              </div>
              <div className="space-y-1.5 text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-600">ค่าอาหารตามเมนูของคุณ (ก่อนภาษี):</span>
                  <span className="font-mono font-semibold text-slate-900">{formatTHB(memberRawSubtotal)}</span>
                </div>
                {scRate > 0 && (
                  <div className="flex justify-between text-blue-900 font-medium">
                    <span>+ ค่าบริการ Service Charge ({(scRate * 100).toFixed(0)}%):</span>
                    <span className="font-mono font-semibold">+{formatTHB(memberServiceCharge)}</span>
                  </div>
                )}
                <div className="flex justify-between text-blue-900 font-medium">
                  <span>+ ภาษีมูลค่าเพิ่ม VAT ({(vatRate * 100).toFixed(0)}%):</span>
                  <span className="font-mono font-semibold">+{formatTHB(memberVat)}</span>
                </div>
                {(sponsorDeduction > 0 || depositDeduction > 0) && (
                  <div className="border-t border-blue-200/60 pt-1.5 space-y-1 text-[11px]">
                    {sponsorDeduction > 0 && (
                      <div className="flex justify-between text-amber-700 font-medium">
                        <span>- หักส่วนแบ่งงบ Sponsor:</span>
                        <span className="font-mono">-{formatTHB(sponsorDeduction)}</span>
                      </div>
                    )}
                    {depositDeduction > 0 && (
                      <div className="flex justify-between text-indigo-700 font-medium">
                        <span>- หักส่วนแบ่งเงินมัดจำ:</span>
                        <span className="font-mono">-{formatTHB(depositDeduction)}</span>
                      </div>
                    )}
                  </div>
                )}
                <div className="border-t border-blue-200 pt-1.5 flex justify-between font-bold text-blue-950">
                  <span>ยอดสุทธิที่คุณต้องชำระ:</span>
                  <span className="font-mono text-sm text-teal-800">{formatTHB(breakdown?.totalPayable || 0)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-800 flex items-center space-x-1.5">
                  <Percent className="h-3.5 w-3.5 text-teal-700" />
                  <span>ภาษีมูลค่าเพิ่ม (VAT {(vatRate * 100).toFixed(0)}%)</span>
                </span>
                <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                  ราคารวม VAT แล้ว
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-600">
                <span>ยอดชำระของคุณมีภาษีมูลค่าเพิ่มรวมอยู่:</span>
                <span className="font-mono font-semibold text-slate-800">{formatTHB(memberVat)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Summary Total Bar */}
        <div className="pt-4">
          <div className="flex items-center justify-between rounded-xl bg-teal-50 p-4 border border-teal-200">
            <div>
              <span className="text-xs font-bold text-teal-950 block">
                ยอดรวมสุทธิที่คุณต้องโอน
              </span>
              <span className="text-[11px] text-slate-600 font-medium">
                (กองกลาง {formatTHB(breakdown?.commonShare || 0)} + แก๊ง {formatTHB(breakdown?.totalGangShare || 0)})
              </span>
            </div>
            <div className="text-2xl font-black text-teal-900 font-mono">
              {formatTHB(breakdown?.totalPayable || 0)}
            </div>
          </div>
        </div>

        {/* Section 4: Table-wide Bill Overview Collapsible */}
        <div className="pt-3">
          <button
            type="button"
            onClick={() => setShowTableDetails(!showTableDetails)}
            className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-2.5 text-xs text-slate-600 hover:bg-slate-100 transition"
          >
            <div className="flex items-center space-x-1.5">
              <Receipt className="h-3.5 w-3.5 text-slate-500" />
              <span className="font-semibold text-slate-700">
                ดูยอดรวมบิลทั้งโต๊ะ (ตรวจสอบกับใบเสร็จร้าน)
              </span>
            </div>
            {showTableDetails ? (
              <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            )}
          </button>

          {showTableDetails && (
            <div className="mt-2 rounded-xl border border-slate-200 bg-white p-3 text-xs space-y-1.5 shadow-2xs animate-in fade-in">
              <div className="flex justify-between text-slate-600">
                <span>ค่าอาหารรวมทั้งโต๊ะ (Subtotal):</span>
                <span className="font-mono font-semibold text-slate-900">
                  {formatTHB(calculation.rawGrandTotal)}
                </span>
              </div>
              {calculation.serviceChargeTotal > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Service Charge ทั้งโต๊ะ ({((bill.serviceChargeRate || 0) * 100).toFixed(0)}%):</span>
                  <span className="font-mono font-semibold text-slate-900">
                    +{formatTHB(calculation.serviceChargeTotal)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>ภาษี VAT ทั้งโต๊ะ ({(vatRate * 100).toFixed(0)}%):</span>
                <span className="font-mono font-semibold text-slate-900">
                  {bill.vatMode === 'EXCLUDE' ? `+${formatTHB(calculation.vatTotal)}` : `(รวมในราคา ${formatTHB(calculation.vatTotal)})`}
                </span>
              </div>
              <div className="border-t border-slate-200 pt-1.5 flex justify-between font-bold text-slate-900">
                <span>ยอดรวมใบเสร็จร้านทั้งโต๊ะ (Grand Total):</span>
                <span className="font-mono text-teal-800 font-extrabold">
                  {formatTHB(calculation.effectiveGrandTotal)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

