'use client';

import React, { useState, useEffect } from 'react';
import { X, Copy, Scissors, Layers, Plus, Minus, Info } from 'lucide-react';
import { BillItem } from '@/lib/types';
import { formatTHB } from '@/lib/calculator';

interface DuplicateItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: BillItem | null;
  onConfirmSplit: (item: BillItem, splitQty: number) => void;
  onConfirmSplitAll: (item: BillItem) => void;
  onConfirmClone: (item: BillItem) => void;
}

export const DuplicateItemModal: React.FC<DuplicateItemModalProps> = ({
  isOpen,
  onClose,
  item,
  onConfirmSplit,
  onConfirmSplitAll,
  onConfirmClone,
}) => {
  const [customQty, setCustomQty] = useState<number>(1);

  useEffect(() => {
    if (item) {
      setCustomQty(1);
    }
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  const currentQty = item.quantity || 1;
  const maxSplitQty = Math.max(1, currentQty - 1);

  const handleCustomSplit = () => {
    if (customQty <= 0 || customQty >= currentQty) return;
    onConfirmSplit(item, customQty);
    onClose();
  };

  const handleSplitOne = () => {
    onConfirmSplit(item, 1);
    onClose();
  };

  const handleSplitAll = () => {
    onConfirmSplitAll(item);
    onClose();
  };

  const handleClone = () => {
    onConfirmClone(item);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-200 shadow-2xs">
              <Copy className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                แยก / ทำสำเนารายการอาหาร
              </h3>
              <p className="text-[11px] text-slate-500">
                จัดการรายการที่มีมากกว่า 1 ชิ้นเพื่อแบ่งให้สมาชิก
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Current Item Summary */}
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 shadow-2xs">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900">{item.name}</h4>
              <p className="mt-0.5 text-xs text-slate-600 font-medium">
                ราคาชิ้นละ {formatTHB(item.price)}
                {item.category && <span className="text-slate-400"> • {item.category}</span>}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center rounded-md bg-teal-100/80 px-2 py-0.5 text-xs font-bold text-teal-800 border border-teal-200 font-mono">
                {currentQty} ชิ้น
              </span>
              <p className="mt-1 text-xs font-mono font-bold text-slate-900">
                รวม {formatTHB(item.price * currentQty)}
              </p>
            </div>
          </div>
        </div>

        {/* Action Options */}
        <div className="mt-4 space-y-2.5">
          {/* Option 1: Split 1 piece */}
          <button
            type="button"
            onClick={handleSplitOne}
            className="group flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-left hover:border-teal-500 hover:bg-teal-50/40 hover:shadow-xs transition"
          >
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700 group-hover:bg-teal-600 group-hover:text-white transition">
                <Copy className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 group-hover:text-teal-900">
                  แยกออกมา 1 ชิ้น
                </p>
                <p className="text-[11px] text-slate-500">
                  รายการเดิมเหลือ {currentQty - 1} ชิ้น + สร้างรายการใหม่ 1 ชิ้น
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-teal-700 shrink-0 ml-2">แยกทันที</span>
          </button>

          {/* Option 2: Split all into 1 piece each */}
          {currentQty > 2 && (
            <button
              type="button"
              onClick={handleSplitAll}
              className="group flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-left hover:border-teal-500 hover:bg-teal-50/40 hover:shadow-xs transition"
            >
              <div className="flex items-center space-x-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition">
                  <Scissors className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 group-hover:text-teal-900">
                    แยกเป็นชิ้นละ 1 ทั้งหมด ({currentQty} รายการ)
                  </p>
                  <p className="text-[11px] text-slate-500">
                    แตกเป็นชิ้นเดี่ยวทั้งหมด เพื่อย้ายให้แต่ละคนได้อิสระ
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-teal-700 shrink-0 ml-2">แตกทั้งหมด</span>
            </button>
          )}

          {/* Option 3: Custom split quantity */}
          {currentQty > 2 && (
            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    ระบุจำนวนที่ต้องการแยก
                  </p>
                  <p className="text-[11px] text-slate-500">
                    แยก {customQty} ชิ้น (เหลือเดิม {currentQty - customQty} ชิ้น)
                  </p>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    disabled={customQty <= 1}
                    onClick={() => setCustomQty((q) => Math.max(1, q - 1))}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition"
                  >
                    <Minus className="h-3 w-3" />
                  </button>

                  <span className="w-8 text-center text-xs font-bold font-mono text-slate-900">
                    {customQty}
                  </span>

                  <button
                    type="button"
                    disabled={customQty >= maxSplitQty}
                    onClick={() => setCustomQty((q) => Math.min(maxSplitQty, q + 1))}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition"
                  >
                    <Plus className="h-3 w-3" />
                  </button>

                  <button
                    type="button"
                    onClick={handleCustomSplit}
                    className="ml-1 rounded-lg bg-teal-700 hover:bg-teal-800 text-white px-2.5 py-1 text-xs font-bold transition shadow-2xs cursor-pointer"
                  >
                    แยก {customQty} ชิ้น
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer info & Clone Option */}
        <div className="mt-4 border-t border-slate-100 pt-3 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-1 text-[11px] text-slate-500">
            <Info className="h-3 w-3 shrink-0 text-slate-400" />
            <span>ยอดรวมทั้งบิลจะยังคงเดิม</span>
          </div>

          <button
            type="button"
            onClick={handleClone}
            className="text-[11px] font-semibold text-teal-700 hover:text-teal-900 hover:underline cursor-pointer"
            title="สร้างรายการใหม่ขนาดเท่าเดิมโดยไม่ลดจำนวนรายการเดิม"
          >
            📋 ทำสำเนาเพิ่มอีกรายการ (ไม่ลดจำนวนเดิม)
          </button>
        </div>
      </div>
    </div>
  );
};
