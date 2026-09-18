'use client';

import React, { useState } from 'react';
import { Copy, Check, X, MessageSquare } from 'lucide-react';
import { PartyBill, CalculationResult } from '@/lib/types';
import { formatTHB } from '@/lib/calculator';

interface LineShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: PartyBill;
  calculation: CalculationResult;
}

export const LineShareModal: React.FC<LineShareModalProps> = ({
  isOpen,
  onClose,
  bill,
  calculation,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  if (!isOpen) return null;

  const billUrl = typeof window !== 'undefined' && bill.id
    ? `${window.location.origin}/bill/${bill.id}`
    : '';

  const lines: string[] = [];
  lines.push(`🎉 สรุปยอดบิลปาร์ตี้: ${bill.title}`);
  if (bill.date) lines.push(`📅 วันที่: ${bill.date}`);
  if (bill.location) lines.push(`📍 สถานที่: ${bill.location}`);
  lines.push(`─────────────────`);
  let breakdownNote = '';
  if (bill.vatMode === 'EXCLUDE') {
    const scText = (bill.serviceChargeRate || 0) > 0 ? ` + SC ${((bill.serviceChargeRate || 0) * 100).toFixed(0)}%` : '';
    breakdownNote = ` (อาหาร ${formatTHB(calculation.rawGrandTotal)}${scText} + VAT 7%)`;
  }
  lines.push(`💵 ยอดบิลรวมสุทธิ: ${formatTHB(calculation.effectiveGrandTotal)}${breakdownNote}`);
  if ((bill.sponsorBudget || 0) > 0) {
    lines.push(`🎁 งบสนับสนุนกองกลาง: -${formatTHB(bill.sponsorBudget || 0)}`);
  }
  if ((bill.depositAmount || 0) > 0) {
    lines.push(`💳 หักเงินมัดจำล่วงหน้า: -${formatTHB(bill.depositAmount || 0)}`);
  }
  lines.push(`🍽️ ค่าอาหารกองกลางสุทธิ: ${formatTHB(calculation.netCommonTotal)} (คนละ ${formatTHB(calculation.commonSharePerPerson)})`);
  lines.push(`─────────────────`);
  lines.push(`👥 ยอดชำระรายบุคคล:`);

  bill.members.forEach((m, idx) => {
    const breakdown = calculation.membersBreakdown[m.id];
    if (m.isFree) {
      lines.push(`${idx + 1}. ${m.name}: 👑 ฟรี (0 บาท) [F]`);
    } else {
      const gangsList = breakdown?.gangShares.map((g) => g.gangName.split(' ')[0]).join(', ');
      const gangInfo = gangsList ? ` (แก๊ง: ${gangsList})` : '';
      lines.push(`${idx + 1}. ${m.name}: ${formatTHB(breakdown?.totalPayable || 0)}${gangInfo}`);
    }
  });

  lines.push(`─────────────────`);
  lines.push(`📲 โอนเงินผ่าน PromptPay:`);
  lines.push(`• เลขพร้อมเพย์: ${bill.promptPayNumber || '-'}`);
  if (bill.promptPayName) lines.push(`• ชื่อบัญชี: ${bill.promptPayName}`);
  lines.push(`• โอนแล้วแนบสลิปส่งในกลุ่มได้เลยครับ/ค่ะ 🙏`);
  if (billUrl) {
    lines.push(`─────────────────`);
    lines.push(`🔗 ลิงก์ดูยอด & สแกน QR รายบุคคล:`);
    lines.push(billUrl);
  }

  const shareText = lines.join('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyUrlOnly = () => {
    if (!billUrl) return;
    navigator.clipboard.writeText(billUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center space-x-2 text-[#05963f]">
            <MessageSquare className="h-5 w-5" />
            <h3 className="text-base font-bold text-slate-900">
              คัดลอกข้อความ & ลิงก์ส่งเข้ากลุ่ม LINE
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <textarea
            readOnly
            rows={14}
            value={shareText}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs font-mono text-slate-800 focus:outline-none leading-relaxed shadow-2xs"
          />

          <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleCopyUrlOnly}
              className="flex items-center justify-center space-x-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
            >
              {copiedUrl ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span className="text-emerald-700">คัดลอกลิงก์แล้ว!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-slate-500" />
                  <span>คัดลอกเฉพาะลิงก์เว็บ</span>
                </>
              )}
            </button>

            <button
              onClick={handleCopy}
              className={`flex items-center justify-center space-x-1.5 rounded-xl px-5 py-2.5 text-xs font-bold shadow-xs transition ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#06C755] text-white hover:bg-[#05a346]'
              }`}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>คัดลอกข้อความแล้ว!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>คัดลอกข้อความ LINE ทั้งหมด</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
