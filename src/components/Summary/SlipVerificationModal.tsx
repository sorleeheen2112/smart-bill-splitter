'use client';

import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, XCircle, Clock, Loader2, Sparkles, Building2, User, FileText, AlertCircle } from 'lucide-react';
import { Member, CalculationResult } from '@/lib/types';
import { formatTHB } from '@/lib/calculator';
import { verifySlipWithSlipOk, SlipVerificationResult, isSlipVerificationEnabled, checkSlipOkQuota } from '@/lib/slipok';

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
  const [quotaRemaining, setQuotaRemaining] = useState<number | null>(null);
  const [isCheckingQuota, setIsCheckingQuota] = useState(false);

  const breakdown = member ? calculation.membersBreakdown[member.id] : null;
  const expectedAmount = breakdown?.totalPayable || 0;
  const isEnabled = isSlipVerificationEnabled();
  const isAutoVerifying = actionLoading === 'autoVerify';
  const isAnyActionLoading = actionLoading !== null;

  // Reset states and fetch remaining quota when modal opens (if feature enabled)
  useEffect(() => {
    setSlipOkData(null);
    setErrorMessage(null);

    if (isEnabled && member?.slipUrl) {
      setIsCheckingQuota(true);
      checkSlipOkQuota()
        .then((res) => {
          if (res.success && res.data) {
            setQuotaRemaining(res.data.quota);
          }
        })
        .catch((e) => console.warn('Failed to fetch quota:', e))
        .finally(() => setIsCheckingQuota(false));
    }
  }, [member?.id, isEnabled]);

  const handleCheckSlipWithSlipOk = async (url: string) => {
    if (!url || actionLoading) return;
    setActionLoading('autoVerify');
    setErrorMessage(null);
    try {
      const res = await verifySlipWithSlipOk({
        imageUrl: url,
        expectedAmount: expectedAmount,
      });
      setSlipOkData(res);
      if (res.quota !== undefined) {
        setQuotaRemaining(res.quota);
      } else if (quotaRemaining !== null && quotaRemaining > 0) {
        setQuotaRemaining(quotaRemaining - 1);
      }
    } catch (err: any) {
      console.warn('Manual verify slip error:', err);
      setErrorMessage(err?.message || 'เกิดข้อผิดพลาดในการตรวจสอบสลิป');
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

  const isAlreadyVerified = member.paymentStatus === 'VERIFIED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-slate-900">
                สลิปโอนเงิน: {member.name}
              </h3>
              {isAlreadyVerified ? (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-300">
                  ชำระแล้ว
                </span>
              ) : (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-300">
                  รอตรวจสลิป
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
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

          {/* Auto Verification Result Card */}
          {actionLoading === 'autoVerify' ? (
            <div className="flex items-center justify-center space-x-2 rounded-xl bg-teal-50/60 border border-teal-200 p-3 text-xs text-teal-800">
              <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
              <span className="font-semibold">กำลังดึงข้อมูลและตรวจสอบสลิปกับระบบธนาคาร...</span>
            </div>
          ) : slipOkData ? (
            <div
              className={`rounded-xl p-3.5 text-xs border space-y-2.5 animate-in fade-in ${
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
                  <span className="font-mono font-bold text-sm bg-white/90 px-2 py-0.5 rounded-md border border-slate-200 text-emerald-900 shadow-2xs">
                    ฿{slipOkData.data.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                  </span>
                )}
              </div>

              <p className="text-[11px] leading-relaxed text-slate-700 font-medium">
                {slipOkData.message}
              </p>

              {slipOkData.data && (
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/80 text-[11px] text-slate-700 bg-white/60 p-2.5 rounded-lg">
                  {slipOkData.data.senderName && (
                    <div className="flex items-center space-x-1.5">
                      <User className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                      <span className="truncate">ผู้โอน: <strong>{slipOkData.data.senderName}</strong></span>
                    </div>
                  )}
                  {slipOkData.data.senderBank && (
                    <div className="flex items-center space-x-1.5">
                      <Building2 className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                      <span className="truncate">ธนาคาร: <strong>{slipOkData.data.senderBank}</strong></span>
                    </div>
                  )}
                  {slipOkData.data.transDate && (
                    <div className="flex items-center space-x-1.5 text-slate-600">
                      <Clock className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                      <span>วันที่โอน: {slipOkData.data.transDate} {slipOkData.data.transTime || ''}</span>
                    </div>
                  )}
                  {slipOkData.data.transRef && (
                    <div className="flex items-center space-x-1.5 text-slate-500 font-mono text-[10px] col-span-2">
                      <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>รหัสอ้างอิง (Ref): {slipOkData.data.transRef}</span>
                    </div>
                  )}
                </div>
              )}

              {isEnabled && member.slipUrl && quotaRemaining !== 0 && (
                <div className="pt-1 flex justify-end">
                  <button
                    onClick={() => handleCheckSlipWithSlipOk(member.slipUrl!)}
                    disabled={isAutoVerifying || isAnyActionLoading}
                    type="button"
                    className="text-[11px] font-semibold text-teal-700 hover:text-teal-900 underline flex items-center space-x-1 disabled:opacity-50"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>กดตรวจเช็คกับธนาคารซ้ำอีกครั้ง</span>
                  </button>
                </div>
              )}
            </div>
          ) : (member.slipUrl && isEnabled && quotaRemaining !== 0) ? (
            <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center space-x-1.5 text-xs font-bold text-teal-900">
                  <Sparkles className="h-4 w-4 text-teal-600" />
                  <span>ระบบตรวจเช็คกับธนาคาร</span>
                </span>
                
                {isCheckingQuota && (
                  <span className="flex items-center space-x-1 text-[11px] text-teal-600">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>กำลังโหลด...</span>
                  </span>
                )}
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed">
                ป้องกันสลิปปลอม/ยอดเงินไม่ตรง: ตรวจสอบความถูกต้องของสลิปโดยตรงกับระบบธนาคาร
              </p>

              <button
                onClick={() => handleCheckSlipWithSlipOk(member.slipUrl!)}
                disabled={isAutoVerifying || isAnyActionLoading}
                type="button"
                className="w-full flex items-center justify-center space-x-1.5 rounded-xl border border-teal-600 bg-teal-600 py-2.5 text-xs font-bold text-white hover:bg-teal-700 active:scale-[0.99] transition shadow-xs disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4 text-teal-200" />
                <span>ตรวจเช็คกับธนาคาร</span>
              </button>
            </div>
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
                <span>เวลาที่อัปโหลดสลิป:</span>
              </span>
              <span className="font-mono text-slate-700 font-semibold">
                {new Date(member.slipUploadedAt).toLocaleString('th-TH')}
              </span>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="border-t border-slate-100 p-4 bg-slate-50/50">
          {isAlreadyVerified ? (
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
                onClick={onClose}
                className="flex items-center justify-center space-x-1.5 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition"
              >
                <span>ปิดหน้าต่าง</span>
              </button>
            </div>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
};
