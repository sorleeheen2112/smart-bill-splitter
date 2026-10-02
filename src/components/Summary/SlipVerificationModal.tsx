'use client';

import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, XCircle, Clock, Loader2, Sparkles, Building2, User, FileText, AlertCircle } from 'lucide-react';
import { Member, CalculationResult } from '@/lib/types';
import { formatTHB } from '@/lib/calculator';
import { verifySlipWithSlipOk, SlipVerificationResult } from '@/lib/slipok';

interface SlipVerificationModalProps {
  member: Member | null;
  calculation: CalculationResult;
  onClose: () => void;
  onVerify: (memberId: string) => Promise<boolean> | void;
  onReject: (memberId: string) => Promise<boolean> | void;
}

export const SlipVerificationModal: React.FC<SlipVerificationModalProps> = ({
  member,
  calculation,
  onClose,
  onVerify,
  onReject,
}) => {
  const [actionLoading, setActionLoading] = useState<'verify' | 'reject' | 'autoVerify' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [slipOkData, setSlipOkData] = useState<SlipVerificationResult | null>(null);

  const breakdown = member ? calculation.membersBreakdown[member.id] : null;
  const expectedAmount = breakdown?.totalPayable || 0;

  // Auto trigger SlipOK check on modal open if slipUrl is available and not verified yet
  useEffect(() => {
    setSlipOkData(null);
    setErrorMessage(null);

    if (member?.slipUrl && member.paymentStatus === 'SLIP_UPLOADED') {
      handleCheckSlipWithSlipOk(member.slipUrl);
    }
  }, [member?.id, member?.slipUrl]);

  const handleCheckSlipWithSlipOk = async (url: string) => {
    setActionLoading('autoVerify');
    setErrorMessage(null);
    try {
      const res = await verifySlipWithSlipOk({
        imageUrl: url,
        expectedAmount: expectedAmount,
      });
      setSlipOkData(res);
    } catch (err: any) {
      console.warn('Auto verify slip error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  if (!member) return null;

  const handleVerify = async () => {
    if (actionLoading) return;
    setActionLoading('verify');
    setErrorMessage(null);
    try {
      const res = await onVerify(member.id);
      if (res === false) {
        throw new Error('ไม่สามารถบันทึกสถานะได้ กรุณาลองใหม่อีกครั้ง');
      }
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'เกิดข้อผิดพลาดในการยืนยันสลิป');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (actionLoading) return;
    setActionLoading('reject');
    setErrorMessage(null);
    try {
      const res = await onReject(member.id);
      if (res === false) {
        throw new Error('ไม่สามารถบันทึกสถานะได้ กรุณาลองใหม่อีกครั้ง');
      }
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'เกิดข้อผิดพลาดในการปฏิเสธสลิป');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              ตรวจสอบสลิปโอนเงิน: {member.name}
            </h3>
            <p className="text-xs text-slate-500">
              ยอดที่ต้องชำระ:{' '}
              <strong className="text-emerald-700 font-mono font-bold text-sm">
                {formatTHB(expectedAmount)}
              </strong>
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={!!actionLoading}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-800 disabled:opacity-50 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {errorMessage && (
            <div className="rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 border border-rose-200 animate-in fade-in">
              {errorMessage}
            </div>
          )}

          {/* SlipOK Auto Verification Result Card */}
          {actionLoading === 'autoVerify' ? (
            <div className="flex items-center justify-center space-x-2 rounded-xl bg-teal-50/60 border border-teal-200 p-3 text-xs text-teal-800">
              <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
              <span className="font-semibold">กำลังตรวจสอบสลิปกับระบบธนาคารผ่าน SlipOK...</span>
            </div>
          ) : slipOkData ? (
            <div
              className={`rounded-xl p-3.5 text-xs border space-y-2 animate-in fade-in ${
                slipOkData.verified
                  ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                  : 'bg-amber-50/80 border-amber-300 text-amber-950'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center space-x-1.5 font-bold">
                  {slipOkData.verified ? (
                    <>
                      <Sparkles className="h-4 w-4 text-emerald-600" />
                      <span className="text-emerald-800">ผลตรวจสลิปจากระบบธนาคาร (ถูกต้อง)</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <span className="text-amber-800">ผลตรวจสลิปจากระบบธนาคาร</span>
                    </>
                  )}
                </span>
                {slipOkData.data?.amount !== undefined && (
                  <span className="font-mono font-bold text-sm bg-white/80 px-2 py-0.5 rounded-md border border-slate-200">
                    ฿{slipOkData.data.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                  </span>
                )}
              </div>

              <p className="text-[11px] leading-relaxed text-slate-700 font-medium">
                {slipOkData.message}
              </p>

              {slipOkData.data && (
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 text-[11px] text-slate-600">
                  {slipOkData.data.senderName && (
                    <div className="flex items-center space-x-1">
                      <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">ผู้โอน: <strong>{slipOkData.data.senderName}</strong></span>
                    </div>
                  )}
                  {slipOkData.data.senderBank && (
                    <div className="flex items-center space-x-1">
                      <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{slipOkData.data.senderBank}</span>
                    </div>
                  )}
                  {slipOkData.data.transRef && (
                    <div className="flex items-center space-x-1 col-span-2 text-slate-500 font-mono text-[10px]">
                      <FileText className="h-3 w-3 shrink-0" />
                      <span>Ref: {slipOkData.data.transRef}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : member.slipUrl ? (
            <button
              onClick={() => handleCheckSlipWithSlipOk(member.slipUrl!)}
              type="button"
              className="w-full flex items-center justify-center space-x-1.5 rounded-xl border border-teal-300 bg-teal-50 py-2 text-xs font-bold text-teal-800 hover:bg-teal-100 transition"
            >
              <Sparkles className="h-4 w-4 text-teal-600" />
              <span>กดตรวจสลิปด้วย SlipOK อีกครั้ง</span>
            </button>
          ) : null}

          {/* Slip Image Preview */}
          <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-2 overflow-hidden max-h-[360px]">
            {member.slipUrl ? (
              <img
                src={member.slipUrl}
                alt={`Slip for ${member.name}`}
                className="max-h-[340px] w-auto object-contain rounded-lg shadow-sm"
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
        </div>

        {/* Action Footer */}
        <div className="border-t border-slate-100 p-4 bg-slate-50/50">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleReject}
              disabled={!!actionLoading}
              className="flex items-center justify-center space-x-1.5 rounded-xl border border-rose-200 bg-rose-50 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition disabled:opacity-50"
            >
              {actionLoading === 'reject' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-rose-600" />
                  <span>กำลังดำเนินการ...</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" />
                  <span>ขอให้อัปโหลดใหม่</span>
                </>
              )}
            </button>
            <button
              onClick={handleVerify}
              disabled={!!actionLoading}
              className="flex items-center justify-center space-x-1.5 rounded-xl bg-gradient-to-r from-teal-700 to-emerald-700 py-2.5 text-xs font-bold text-white shadow-sm hover:from-teal-800 hover:to-emerald-800 transition disabled:opacity-50"
            >
              {actionLoading === 'verify' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>ยืนยันสลิปถูกต้อง</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
