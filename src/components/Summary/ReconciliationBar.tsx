'use client';

import React from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { CalculationResult, PartyBill } from '@/lib/types';
import { formatTHB } from '@/lib/calculator';

interface ReconciliationBarProps {
  bill: PartyBill;
  calculation: CalculationResult;
}

export const ReconciliationBar: React.FC<ReconciliationBarProps> = ({
  bill,
  calculation,
}) => {
  const isMatch = calculation.isReconciled;
  const vipCount = bill.members.filter((m) => m.isFree).length;
  const payingCount = calculation.payingCommonMembersCount;

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 shadow-xs transition-all ${
        isMatch
          ? 'border-emerald-200 bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white'
          : 'border-amber-200 bg-gradient-to-r from-amber-50 via-yellow-50/50 to-white'
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left: Status Badge & Formula Explanation */}
        <div className="flex items-start space-x-3.5">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-xs ${
              isMatch
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                : 'bg-amber-100 text-amber-700 border border-amber-300'
            }`}
          >
            {isMatch ? (
              <ShieldCheck className="h-6 w-6" />
            ) : (
              <AlertTriangle className="h-6 w-6" />
            )}
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h4 className="text-sm font-bold text-slate-900 sm:text-base">
                {isMatch
                  ? '🛡️ ยอดเงินตรวจสอบถูกต้อง 100% (Reconciliation Match)'
                  : '⚠️ มียอดส่วนต่างเล็กน้อย (เศษสตางค์หรือตัวหาร)'}
              </h4>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                  isMatch
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                Diff: {calculation.reconciliationDiff.toFixed(2)} บาท
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-600">
              ผลรวมยอดเพื่อนทุกคน ({formatTHB(calculation.sumTotalPayable)})
              {(bill.sponsorBudget || 0) > 0 && ` + งบ Sponsor (${formatTHB(Math.min(bill.sponsorBudget || 0, calculation.effectiveCommonTotal))})`}
              {(bill.depositAmount || 0) > 0 && ` + มัดจำ (${formatTHB(Math.min(bill.depositAmount || 0, calculation.effectiveCommonTotal))})`}
              {' '}= ยอดบิลสุทธิ ({formatTHB(calculation.effectiveGrandTotal)})
            </p>
          </div>
        </div>

        {/* Right: Quick Stats Breakdown */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-2xs">
            <span className="text-[10px] text-slate-500 block font-medium">กองกลางสุทธิ (หลังหักงบ)</span>
            <span className="font-bold text-slate-900 font-mono">
              {formatTHB(calculation.netCommonTotal)}
            </span>
            <span className="text-[10px] text-slate-500 ml-1">
              (คนละ {formatTHB(calculation.commonSharePerPerson)})
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-2xs">
            <span className="text-[10px] text-slate-500 block font-medium">สัดส่วนผู้ร่วมงาน</span>
            <span className="font-bold text-teal-800">
              หารจริง {payingCount} คน
            </span>
            <span className="text-[10px] text-amber-700 ml-1.5 font-bold">
              • VIP ฟรี {vipCount} คน
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
