'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Upload, CheckCircle2, Camera, Clock, Loader2, X, Send } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Member } from '@/lib/types';
import { compressSlipImage } from '@/lib/imageUtils';

interface SlipUploadSectionProps {
  member: Member;
  onUploadSlip: (memberId: string, slipUrl: string) => Promise<boolean> | void;
}

export const SlipUploadSection: React.FC<SlipUploadSectionProps> = ({
  member,
  onUploadSlip,
}) => {
  // tempPreview is for staging newly selected image before confirming
  const [tempPreview, setTempPreview] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize with member changes
  useEffect(() => {
    setTempPreview(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [member.id, member.slipUrl]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setIsCompressing(true);
    try {
      // Compress and downscale slip image to clean ~80KB JPEG
      const compressedUrl = await compressSlipImage(file, 1000, 1200, 0.75);
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
      setIsCompressing(false);
    }
  };

  const handleCancelTempPreview = () => {
    setTempPreview(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirmUpload = async () => {
    if (!tempPreview || isUploading) return;
    setIsUploading(true);
    setErrorMessage(null);

    try {
      const result = await onUploadSlip(member.id, tempPreview);
      // If result is explicitly false, it means upload failed
      if (result === false) {
        throw new Error('บันทึกสลิปไม่สำเร็จ');
      }

      setTempPreview(null);
      try {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch (e) {}
    } catch (err: any) {
      console.error('Upload error in SlipUploadSection:', err);
      setErrorMessage(err?.message || 'เกิดข้อผิดพลาดในการส่งสลิป กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsUploading(false);
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
            <span>Host ยืนยันแล้ว</span>
          </span>
        ) : member.paymentStatus === 'SLIP_UPLOADED' ? (
          <span className="inline-flex items-center space-x-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-900 border border-amber-300">
            <Clock className="h-3.5 w-3.5" />
            <span>รอ Host ตรวจสลิป</span>
          </span>
        ) : null}
      </div>

      {isCompressing || isUploading ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 py-10 text-center space-y-2">
          <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
          <p className="text-xs font-bold text-slate-700">
            {isCompressing ? 'กำลังเตรียมรูปภาพตัวอย่าง...' : 'กำลังส่งสลิปให้ Host...'}
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
              className="max-h-56 w-auto rounded-lg object-contain shadow-xs mt-3"
            />
          </div>

          {errorMessage && (
            <div className="rounded-lg bg-rose-50 p-2.5 text-center text-xs font-semibold text-rose-700 border border-rose-200">
              {errorMessage}
            </div>
          )}

          <div className="rounded-lg bg-slate-50 p-2.5 text-center text-xs text-slate-600 border border-slate-200">
            กรุณาตรวจสอบความถูกต้องของสลิปก่อนกดยืนยัน
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
              className="max-h-56 w-auto rounded-lg object-contain shadow-xs"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className="flex items-center space-x-1 text-emerald-700 font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>ส่งสลิปให้ Host เรียบร้อยแล้ว</span>
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
              ไฟล์ PNG, JPG หรือภาพถ่ายหน้าจอสลิปธนาคาร
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
