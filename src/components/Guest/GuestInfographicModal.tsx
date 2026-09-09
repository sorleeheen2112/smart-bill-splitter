'use client';

import React from 'react';
import {
  X,
  UserCheck,
  QrCode,
  UploadCloud,
  CreditCard,
  Crown,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';

interface GuestInfographicModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuestInfographicModal: React.FC<GuestInfographicModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-emerald-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-xl bg-white/10 p-2 text-white/80 hover:bg-white/20 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center space-x-2 text-amber-300 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="h-4 w-4" />
            <span>Party Bill Splitter Guide</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black">
            💡 วิธีใช้งานสำหรับเพื่อนร่วมปาร์ตี้ (Guest Guide)
          </h2>
          <p className="text-xs sm:text-sm text-teal-100 mt-1">
            จ่ายง่าย จ่ายไว ไม่ต้องคิดเลขเอง ทำตาม 3 ขั้นตอนง่ายๆ ด้านล่างนี้ได้เลย!
          </p>
        </div>

        {/* Body Steps */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* 3 Main Steps */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Step 1 */}
            <div className="rounded-2xl border border-teal-100 bg-teal-50/50 p-4 relative flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700 text-white shadow-sm font-bold">
                    1
                  </div>
                  <UserCheck className="h-5 w-5 text-teal-600" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  เลือกชื่อของคุณ
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  แตะที่ปุ่มชื่อของคุณในหน้ารายชื่อ เพื่อดูรายการอาหารกองกลางและแก๊งที่คุณเข้าร่วม
                </p>
              </div>
              <div className="mt-3 rounded-lg bg-white p-2 text-[11px] font-semibold text-teal-800 border border-teal-200 text-center">
                👉 ยอดถูกคำนวณเป๊ะๆ
              </div>
            </div>

            {/* Step 2 */}
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 relative flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm font-bold">
                    2
                  </div>
                  <QrCode className="h-5 w-5 text-emerald-600" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  สแกนจ่าย PromptPay
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  เปิดแอปธนาคารใดก็ได้ แล้วสแกน QR Code ที่ระบุยอดเงินของคุณไว้ให้เรียบร้อยแล้ว
                </p>
              </div>
              <div className="mt-3 rounded-lg bg-white p-2 text-[11px] font-semibold text-emerald-800 border border-emerald-200 text-center">
                📲 ตรงยอด ไม่ต้องพิมพ์เลข
              </div>
            </div>

            {/* Step 3 */}
            <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4 relative flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600 text-white shadow-sm font-bold">
                    3
                  </div>
                  <UploadCloud className="h-5 w-5 text-amber-600" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  แนบรูปสลิปยืนยัน
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  กดอัปโหลดรูปสลิปหลักฐานการโอนเงิน เพื่อให้เจ้าของบิล (Host) กดตรวจและยืนยัน
                </p>
              </div>
              <div className="mt-3 rounded-lg bg-white p-2 text-[11px] font-semibold text-amber-800 border border-amber-200 text-center">
                🎉 เสร็จสิ้น ปิด QR ทันที
              </div>
            </div>
          </div>

          {/* Special Role Highlights */}
          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              🌟 สิทธิพิเศษ & กรณีเฉพาะ (Special Roles)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-start space-x-3 rounded-xl bg-white p-3 border border-slate-200 shadow-2xs">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-900">
                    💳 คนออกเงินสำรองจ่ายหน้าร้าน (Payer)
                  </h5>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    ระบบจะ Auto จ่ายให้ ไม่ต้องโอนเงินซ้ำ พร้อมแสดงยอดเงินรวมที่เพื่อนๆ ต้องโอนคืนให้คุณ
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 rounded-xl bg-white p-3 border border-slate-200 shadow-2xs">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <Crown className="h-5 w-5" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-900">
                    👑 แขก VIP กินฟรี [Tag F]
                  </h5>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    ยอดจ่าย 0 บาท เพื่อนๆ ร่วมใจกันดูแลค่าอาหารมื้อนี้ให้คุณเรียบร้อยแล้ว
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick FAQ / Note */}
          <div className="flex items-center space-x-2 text-xs text-slate-500 bg-teal-50/50 p-3 rounded-xl border border-teal-100">
            <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
            <span>
              เมื่อ Host กดยืนยันสลิปของคุณแล้ว หน้านี้จะเปลี่ยนเป็นสถานะ <strong>"ชำระแล้ว ✓"</strong> และซ่อน QR Code ให้อัตโนมัติครับ
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 p-4 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-teal-700 px-6 py-2.5 text-xs font-bold text-white hover:bg-teal-800 transition shadow-xs"
          >
            เข้าใจแล้ว เริ่มใช้งานได้เลย!
          </button>
        </div>
      </div>
    </div>
  );
};
