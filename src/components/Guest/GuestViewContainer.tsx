'use client';

import React, { useState } from 'react';
import { UserCheck, Search, Share2, Check, CreditCard, CheckCircle2, X, HelpCircle, Coffee } from 'lucide-react';
import { PartyBill, CalculationResult } from '@/lib/types';
import { GuestBillCard } from './GuestBillCard';
import { PromptPayQRCode } from './PromptPayQRCode';
import { SlipUploadSection } from './SlipUploadSection';
import { GuestInfographicModal } from './GuestInfographicModal';
import { DeveloperDonationModal } from './DeveloperDonationModal';
import { formatTHB } from '@/lib/calculator';
import { getQuickShareText } from '@/lib/shareUtils';

interface GuestViewContainerProps {
  bill: PartyBill;
  calculation: CalculationResult;
  onUpdateBill: (updated: Partial<PartyBill>) => void;
  initialMemberId?: string;
  onSwitchToDetails?: () => void;
}

export const GuestViewContainer: React.FC<GuestViewContainerProps> = ({
  bill,
  calculation,
  onUpdateBill,
  initialMemberId,
  onSwitchToDetails,
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    initialMemberId || (bill.members[0]?.id || '')
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);
  const [isInfographicOpen, setIsInfographicOpen] = useState(false);
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);

  // Developer Donation Config from Environment Variables
  const donationEnabledEnv = (
    process.env.NEXT_PUBLIC_ENABLE_DONATION ||
    process.env.NEXT_PUBLIC_DONATION_ENABLED ||
    ''
  ).toLowerCase();
  const donationPromptPayNumber =
    process.env.NEXT_PUBLIC_DONATION_PROMPTPAY_NUMBER ||
    process.env.NEXT_PUBLIC_DEVELOPER_PROMPTPAY_NUMBER ||
    '';
  const donationPromptPayName =
    process.env.NEXT_PUBLIC_DONATION_PROMPTPAY_NAME ||
    process.env.NEXT_PUBLIC_DEVELOPER_PROMPTPAY_NAME ||
    '';

  const isDonationEnabled =
    (donationEnabledEnv === 'true' || donationEnabledEnv === '1') &&
    !!donationPromptPayNumber.trim() &&
    !!donationPromptPayName.trim();

  const selectedMember = bill.members.find((m) => m.id === selectedMemberId) || bill.members[0];

  const handleUploadSlip = (memberId: string, slipUrl: string) => {
    const updated = bill.members.map((m) =>
      m.id === memberId
        ? {
            ...m,
            slipUrl,
            slipUploadedAt: new Date().toISOString(),
            paymentStatus: 'SLIP_UPLOADED' as const,
          }
        : m
    );
    onUpdateBill({ members: updated });
  };

  const handleCopyPersonalLink = () => {
    if (typeof window !== 'undefined') {
      const shareText = getQuickShareText({ title: bill.title, billId: bill.id });
      navigator.clipboard.writeText(shareText);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const filteredMembers = bill.members.filter((m) =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const breakdown = selectedMember ? calculation.membersBreakdown[selectedMember.id] : null;

  // If bill is not published yet, show friendly waiting screen
  if (!bill.isPublished) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-amber-200 bg-white p-8 text-center shadow-xs">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 mb-4 animate-pulse">
            <span className="text-3xl">⏳</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">
            เจ้าของบิล (Host) กำลังจัดแบ่งรายการอาหาร
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
            บิลนี้ยังอยู่ในระหว่างจัดเตรียมรายการและคำนวณยอด เมื่อ Host กดจัดการเสร็จสิ้นและสร้าง QR Code หน้านี้จะเปิดให้เลือกชื่อและสแกนจ่ายทันที
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {onSwitchToDetails && (
              <button
                type="button"
                onClick={onSwitchToDetails}
                className="w-full sm:w-auto flex items-center justify-center space-x-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
              >
                <span>📋 ดูรายละเอียดบิล (รายการอาหาร/สมาชิก)</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 rounded-xl bg-teal-700 px-5 py-2.5 text-xs font-bold text-white hover:bg-teal-800 shadow-xs transition"
            >
              <span>🔄 รีเฟรชตรวจสถานะ</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step 1: Member Selection Area */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <UserCheck className="h-4 w-4 text-emerald-600" />
              <span>เลือกชื่อของคุณ (Select Your Name)</span>
            </h3>
            <p className="text-xs text-slate-500">
              แตะที่ชื่อเพื่อดูยอดค่าอาหารของคุณและสแกนจ่าย QR
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {isDonationEnabled && (
              <button
                type="button"
                onClick={() => setIsDonationModalOpen(true)}
                className="flex items-center space-x-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100 transition shadow-2xs cursor-pointer shrink-0"
                title="สนับสนุนค่าน้ำชา/กาแฟและค่าเซิร์ฟเวอร์ให้ผู้พัฒนา"
              >
                <Coffee className="h-3.5 w-3.5 text-amber-600" />
                <span>☕ สนับสนุนผู้พัฒนา</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsInfographicOpen(true)}
              className="flex items-center space-x-1.5 rounded-xl border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-800 hover:bg-teal-100 transition shadow-2xs cursor-pointer shrink-0"
              title="ดูวิธีใช้งาน 3 ขั้นตอน"
            >
              <HelpCircle className="h-3.5 w-3.5 text-teal-600" />
              <span>💡 วิธีใช้งาน</span>
            </button>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ค้นหาชื่อ..."
                className="w-full sm:w-44 rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:outline-none shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* Member Avatar Chips List */}
        <div className="flex flex-wrap gap-2 max-h-[205px] overflow-y-auto p-1">
          {filteredMembers.map((member) => {
            const isSelected = member.id === selectedMemberId;
            const mBreakdown = calculation.membersBreakdown[member.id];
            const isVerified = member.paymentStatus === 'VERIFIED';

            return (
              <button
                key={member.id}
                onClick={() => {
                  setSelectedMemberId(member.id);
                  setIsSlipModalOpen(false);
                }}
                className={`flex items-center space-x-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors ${
                  isSelected
                    ? 'border-teal-700 bg-teal-700 text-white shadow-xs'
                    : member.isFree
                    ? 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
                    : isVerified
                    ? 'border-emerald-300 bg-emerald-50/80 text-emerald-900 hover:bg-emerald-100'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-lg text-[11px] font-bold ${
                    isSelected
                      ? 'bg-teal-800/80 text-white'
                      : isVerified
                      ? 'bg-emerald-200 text-emerald-900'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {isVerified ? '✓' : member.name.charAt(0)}
                </div>
                <span>{member.name}</span>
                {member.isFree ? (
                  <span className={`text-[10px] font-bold ${isSelected ? 'text-amber-200' : 'text-amber-700'}`}>[F] ฟรี</span>
                ) : (member.isPayer || member.id === bill.payerMemberId) ? (
                  <span className={`text-[10px] font-bold ${isSelected ? 'text-teal-100' : 'text-emerald-700'}`}>💳 คนสำรองจ่าย</span>
                ) : isVerified ? (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isSelected ? 'bg-teal-800/60 text-white' : 'bg-emerald-100/80 text-emerald-700'}`}>
                    ชำระแล้ว
                  </span>
                ) : (
                  <span className={`font-mono text-[11px] font-bold ${isSelected ? 'text-teal-100' : 'opacity-90'}`}>
                    {formatTHB(mBreakdown?.totalPayable || 0)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: Active Member Breakdown & Payment Flow */}
      {selectedMember && breakdown && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Itemized Breakdown Card */}
          <div className="space-y-4 lg:col-span-7">
            <GuestBillCard
              bill={bill}
              member={selectedMember}
              calculation={calculation}
            />

            {/* Copy Personal Link & Switch to Full Details */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-2xs">
              {onSwitchToDetails && (
                <button
                  type="button"
                  onClick={onSwitchToDetails}
                  className="flex items-center justify-center space-x-1.5 rounded-lg bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-100 border border-teal-200 transition"
                >
                  <span>📋 ดูรายละเอียดบิลทั้งหมด (โหมดอ่านอย่างเดียว)</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleCopyPersonalLink}
                className="flex items-center justify-center space-x-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 border border-slate-200 transition"
              >
                {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Share2 className="h-3.5 w-3.5" />}
                <span>{copiedLink ? 'คัดลอกลิงก์แล้ว' : 'คัดลอกลิงก์บิลนี้'}</span>
              </button>
            </div>
          </div>

          {/* Right Column: PromptPay QR Code & Slip Uploader OR Verified / Payer Banner */}
          <div className="space-y-4 lg:col-span-5">
            {(selectedMember.isPayer || selectedMember.id === bill.payerMemberId) ? (
              <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-xs space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                    <CreditCard className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      คุณคือผู้สำรองจ่ายเงินหน้าร้าน
                    </h3>
                    <p className="text-xs text-emerald-700 font-semibold">
                      สถานะ: ชำระแล้วอัตโนมัติ (ไม่ต้องสแกนโอน)
                    </p>
                  </div>
                </div>
                <div className="rounded-xl bg-emerald-50/70 p-4 border border-emerald-100 text-xs text-emerald-950 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600">ยอดบิลทั้งหมดที่คุณจ่ายให้ร้าน:</span>
                    <span className="font-mono font-bold">{formatTHB(calculation.effectiveGrandTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">ค่าอาหารในส่วนของคุณ:</span>
                    <span className="font-mono font-bold text-slate-900">{formatTHB(breakdown.totalPayable)}</span>
                  </div>
                  <div className="border-t border-emerald-200/80 pt-2 flex justify-between font-bold text-xs text-emerald-900">
                    <span>ยอดรวมที่เพื่อนๆ ต้องโอนคืนคุณ:</span>
                    <span className="font-mono text-emerald-700">{formatTHB(Math.max(0, calculation.effectiveGrandTotal - breakdown.totalPayable))}</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500">
                  เพื่อนๆ กำลังสแกนจ่ายเข้าพร้อมเพย์เบอร์ {bill.promptPayNumber} ({bill.promptPayName || selectedMember.name}) ของคุณ
                </p>
              </div>
            ) : selectedMember.paymentStatus === 'VERIFIED' ? (
              <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-xs space-y-4 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-600 border border-emerald-200 shadow-sm animate-in zoom-in-95">
                  <CheckCircle2 className="h-9 w-9" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    ชำระเงินเรียบร้อยแล้ว! 🎉
                  </h3>
                  <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                    สถานะ: ตรวจสอบและยืนยันสลิปสำเร็จ
                  </p>
                </div>

                <div className="rounded-xl bg-emerald-50/70 p-4 border border-emerald-100 text-xs text-slate-700 space-y-2 text-left">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">ยอดที่ชำระ:</span>
                    <span className="font-mono text-base font-bold text-emerald-800">{formatTHB(breakdown.totalPayable)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] border-t border-emerald-200/60 pt-2 text-slate-500">
                    <span>ผู้รับเงิน:</span>
                    <span className="font-semibold text-slate-800">{bill.promptPayName || bill.promptPayNumber || 'เจ้าของบิล'}</span>
                  </div>
                </div>

                {selectedMember.slipUrl && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setIsSlipModalOpen(true)}
                      className="inline-flex items-center space-x-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition shadow-2xs cursor-pointer"
                    >
                      <span>🧾 ดูรูปสลิปหลักฐาน</span>
                    </button>
                  </div>
                )}

                <p className="text-[11px] text-slate-500 font-medium">
                  ขอบคุณสำหรับมื้อนี้นะครับ/ค่ะ 🙏
                </p>
              </div>
            ) : (
              <>
                {!selectedMember.isFree && (
                  <PromptPayQRCode
                    key={`qr-${selectedMember.id}`}
                    promptPayNumber={bill.promptPayNumber}
                    promptPayName={bill.promptPayName}
                    amount={breakdown.totalPayable}
                    memberName={selectedMember.name}
                  />
                )}

                {!selectedMember.isFree && (
                  <SlipUploadSection
                    key={`slip-${selectedMember.id}`}
                    member={selectedMember}
                    onUploadSlip={handleUploadSlip}
                  />
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Slip Preview Modal Lightbox */}
      {isSlipModalOpen && selectedMember && selectedMember.slipUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  สลิปโอนเงิน: {selectedMember.name}
                </h3>
                {breakdown && (
                  <p className="text-xs text-emerald-700 font-semibold">
                    ยอดเงิน: {formatTHB(breakdown.totalPayable)}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsSlipModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 flex flex-col items-center justify-center bg-slate-50 max-h-[70vh] overflow-y-auto">
              <img
                src={selectedMember.slipUrl}
                alt={`สลิปของ ${selectedMember.name}`}
                className="max-h-[60vh] w-auto rounded-xl object-contain shadow-sm border border-slate-200"
              />
            </div>
            <div className="border-t border-slate-100 p-3 bg-white text-center">
              <button
                type="button"
                onClick={() => setIsSlipModalOpen(false)}
                className="w-full rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guest Infographic Guide Modal */}
      <GuestInfographicModal
        isOpen={isInfographicOpen}
        onClose={() => setIsInfographicOpen(false)}
      />

      {/* Developer Donation Modal */}
      {isDonationEnabled && (
        <DeveloperDonationModal
          isOpen={isDonationModalOpen}
          onClose={() => setIsDonationModalOpen(false)}
          promptPayNumber={donationPromptPayNumber}
          promptPayName={donationPromptPayName}
        />
      )}
    </div>
  );
};
