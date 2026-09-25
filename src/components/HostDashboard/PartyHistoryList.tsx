'use client';

import React, { useState } from 'react';
import {
  Calendar,
  MapPin,
  Plus,
  Share2,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Clock,
  Check,
  FileEdit,
} from 'lucide-react';
import { PartyBill } from '@/lib/types';
import { calculatePartyBill, formatTHB } from '@/lib/calculator';
import { getQuickShareText } from '@/lib/shareUtils';
import { useAuth } from '@/context/AuthContext';

interface PartyHistoryListProps {
  bills: PartyBill[];
  activeBillId: string;
  onSelectBill: (billId: string) => void;
  onCreateNewBill: () => void;
  onDeleteBill: (billId: string) => void;
}

export const PartyHistoryList: React.FC<PartyHistoryListProps> = ({
  bills,
  activeBillId,
  onSelectBill,
  onCreateNewBill,
  onDeleteBill,
}) => {
  const { hostUser } = useAuth();
  const [copiedBillId, setCopiedBillId] = useState<string | null>(null);

  const handleCopyLink = (e: React.MouseEvent, bill: PartyBill) => {
    e.stopPropagation();
    if (typeof window !== 'undefined') {
      const shareText = getQuickShareText({ title: bill.title, billId: bill.id });
      navigator.clipboard.writeText(shareText);
      setCopiedBillId(bill.id);
      setTimeout(() => setCopiedBillId(null), 2000);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <span>ประวัติบิลปาร์ตี้ทั้งหมด (Party History)</span>
            <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-bold text-teal-800 border border-teal-200">
              {bills.length} งาน
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            {hostUser
              ? `บัญชีของ: ${hostUser.firstName} ${hostUser.lastName || ''} (${hostUser.email})`
              : 'บิลทั้งหมดที่คุณสร้างไว้ในระบบ'}
          </p>
        </div>

        <button
          onClick={onCreateNewBill}
          className="flex items-center space-x-1.5 rounded-xl bg-teal-700 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-teal-800 transition"
        >
          <Plus className="h-4 w-4" />
          <span>สร้างบิลงานใหม่</span>
        </button>
      </div>

      {/* Grid of Party Bills */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {bills.map((bill) => {
          const calc = calculatePartyBill(bill);
          const isActive = bill.id === activeBillId;
          const payingMembers = bill.members.filter((m) => !m.isFree);
          const payingCount = payingMembers.length;
          const freeCount = bill.members.filter((m) => m.isFree).length;
          const verifiedCount = payingMembers.filter((m) => m.paymentStatus === 'VERIFIED').length;
          const pendingSlipCount = payingMembers.filter((m) => m.paymentStatus === 'SLIP_UPLOADED').length;
          const isComplete = verifiedCount === payingCount && payingCount > 0;
          const progressPercent = payingCount > 0 ? Math.round((verifiedCount / payingCount) * 100) : 100;

          return (
            <div
              key={bill.id}
              onClick={() => onSelectBill(bill.id)}
              className={`group flex flex-col justify-between rounded-2xl border p-5 transition-all cursor-pointer ${
                isActive
                  ? 'border-teal-600 bg-white shadow-md ring-2 ring-teal-600/30'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              <div>
                {/* Title & Status Badge */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-teal-800 transition">
                    {bill.title || 'ปาร์ตี้ไม่มีชื่อ'}
                  </h3>
                  <div className="flex items-center space-x-1.5 shrink-0">
                    {pendingSlipCount > 0 && (
                      <span className="inline-flex items-center space-x-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-300 animate-pulse">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                        <span>รอตรวจ {pendingSlipCount}</span>
                      </span>
                    )}
                    {!bill.isPublished ? (
                      <span className="shrink-0 inline-flex items-center space-x-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-300">
                        <FileEdit className="h-3 w-3 text-amber-600" />
                        <span>กำลังจัดบิล</span>
                      </span>
                    ) : isComplete ? (
                      <span className="shrink-0 inline-flex items-center space-x-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        <span>ครบแล้ว</span>
                      </span>
                    ) : (
                      <span className="shrink-0 inline-flex items-center space-x-1 rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-800 border border-teal-300">
                        <Clock className="h-3 w-3 text-teal-600" />
                        <span>กำลังเก็บเงิน</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Date & Location */}
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                  <span className="flex items-center space-x-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>{bill.date}</span>
                  </span>
                  {bill.location && (
                    <span className="flex items-center space-x-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <span className="truncate max-w-[120px]">{bill.location}</span>
                    </span>
                  )}
                </div>

                {/* Bill Amount & Gang Count */}
                <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-2.5 text-xs border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-500 font-medium">ยอดบิลทั้งหมด</span>
                    <p className="font-bold text-slate-900 font-mono">
                      {formatTHB(calc.effectiveGrandTotal)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-medium">จำนวนแก๊ง/คน</span>
                    <p className="font-bold text-teal-800">
                      {bill.gangs.length} แก๊ง / {bill.members.length} คน
                    </p>
                  </div>
                </div>

                {/* Payment Progress Bar */}
                <div className="mt-3.5 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                    <span>ความคืบหน้าการโอนเงิน:</span>
                    {!bill.isPublished ? (
                      <span className="font-bold text-amber-800">
                        ยังไม่เปิดรับชำระ (ร่าง)
                      </span>
                    ) : (
                      <span className="font-bold text-emerald-700">
                        {verifiedCount}/{payingCount} คน ({progressPercent}%)
                        {freeCount > 0 && (
                          <span className="ml-1 text-[10px] text-amber-700 font-normal">
                            (ฟรี {freeCount})
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        !bill.isPublished ? 'bg-amber-400' : 'bg-emerald-600'
                      }`}
                      style={{ width: `${!bill.isPublished ? 15 : progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={(e) => handleCopyLink(e, bill)}
                  className="flex items-center space-x-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition border border-slate-200"
                  title="คัดลอกลิงก์ส่งให้เพื่อนใน LINE"
                >
                  {copiedBillId === bill.id ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-600" />
                      <span className="text-emerald-700">คัดลอกแล้ว</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="h-3 w-3" />
                      <span>แชร์ลิงก์เพื่อน</span>
                    </>
                  )}
                </button>

                <div className="flex items-center space-x-1">
                  {bills.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteBill(bill.id);
                      }}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                      title="ลบบิลนี้"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}

                  <span className="flex items-center space-x-1 text-xs font-bold text-teal-700 group-hover:text-teal-900">
                    <span>เปิดบิล</span>
                    <ExternalLink className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
