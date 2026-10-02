'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Upload, CheckCircle2, Camera, Clock, Loader2, X, Send, Sparkles, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Member } from '@/lib/types';
import { compressSlipImage } from '@/lib/imageUtils';
import { verifySlipWithSlipOk } from '@/lib/slipok';
import { formatTHB } from '@/lib/calculator';

interface SlipUploadSectionProps {
  member: Member;
  expectedAmount?: number;
  onUploadSlip: (
    memberId: string,
    slipUrl: string,
    verifyResult?: { verified: boolean; message: string; paidAmount?: number }
  ) => Promise<boolean> | void;
}

export const SlipUploadSection: React.FC<SlipUploadSectionProps> = ({
  member,
  expectedAmount,
  onUploadSlip,
}) => {
  // tempPreview is for staging newly selected image before confirming
  const [tempPreview, setTempPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [verifyNotice, setVerifyNotice] = useState<{
    type: 'success' | 'warning';
    title: string;
    message: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize with member changes
  useEffect(() => {
    setTempPreview(null);
    setErrorMessage(null);
    setVerifyNotice(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [member.id, member.slipUrl]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setVerifyNotice(null);
    setIsProcessing(true);
    setLoadingStatus('กำลังเตรียมรูปภาพสลิป...');

    try {
      // Compress slip image to clean JPEG
      const compressedUrl = await compressSlipImage(file, 1000, 1200, 0.85);
      setTempPreview(compressedUrl);
    } catch (err) {
      console.error('Failed to compress slip:', err);
      // Fallback
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = (event.target?.result as string) || '';
        setTempPreview(url);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsProcessing(false);
      setLoadingStatus('');
    }
  };

  const handleCancelTempPreview = () => {
    setTempPreview(null);
    setErrorMessage(null);
    setVerifyNotice(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirmUpload = async () => {
    if (!tempPreview || isProcessing) return;
    setIsProcessing(true);
    setErrorMessage(null);
    setVerifyNotice(null);

    try {
      // Step 1: Auto-verify slip with bank system
      setLoadingStatus('กำลังตรวจสอบสลิปกับระบบธนาคาร...');
      
      let verifyRes = null;
      try {
        verifyRes = await verifySlipWithSlipOk({
          imageBase64: tempPreview,
          expectedAmount: expectedAmount,
        });
      } catch (verifyErr) {
        console.warn('SlipOK verification skipped/errored:', verifyErr);
      }

      // Step 2: Upload and persist to Supabase/storage
      setLoadingStatus('กำลังบันทึกข้อมูลสลิป...');
      
      const isAutoVerified = Boolean(verifyRes?.success && verifyRes?.verified);
      const paidAmount = verifyRes?.data?.amount || (isAutoVerified ? expectedAmount : undefined);

      const result = await onUploadSlip(member.id, tempPreview, {
        verified: isAutoVerified,
        message: verifyRes?.message || '',
        paidAmount: paidAmount,
      });

      if (result === false) {
        throw new Error('บันทึกสลิปไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
      }

      setTempPreview(null);

      // Show result feedback to user
      if (isAutoVerified) {
        setVerifyNotice({
          type: 'success',
          title: 'ตรวจสลิปถูกต้องแล้ว 🎉',
          message: `ยอดโอน ${formatTHB(paidAmount || expectedAmount || 0)} ตรงตามยอดที่ต้องชำระ ระบบปรับสถานะเป็น "ชำระแล้ว" อัตโนมัติทันที`,
        });
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch (e) {}
      } else if (verifyRes?.outOfQuota) {
        setVerifyNotice({
          type: 'warning',
          title: 'ส่งสลิปให้ Host แล้ว',
          message: 'ส่งหลักฐานการโอนให้ Host เรียบร้อยแล้ว (รอ Host ยืนยันยอดเงิน)',
        });
      } else if (verifyRes && !verifyRes.verified) {
        setVerifyNotice({
          type: 'warning',
          title: 'ส่งสลิปให้ Host แล้ว',
          message: verifyRes.message || 'ส่งสลิปเรียบร้อยแล้ว รอ Host ยืนยันยอดเงินอีกครั้ง',
        });
      } else {
        setVerifyNotice({
          type: 'warning',
          title: 'ส่งสลิปให้ Host แล้ว',
          message: 'อัปโหลดสลิปเรียบร้อยแล้ว รอ Host ตรวจสอบยอดเงิน',
        });
      }
    } catch (err: any) {
      console.error('Upload error in SlipUploadSection:', err);
      setErrorMessage(err?.message || 'เกิดข้อผิดพลาดในการส่งสลิป กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsProcessing(false);
      setLoadingStatus('');
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
          <Upload className="h-4 w-4 text-emerald-600" />
          <span>แนบสลิปหลักฐานการโอนเงิน</span>
        </h4>

        {member.paymentStatus === 'VERIFIED' ? (
          <span className="inline-flex items-center space-x-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>ชำระเรียบร้อยแล้ว</span>
          </span>
        ) : member.paymentStatus === 'SLIP_UPLOADED' ? (
          <span className="inline-flex items-center space-x-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-900 border border-amber-300">
            <Clock className="h-3.5 w-3.5" />
            <span>รอ Host ตรวจสลิป</span>
          </span>
        ) : null}
      </div>

      {/* Auto-verify banner notice */}
      {verifyNotice && (
        <div
          className={`mb-4 rounded-xl p-3.5 text-xs border animate-in fade-in zoom-in-95 duration-200 ${
            verifyNotice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          <div className="flex items-start space-x-2">
            {verifyNotice.type === 'success' ? (
              <Sparkles className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-bold text-xs">{verifyNotice.title}</p>
              <p className="text-[11px] opacity-90 mt-0.5 leading-relaxed">
                {verifyNotice.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {isProcessing ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 py-10 text-center space-y-2.5">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-xs font-bold text-slate-800">
            {loadingStatus || 'กำลังประมวลผล...'}
          </p>
          <p className="text-[11px] text-slate-500">
            ระบบกำลังตรวจสอบข้อมูลสลิปอัตโนมัติ กรุณารอสักครู่
          </p>
        </div>
      ) : tempPreview ? (
        /* Preview & Confirm state */
        <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
          <div className="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-emerald-500 bg-emerald-50/20 p-2">
            <span className="absolute top-2 left-2 rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
              ตัวอย่างสลิปที่เลือก
            </span>
            <img
              src={tempPreview}
              alt="Slip Preview"
              className="max-h-64 w-auto rounded-lg object-contain shadow-xs mt-3"
            />
          </div>

          {errorMessage && (
            <div className="rounded-lg bg-rose-50 p-2.5 text-center text-xs font-semibold text-rose-700 border border-rose-200">
              {errorMessage}
            </div>
          )}

          <div className="rounded-lg bg-teal-50/60 p-2.5 text-center text-xs text-teal-800 border border-teal-200/60 flex items-center justify-center space-x-1.5">
            <Sparkles className="h-3.5 w-3.5 text-teal-600" />
            <span>ระบบจะตรวจสอบสลิปและยอดเงินอัตโนมัติ</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleCancelTempPreview}
              type="button"
              className="flex items-center justify-center space-x-1 rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 border border-slate-300 transition"
            >
              <X className="h-4 w-4 text-slate-500" />
              <span>ยกเลิก / เลือกใหม่</span>
            </button>
            <button
              onClick={handleConfirmUpload}
              type="button"
              className="flex items-center justify-center space-x-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-500/20 hover:from-emerald-700 hover:to-teal-700 active:scale-95 transition"
            >
              <Send className="h-4 w-4" />
              <span>ยืนยันส่งสลิป</span>
            </button>
          </div>
        </div>
      ) : member.slipUrl ? (
        /* Already uploaded state */
        <div className="space-y-3">
          <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-2">
            <img
              src={member.slipUrl}
              alt="Uploaded Slip"
              className="max-h-64 w-auto rounded-lg object-contain shadow-xs"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className="flex items-center space-x-1 text-emerald-700 font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>
                {member.paymentStatus === 'VERIFIED'
                  ? 'สลิปได้รับการยืนยันความถูกต้องแล้ว'
                  : 'ส่งสลิปให้ Host เรียบร้อยแล้ว'}
              </span>
            </span>

            <button
              onClick={() => fileInputRef.current?.click()}
              type="button"
              className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 border border-slate-200 transition"
            >
              เปลี่ยนรูปสลิป
            </button>
          </div>
        </div>
      ) : (
        /* Empty upload state */
        <div className="space-y-3">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/70 p-8 text-center hover:border-emerald-600 hover:bg-emerald-50/30 cursor-pointer transition"
          >
            <Camera className="h-8 w-8 text-emerald-600 mb-2" />
            <span className="text-xs font-bold text-slate-900 mb-0.5">
              แตะเพื่อถ่ายรูป หรือเลือกรูปสลิป
            </span>
            <span className="text-[11px] text-slate-500">
              ไฟล์ PNG, JPG หรือภาพถ่ายหน้าจอสลิปธนาคาร (ตรวจสลิปอัตโนมัติ)
            </span>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};
