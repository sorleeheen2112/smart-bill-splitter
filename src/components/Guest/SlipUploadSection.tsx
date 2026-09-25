'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Upload, CheckCircle2, Camera, Clock, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Member } from '@/lib/types';
import { compressSlipImage } from '@/lib/imageUtils';

interface SlipUploadSectionProps {
  member: Member;
  onUploadSlip: (memberId: string, slipUrl: string) => void;
}

export const SlipUploadSection: React.FC<SlipUploadSectionProps> = ({
  member,
  onUploadSlip,
}) => {
  const [preview, setPreview] = useState<string | null>(member.slipUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize preview and file input whenever the active member or member's slipUrl changes
  useEffect(() => {
    setPreview(member.slipUrl || null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [member.id, member.slipUrl]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Compress and downscale slip image to clean ~80KB JPEG to avoid storage quota and payload limits
      const compressedUrl = await compressSlipImage(file, 1000, 1200, 0.75);
      setPreview(compressedUrl);
      submitSlip(compressedUrl);
    } catch (err) {
      console.error('Failed to compress slip:', err);
      // Fallback
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = (event.target?.result as string) || '';
        setPreview(url);
        submitSlip(url);
      };
      reader.readAsDataURL(file);
    }
  };

  const submitSlip = (slipDataUrl: string) => {
    setIsUploading(true);
    setTimeout(() => {
      onUploadSlip(member.id, slipDataUrl);
      setIsUploading(false);
      try {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch (e) {}
    }, 300);
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

      {isUploading ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 py-10 text-center space-y-2">
          <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
          <p className="text-xs font-bold text-slate-700">กำลังประมวลผลและแนบสลิป...</p>
        </div>
      ) : preview ? (
        <div className="space-y-3">
          <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-2">
            <img
              src={preview}
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
              className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 border border-slate-200"
            >
              เปลี่ยนรูปสลิป
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/70 p-8 text-center hover:border-emerald-600 hover:bg-emerald-50/30 cursor-pointer transition"
          >
            <Camera className="h-8 w-8 text-emerald-600 mb-2" />
            <span className="text-xs font-bold text-slate-900 mb-0.5">
              แตะเพื่อถ่ายรูป หรืออัปโหลดสลิปจากอัลบั้ม
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
