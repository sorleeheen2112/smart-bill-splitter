'use client';

import React from 'react';
import { Utensils, Users, Crown } from 'lucide-react';
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
  const breakdown = calculation.membersBreakdown[member.id];
  const commonItems = bill.items.filter((it) => !it.assignedTo || it.assignedTo === 'COMMON');

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
            <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
              {commonItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-slate-600">
                  <span className="truncate max-w-[200px] font-medium">{item.name} × {item.quantity || 1}</span>
                  <span className="font-mono text-slate-900 font-semibold">
                    {formatTHB(getItemEffectivePrice(item, bill.vatMode, bill.vatRate))}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 pt-2 text-[11px] text-slate-500 flex justify-between font-medium">
              <span>ยอดรวมกองกลาง:</span>
              <span className="font-mono font-bold text-slate-800">{formatTHB(calculation.effectiveCommonTotal)}</span>
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

                  <div className="space-y-1 text-slate-600 max-h-28 overflow-y-auto pr-1 font-medium">
                    {gBreakdown.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between">
                        <span className="truncate max-w-[200px]">{item.name} × {item.quantity || 1}</span>
                        <span className="font-mono text-slate-900 font-bold">
                          {formatTHB(getItemEffectivePrice(item, bill.vatMode, bill.vatRate))}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-2 border-t border-teal-200 pt-1.5 flex justify-between text-[11px] text-slate-500 font-medium">
                    <span>ยอดรวมก้อนนี้: {formatTHB(gBreakdown.effectiveTotal)}</span>
                    <span className="font-bold text-teal-900">หาร {gBreakdown.payingMembersCount} คน</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

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
      </div>
    </div>
  );
};
