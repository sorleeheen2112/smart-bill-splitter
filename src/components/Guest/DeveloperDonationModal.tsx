'use client';

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, Coffee, Sparkles } from 'lucide-react';
import { generatePromptPayPayload } from '@/lib/promptpay';
import { formatTHB } from '@/lib/calculator';

interface DeveloperDonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  promptPayNumber: string;
  promptPayName: string;
}

const FIXED_AMOUNTS = [
  { label: '10 บาท', value: 10 },
  { label: '20 บาท', value: 20 },
  { label: '30 บาท', value: 30 },
  { label: '40 บาท', value: 40 },
];

export const DeveloperDonationModal: React.FC<DeveloperDonationModalProps> = ({
  isOpen,
  onClose,
  promptPayNumber,
  promptPayName,
}) => {
  const [selectedAmount, setSelectedAmount] = useState<number>(0);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [copiedNumber, setCopiedNumber] = useState(false);

  if (!isOpen) return null;

  const currentAmount = isCustom ? parseFloat(customAmount) || 0 : selectedAmount;
  const qrPayload = generatePromptPayPayload(
    promptPayNumber,
    currentAmount > 0 ? currentAmount : undefined
  );

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(promptPayNumber.replace(/[^0-9]/g, ''));
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-teal-800 via-teal-700 to-emerald-700 p-5 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner border border-white/20">
              <Coffee className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5 text-amber-300 text-[11px] font-bold uppercase tracking-wider mb-0.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Support Developer</span>
              </div>
              <h3 className="text-base font-black tracking-tight text-white">
                สนับสนุนผู้พัฒนา
              </h3>
              <p className="text-xs text-teal-100 font-medium">
                เลี้ยงกาแฟ & สนับสนุนค่าเซิร์ฟเวอร์ระบบ
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Thank you note */}
          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3.5 text-center shadow-2xs">
            <p className="text-xs text-amber-900 leading-relaxed font-medium">
              🙏 ขอบคุณที่ร่วมใช้งานระบบหารบิลครับ! ยอดสนับสนุนทั้งหมดจะนำไปใช้เป็นค่าบำรุงรักษาเซิร์ฟเวอร์และพัฒนาฟีเจอร์ใหม่ๆ
            </p>
          </div>

          {/* Amount Presets */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800">
              เลือกจำนวนเงินสนับสนุน
            </label>

            {/* Full-width "ตามสะดวก" Button */}
            <button
              type="button"
              onClick={() => {
                setIsCustom(false);
                setSelectedAmount(0);
              }}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all border flex items-center justify-center space-x-1.5 ${
                !isCustom && selectedAmount === 0
                  ? 'bg-teal-700 text-white border-teal-800 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-teal-50/60 hover:border-teal-300 shadow-2xs'
              }`}
            >
              <span>✨ ตามสะดวก (สแกนระบุยอดเอง)</span>
            </button>

            {/* 4 Fixed Amount Buttons */}
            <div className="grid grid-cols-4 gap-2">
              {FIXED_AMOUNTS.map((preset) => {
                const isSelected = !isCustom && selectedAmount === preset.value;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => {
                      setIsCustom(false);
                      setSelectedAmount(preset.value);
                    }}
                    className={`py-2 px-1 rounded-xl text-xs font-bold transition-all border text-center ${
                      isSelected
                        ? 'bg-teal-700 text-white border-teal-800 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-teal-50/60 hover:border-teal-300 shadow-2xs'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* PromptPay QR Section */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="relative rounded-2xl bg-white p-3.5 shadow-sm border border-slate-200">
              <QRCodeSVG
                value={qrPayload}
                size={180}
                level="M"
                includeMargin={false}
              />
              {/* Thai QR Central Logo Badge */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="rounded-md bg-white p-1 shadow-md border border-slate-300">
                  <span className="text-[9px] font-black text-teal-950 tracking-tighter">
                    PromptPay
                  </span>
                </div>
              </div>
            </div>

            {/* Amount display */}
            <div className="mt-3 text-center">
              <span className="text-[11px] text-slate-500 font-medium">
                {currentAmount > 0 ? 'ยอดสแกนระบุไว้' : 'สแกนแล้วระบุยอดตามสะดวก'}
              </span>
              {currentAmount > 0 && (
                <div className="text-xl font-black text-teal-800 font-mono tracking-tight">
                  {formatTHB(currentAmount)}
                </div>
              )}
            </div>

            {/* PromptPay info details */}
            <div className="mt-3 w-full bg-white rounded-xl p-3 border border-slate-200 text-xs space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">ชื่อบัญชี:</span>
                <span className="font-bold text-slate-800">{promptPayName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">พร้อมเพย์:</span>
                <div className="flex items-center space-x-1.5">
                  <span className="font-mono font-bold text-slate-900">
                    {promptPayNumber}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyNumber}
                    className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                    title="คัดลอกเบอร์พร้อมเพย์"
                  >
                    {copiedNumber ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
