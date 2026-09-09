'use client';

import React from 'react';
import { X, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Member, CalculationResult } from '@/lib/types';
import { formatTHB } from '@/lib/calculator';

interface SlipVerificationModalProps {
  member: Member | null;
  calculation: CalculationResult;
  onClose: () => void;
  onVerify: (memberId: string) => void;
  onReject: (memberId: string) => void;
}

export const SlipVerificationModal: React.FC<SlipVerificationModalProps> = ({
  member,
  calculation,
  onClose,
  onVerify,
  onReject,
}) => {
  if (!member) return null;

  const breakdown = calculation.membersBreakdown[member.id];
  const expectedAmount = breakdown?.totalPayable || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              ตรวจสอบสลิปโอนเงิน: {member.name}
            </h3>
            <p className="text-xs text-slate-500">
              ยอดที่ต้องชำระ:{' '}
              <strong className="text-slate-900 font-mono font-bold">
                {formatTHB(expectedAmount)}
              </strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Slip Image Preview */}
          <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-2 overflow-hidden max-h-[380px]">
            {member.slipUrl ? (
              <img
                src={member.slipUrl}
                alt={`Slip for ${member.name}`}
                className="max-h-[360px] w-auto object-contain rounded-lg shadow-sm"
              />
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                ไม่มีรูปสลิป หรือสลิปจำลอง
              </div>
            )}
          </div>

          {member.slipUploadedAt && (
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center space-x-1">
                <Clock className="h-3.5 w-3.5" />
                <span>เวลาที่อัปโหลด:</span>
              </span>
              <span className="font-mono text-slate-700 font-semibold">
                {new Date(member.slipUploadedAt).toLocaleTimeString('th-TH')}
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => {
                onReject(member.id);
                onClose();
              }}
              className="flex items-center justify-center space-x-1.5 rounded-xl border border-rose-200 bg-rose-50 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
            >
              <XCircle className="h-4 w-4" />
              <span>ขอให้อัปโหลดใหม่</span>
            </button>
            <button
              onClick={() => {
                onVerify(member.id);
                onClose();
              }}
              className="flex items-center justify-center space-x-1.5 rounded-xl bg-teal-700 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-teal-800 transition"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>ยืนยันสลิปถูกต้อง</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
