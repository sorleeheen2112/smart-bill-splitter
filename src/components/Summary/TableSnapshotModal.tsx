'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Camera, Download, Copy, Share2, Check, X, Loader2, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { toPng, toBlob } from 'html-to-image';
import { PartyBill, CalculationResult } from '@/lib/types';
import { formatTHB } from '@/lib/calculator';

interface TableSnapshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: PartyBill;
  calculation: CalculationResult;
}

export const TableSnapshotModal: React.FC<TableSnapshotModalProps> = ({
  isOpen,
  onClose,
  bill,
  calculation,
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [copiedImage, setCopiedImage] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const printableRef = useRef<HTMLDivElement>(null);

  const payingMembers = bill.members.filter((m) => !m.isFree);
  const verifiedCount = payingMembers.filter((m) => m.paymentStatus === 'VERIFIED').length;
  const pendingCount = payingMembers.filter((m) => m.paymentStatus !== 'VERIFIED').length;

  const generateImage = async () => {
    if (!printableRef.current) return;
    setIsGenerating(true);
    setCopyError(null);
    try {
      // Small timeout to ensure font and DOM rendered
      await new Promise((r) => setTimeout(r, 200));

      const dataUrl = await toPng(printableRef.current, {
        quality: 0.95,
        pixelRatio: 2, // High-res retina crispness
        backgroundColor: '#ffffff',
        cacheBust: true,
      });
      setImageUrl(dataUrl);
    } catch (err) {
      console.error('Failed to capture table image:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      generateImage();
    } else {
      setImageUrl(null);
      setCopiedImage(false);
      setCopyError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.download = `bill-summary-${bill.title.replace(/\s+/g, '_')}-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = imageUrl;
    link.click();
  };

  const handleCopyImage = async () => {
    setCopyError(null);
    try {
      if (!printableRef.current) return;

      const blob = await toBlob(printableRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        cacheBust: true,
      });

      if (!blob) throw new Error('Blob generation failed');

      if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        setCopiedImage(true);
        setTimeout(() => setCopiedImage(false), 3000);
      } else {
        throw new Error('ClipboardItem API not supported');
      }
    } catch (err: any) {
      console.warn('Direct clipboard copy failed:', err);
      // Fallback: trigger download
      handleDownload();
      setCopyError('เบราว์เซอร์ไม่รองรับการคัดลอกรูปภาพลง Clipboard โดยตรง ระบบจึงดาวน์โหลดไฟล์ให้แทนครับ');
    }
  };

  const handleShare = async () => {
    if (!printableRef.current) return;
    try {
      const blob = await toBlob(printableRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });
      if (!blob) return;

      const file = new File([blob], `summary-${bill.id}.png`, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `สรุปยอด: ${bill.title}`,
          text: `ตารางสรุปยอดแยกแก๊งงาน ${bill.title}`,
          files: [file],
        });
      } else {
        handleDownload();
      }
    } catch (e) {
      handleDownload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                แคปรูปภาพตารางสรุปยอด (HD Snapshot)
              </h3>
              <p className="text-xs text-slate-500">
                พร้อมคัดลอกหรือดาวน์โหลดเป็นภาพ PNG คมชัดสูงเพื่อส่งอัปเดตในกลุ่ม LINE
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body: Image Preview */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 flex flex-col items-center justify-center min-h-[300px]">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center space-y-3 py-16 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
              <p className="text-sm font-bold text-slate-700">กำลังเรนเดอร์รูปภาพตารางความละเอียดสูง...</p>
              <p className="text-xs text-slate-500">จัดรูปแบบ ตรวจยอด และคำนวณกราฟิก</p>
            </div>
          ) : imageUrl ? (
            <div className="space-y-3 w-full flex flex-col items-center">
              <div className="overflow-auto max-h-[60vh] max-w-full rounded-xl border border-slate-300 bg-white p-2 shadow-sm">
                <img
                  src={imageUrl}
                  alt="Bill Summary Table Snapshot"
                  className="h-auto max-w-full rounded-lg object-contain"
                />
              </div>
              <p className="text-[11px] text-slate-500 text-center font-medium">
                💡 ทริค: บนคอมพิวเตอร์สามารถกดปุ่ม <strong className="text-slate-800 font-bold">&quot;คัดลอกรูปภาพ&quot;</strong> แล้วกด <strong className="text-teal-700 font-bold">Ctrl+V / Cmd+V</strong> วางในแชท LINE ได้ทันที!
              </p>
            </div>
          ) : (
            <div className="text-center py-12 text-rose-600 space-y-2">
              <AlertCircle className="h-8 w-8 mx-auto" />
              <p className="text-xs font-bold">ไม่สามารถสร้างรูปภาพได้ กรุณาลองใหม่อีกครั้ง</p>
              <button
                onClick={generateImage}
                className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700"
              >
                ลองใหม่
              </button>
            </div>
          )}

          {copyError && (
            <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 text-center max-w-lg">
              {copyError}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-6 py-4">
          <button
            type="button"
            onClick={generateImage}
            disabled={isGenerating}
            className="flex items-center space-x-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
            title="เรนเดอร์รูปใหม่อีกครั้ง"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>รีเฟรชรูป</span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              disabled={isGenerating || !imageUrl}
              className="flex items-center space-x-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition disabled:opacity-50"
            >
              <Share2 className="h-4 w-4 text-slate-500" />
              <span>แชร์ (Share)</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={isGenerating || !imageUrl}
              className="flex items-center space-x-1.5 rounded-xl border border-teal-300 bg-teal-50 px-4 py-2.5 text-xs font-bold text-teal-800 hover:bg-teal-100 shadow-2xs transition disabled:opacity-50"
            >
              <Download className="h-4 w-4 text-teal-600" />
              <span>ดาวน์โหลด PNG</span>
            </button>

            <button
              type="button"
              onClick={handleCopyImage}
              disabled={isGenerating || !imageUrl}
              className={`flex items-center space-x-1.5 rounded-xl px-5 py-2.5 text-xs font-bold shadow-xs transition disabled:opacity-50 ${
                copiedImage
                  ? 'bg-emerald-600 text-white'
                  : 'bg-teal-700 text-white hover:bg-teal-800 active:scale-95'
              }`}
            >
              {copiedImage ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>คัดลอกรูปภาพแล้ว!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>คัดลอกรูปภาพ (วางใน LINE)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* HIDDEN OFFSCREEN RENDER TARGET FOR HIGH-RES SNAPSHOT */}
      <div style={{ position: 'fixed', left: -9999, top: -9999, zIndex: -100 }}>
        <div
          ref={printableRef}
          style={{ width: 1100, backgroundColor: '#ffffff', fontFamily: 'system-ui, -apple-system, sans-serif' }}
          className="p-8 text-slate-900 border border-slate-200"
        >
          {/* Card Header */}
          <div className="flex items-start justify-between border-b-2 border-teal-700 pb-5 mb-6">
            <div>
              <div className="flex items-center space-x-2">
                <span className="rounded-md bg-teal-700 px-2 py-0.5 text-[11px] font-extrabold text-white tracking-wide uppercase">
                  ตารางสรุปยอดปาร์ตี้
                </span>
                <span className="text-xs font-bold text-slate-500">
                  {bill.date} {bill.location ? `• ${bill.location}` : ''}
                </span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 mt-1">
                {bill.title}
              </h1>
              <p className="text-xs text-slate-600 mt-0.5 font-medium">
                ยอดรวมสุทธิ: <strong className="text-teal-900 font-bold text-sm font-mono">{formatTHB(calculation.effectiveGrandTotal)}</strong>
                {(bill.sponsorBudget || 0) > 0 && ` (หักงบกองกลาง ${formatTHB(bill.sponsorBudget || 0)})`}
                {(bill.depositAmount || 0) > 0 && ` (หักมัดจำ ${formatTHB(bill.depositAmount || 0)})`}
              </p>
            </div>

            {/* Payment Badge Summary */}
            <div className="flex flex-col items-end space-y-1.5">
              <div className="flex items-center space-x-2 rounded-xl bg-slate-100 border border-slate-200 px-3.5 py-1.5 text-xs font-bold">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-800">ชำระแล้ว {verifiedCount}/{payingMembers.length} คน</span>
              </div>
              {pendingCount > 0 ? (
                <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
                  ⏳ รอชำระอีก {pendingCount} คน
                </span>
              ) : (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                  🎉 ครบทุกคนแล้ว!
                </span>
              )}
            </div>
          </div>

          {/* Full Table */}
          <table className="w-full text-left text-xs border-collapse rounded-xl overflow-hidden border border-slate-300">
            <thead className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold">
              <tr>
                <th className="p-3 border-r border-slate-300 min-w-[150px]">
                  ชื่อผู้ร่วมงาน
                </th>
                <th className="p-3 border-r border-slate-300 text-right min-w-[110px] text-slate-800">
                  📦 [1] กองกลาง
                </th>
                {bill.gangs.map((gang) => (
                  <th
                    key={gang.id}
                    className="p-3 border-r border-slate-300 text-right min-w-[110px] text-teal-900 bg-teal-50/70"
                  >
                    👥 {gang.name}
                  </th>
                ))}
                <th className="p-3 border-r border-slate-300 text-right min-w-[120px] bg-emerald-100/70 text-emerald-950 font-black">
                  💰 ยอดสุทธิ
                </th>
                <th className="p-3 text-center min-w-[130px]">
                  สถานะการชำระ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {bill.members.map((member) => {
                const breakdown = calculation.membersBreakdown[member.id];

                return (
                  <tr
                    key={member.id}
                    className={
                      member.isFree
                        ? 'bg-amber-50/50'
                        : member.paymentStatus === 'VERIFIED'
                        ? 'bg-emerald-50/30'
                        : ''
                    }
                  >
                    {/* Member Name */}
                    <td className="p-2.5 font-bold text-slate-900 border-r border-slate-300">
                      <div className="flex items-center space-x-1.5">
                        <span>{member.name}</span>
                        {member.isFree && (
                          <span className="inline-flex items-center rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-900 border border-amber-300">
                            <Sparkles className="h-2 w-2 mr-0.5 text-amber-600" />
                            [F] ฟรี
                          </span>
                        )}
                      </div>
                      {member.note && (
                        <p className="text-[9px] text-slate-400 font-normal">
                          {member.note}
                        </p>
                      )}
                    </td>

                    {/* Common Share */}
                    <td className="p-2.5 text-right font-mono border-r border-slate-300 text-slate-700 font-semibold">
                      {member.isFree ? (
                        <span className="text-amber-600 font-bold">0.00</span>
                      ) : (
                        formatTHB(breakdown?.commonShare || 0)
                      )}
                    </td>

                    {/* Each Gang Share */}
                    {bill.gangs.map((gang) => {
                      const isInGang = (member.gangIds || []).includes(gang.id);
                      const gBreakdown = calculation.gangsBreakdown[gang.id];
                      const gangShare = isInGang ? (member.isFree ? 0 : gBreakdown?.sharePerPerson || 0) : null;

                      return (
                        <td
                          key={gang.id}
                          className={`p-2.5 text-right font-mono border-r border-slate-300 ${
                            isInGang ? 'text-teal-900 font-bold bg-teal-50/30' : 'text-slate-400'
                          }`}
                        >
                          {isInGang ? (
                            member.isFree ? (
                              <span className="text-amber-600">0.00</span>
                            ) : (
                              formatTHB(gangShare || 0)
                            )
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      );
                    })}

                    {/* Total Net Payable */}
                    <td className="p-2.5 text-right font-bold text-xs font-mono border-r border-slate-300 bg-emerald-50/40 text-slate-900">
                      {member.isFree ? (
                        <span className="text-amber-700">0.00 👑</span>
                      ) : (
                        formatTHB(breakdown?.totalPayable || 0)
                      )}
                    </td>

                    {/* Status badge */}
                    <td className="p-2.5 text-center">
                      {member.isFree ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-300">
                          👑 เลี้ยงฟรี
                        </span>
                      ) : (member.isPayer || member.id === bill.payerMemberId) ? (
                        <span className="inline-flex items-center space-x-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-900 border border-emerald-300">
                          <span>💳 คนสำรองจ่าย</span>
                        </span>
                      ) : member.paymentStatus === 'VERIFIED' ? (
                        <span className="inline-flex items-center space-x-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-300">
                          <Check className="h-2.5 w-2.5" />
                          <span>ชำระแล้ว</span>
                        </span>
                      ) : member.paymentStatus === 'SLIP_UPLOADED' ? (
                        <span className="inline-flex items-center space-x-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-300">
                          <span>รอตรวจสลิป</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600 border border-slate-300">
                          <span>รอชำระ</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Table Footer: Column Subtotals */}
            <tfoot className="border-t-2 border-slate-400 bg-slate-100 font-bold text-slate-900">
              <tr>
                <td className="p-2.5 border-r border-slate-300">
                  รวมทั้งสิ้น ({bill.members.length} คน)
                </td>
                <td className="p-2.5 text-right font-mono border-r border-slate-300 text-slate-800">
                  {formatTHB(calculation.effectiveCommonTotal)}
                </td>
                {bill.gangs.map((gang) => {
                  const gBreakdown = calculation.gangsBreakdown[gang.id];
                  return (
                    <td
                      key={gang.id}
                      className="p-2.5 text-right font-mono border-r border-slate-300 text-teal-900"
                    >
                      {formatTHB(gBreakdown?.effectiveTotal || 0)}
                    </td>
                  );
                })}
                <td className="p-2.5 text-right font-mono border-r border-slate-300 text-slate-950 font-black">
                  {formatTHB(calculation.sumTotalPayable)}
                </td>
                <td className="p-2.5 text-center text-[10px] text-slate-500 font-normal">
                  {(bill.sponsorBudget || 0) > 0 && <div>งบ +{formatTHB(bill.sponsorBudget || 0)}</div>}
                  {(bill.depositAmount || 0) > 0 && <div>มัดจำ +{formatTHB(bill.depositAmount || 0)}</div>}
                  {!(bill.sponsorBudget || 0) && !(bill.depositAmount || 0) && <span>ยอดลงตัว 100%</span>}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Footer Card Info */}
          <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-3 text-xs text-slate-500">
            <div>
              {bill.promptPayNumber && (
                <span className="font-semibold text-slate-800">
                  📲 PromptPay: {bill.promptPayNumber} {bill.promptPayName ? `(${bill.promptPayName})` : ''}
                </span>
              )}
            </div>
            <div className="text-right text-[11px] text-slate-400 font-medium">
              สร้างด้วย Smart Party Bill Splitter • {new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
