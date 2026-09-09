'use client';

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, QrCode } from 'lucide-react';
import { generatePromptPayPayload } from '@/lib/promptpay';
import { formatTHB } from '@/lib/calculator';

interface PromptPayQRCodeProps {
  promptPayNumber: string;
  promptPayName?: string;
  amount: number;
  memberName?: string;
}

export const PromptPayQRCode: React.FC<PromptPayQRCodeProps> = ({
  promptPayNumber,
  promptPayName,
  amount,
  memberName,
}) => {
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState(false);

  if (!promptPayNumber) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-xs text-slate-500 shadow-xs">
        Host ยังไม่ได้ระบุเบอร์พร้อมเพย์
      </div>
    );
  }

  const qrPayload = generatePromptPayPayload(promptPayNumber, amount > 0 ? amount : undefined);

  const handleCopyAmount = () => {
    navigator.clipboard.writeText(amount.toFixed(2));
    setCopiedAmount(true);
    setTimeout(() => setCopiedAmount(false), 2000);
  };

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(promptPayNumber.replace(/[^0-9]/g, ''));
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  return (
    <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Thai PromptPay Branding Header */}
      <div className="flex items-center space-x-2 rounded-full bg-teal-50 px-3.5 py-1 border border-teal-200 mb-4">
        <QrCode className="h-4 w-4 text-teal-700" />
        <span className="text-xs font-bold text-teal-900">
          พร้อมเพย์ PromptPay QR (สแกนจ่ายตรงยอด)
        </span>
      </div>

      {/* QR Code Container with crisp frame */}
      <div className="relative rounded-2xl bg-white p-4 shadow-md border border-slate-200">
        <QRCodeSVG
          value={qrPayload}
          size={210}
          level="M"
          includeMargin={false}
        />
        {/* Thai QR Central Logo Badge */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="rounded-md bg-white p-1 shadow-md border border-slate-300">
            <span className="text-[10px] font-black text-teal-950 tracking-tighter">
              PromptPay
            </span>
          </div>
        </div>
      </div>

      {/* Amount Display */}
      <div className="mt-4 text-center">
        <span className="text-xs text-slate-500 font-medium">ยอดที่ต้องโอนชำระ</span>
        <div className="flex items-center justify-center space-x-2 mt-0.5">
          <span className="text-2xl font-black text-teal-800 font-mono tracking-tight">
            {formatTHB(amount)}
          </span>
          <button
            onClick={handleCopyAmount}
            className="rounded-lg bg-slate-100 p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition"
            title="คัดลอกยอดเงิน"
          >
            {copiedAmount ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Recipient Details */}
      <div className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-slate-600 font-medium">เบอร์พร้อมเพย์:</span>
          <div className="flex items-center space-x-1.5">
            <span className="font-mono font-bold text-slate-900 tracking-wider">
              {promptPayNumber}
            </span>
            <button
              onClick={handleCopyNumber}
              className="text-slate-400 hover:text-teal-700"
              title="คัดลอกเบอร์"
            >
              {copiedNumber ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {promptPayName && (
          <div className="flex items-center justify-between">
            <span className="text-slate-600 font-medium">ชื่อบัญชี:</span>
            <span className="font-bold text-slate-900">{promptPayName}</span>
          </div>
        )}
      </div>
    </div>
  );
};
