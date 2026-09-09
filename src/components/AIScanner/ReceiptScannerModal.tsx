'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  X,
  Check,
  Loader2,
  Key,
  FileCheck,
  Plus,
  Trash2,
  Calculator,
  Layers,
} from 'lucide-react';
import { BillItem, Gang } from '@/lib/types';
import { formatTHB } from '@/lib/calculator';

interface StagedReceiptItem extends BillItem {
  rawPrice: number; // The exact number extracted from receipt
  lineTotal: number;
}

interface ReceiptScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  gangs: Gang[];
  onImportItems: (items: BillItem[]) => void;
}

export const ReceiptScannerModal: React.FC<ReceiptScannerModalProps> = ({
  isOpen,
  onClose,
  gangs,
  onImportItems,
}) => {
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [stagedItems, setStagedItems] = useState<StagedReceiptItem[]>([]);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [priceMode, setPriceMode] = useState<'LINE_TOTAL' | 'UNIT_PRICE'>('LINE_TOTAL');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved Gemini API Key
  useEffect(() => {
    try {
      const saved = localStorage.getItem('smart_bill_gemini_key');
      if (saved) setApiKey(saved);
    } catch {}
  }, []);

  const handleSaveApiKey = (keyVal: string) => {
    setApiKey(keyVal);
    try {
      localStorage.setItem('smart_bill_gemini_key', keyVal);
    } catch {}
  };

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      processReceipt(base64);
    };
    reader.readAsDataURL(file);
  };

  const processReceipt = async (base64Data: string) => {
    setIsLoading(true);
    setStatusMessage('กำลังอ่านภาพใบเสร็จและถอดรายการอาหารด้วย Gemini Vision AI...');

    try {
      const response = await fetch('/api/scan-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Data,
          apiKey: apiKey.trim() || undefined,
        }),
      });

      const data = await response.json();
      if (data.success && Array.isArray(data.items)) {
        const mapped: StagedReceiptItem[] = data.items.map((it: any) => {
          const qty = Math.max(1, Number(it.quantity) || 1);
          const rawP = Number(it.price) || 0;
          const lineT = it.lineTotal ? Number(it.lineTotal) : rawP * qty;

          // Default mode: LINE_TOTAL (if price was lineTotal, unitPrice = lineT / qty)
          const unitPrice = priceMode === 'LINE_TOTAL' && qty > 1 ? lineT / qty : rawP;

          return {
            id: it.id || `item-ai-${Date.now()}-${Math.random()}`,
            name: it.name || 'รายการอาหาร',
            price: unitPrice,
            rawPrice: rawP,
            lineTotal: lineT,
            quantity: qty,
            category: it.category || 'อาหาร',
            assignedTo:
              it.suggestedGang && gangs.some((g) => g.id === it.suggestedGang)
                ? it.suggestedGang
                : 'COMMON',
          };
        });

        setStagedItems(mapped);
        if (data.source === 'gemini-ai') {
          setStatusMessage(
            `✨ สแกนสำเร็จด้วย Gemini AI อ่านได้ครบ ${mapped.length} รายการ! กรุณาตรวจสอบหรือจัดแก๊งด้านล่าง`
          );
        } else {
          setStatusMessage(
            'ℹ️ กำลังแสดงรายการจำลองตัวอย่าง 8 รายการ (เนื่องจากยังไม่ได้ใส่ Gemini API Key หรือเรียก AI ไม่สำเร็จ)'
          );
        }
      } else {
        setStatusMessage('ไม่สามารถอ่านใบเสร็จได้ กรุณาลองใหม่อีกครั้ง');
      }
    } catch (err: any) {
      console.error('Scan error:', err);
      setStatusMessage('เกิดข้อผิดพลาดในการเชื่อมต่อ AI Scanner');
    } finally {
      setIsLoading(false);
    }
  };

  // Switch between Line Total vs Unit Price globally
  const handleTogglePriceMode = (newMode: 'LINE_TOTAL' | 'UNIT_PRICE') => {
    setPriceMode(newMode);
    setStagedItems((prev) =>
      prev.map((it) => {
        const qty = it.quantity || 1;
        if (newMode === 'LINE_TOTAL') {
          // If bill price is line total: unit price = lineTotal / qty
          const newUnitPrice = it.lineTotal / qty;
          return { ...it, price: newUnitPrice };
        } else {
          // If bill price is unit price: unit price = rawPrice, line total = rawPrice * qty
          return {
            ...it,
            price: it.rawPrice,
            lineTotal: it.rawPrice * qty,
          };
        }
      })
    );
  };

  const handleUpdateStagedItem = (id: string, updates: Partial<StagedReceiptItem>) => {
    setStagedItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const updated = { ...it, ...updates };

        // If quantity changed
        if (updates.quantity !== undefined) {
          const newQty = Math.max(1, Number(updates.quantity) || 1);
          updated.quantity = newQty;
          if (priceMode === 'LINE_TOTAL') {
            updated.price = updated.lineTotal / newQty;
          } else {
            updated.lineTotal = updated.price * newQty;
          }
        }

        // If unit price changed
        if (updates.price !== undefined) {
          const newPrice = Number(updates.price) || 0;
          updated.price = newPrice;
          updated.rawPrice = newPrice;
          updated.lineTotal = newPrice * (updated.quantity || 1);
        }

        // If line total changed directly
        if (updates.lineTotal !== undefined) {
          const newLineTotal = Number(updates.lineTotal) || 0;
          updated.lineTotal = newLineTotal;
          updated.price = newLineTotal / (updated.quantity || 1);
          updated.rawPrice = updated.price;
        }

        return updated;
      })
    );
  };

  const handleDeleteStagedItem = (id: string) => {
    setStagedItems(stagedItems.filter((it) => it.id !== id));
  };

  const handleAddCustomStagedItem = () => {
    const newItem: StagedReceiptItem = {
      id: `item-staged-${Date.now()}`,
      name: 'รายการใหม่',
      price: 100,
      rawPrice: 100,
      lineTotal: 100,
      quantity: 1,
      category: 'อาหาร',
      assignedTo: 'COMMON',
    };
    setStagedItems([...stagedItems, newItem]);
  };

  const handleImport = () => {
    if (stagedItems.length === 0) return;
    const finalItems: BillItem[] = stagedItems.map((it) => ({
      id: it.id,
      name: it.name,
      price: it.price,
      quantity: it.quantity,
      category: it.category,
      assignedTo: it.assignedTo,
    }));
    onImportItems(finalItems);
    onClose();
  };

  const totalScannedAmount = stagedItems.reduce(
    (acc, it) => acc + (it.price || 0) * (it.quantity || 1),
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="flex h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 shadow-md">
              <Camera className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-1.5">
                <span>AI Receipt Scanner</span>
                <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-800 border border-teal-200">
                  Gemini AI Vision
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                สแกนใบเสร็จร้านอาหาร แยกแก๊ง และคำนวณยอดตรงตามจริง
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowApiKeyInput(!showApiKeyInput)}
              className="flex items-center space-x-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 shadow-2xs"
              title="ตั้งค่า Gemini API Key"
            >
              <Key className="h-3.5 w-3.5 text-teal-600" />
              <span className="hidden sm:inline">Gemini Key</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* API Key Drawer */}
        {showApiKeyInput && (
          <div className="border-b border-amber-200 bg-amber-50/70 px-6 py-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="text-xs text-amber-900">
                <span className="font-bold">Google Gemini API Key: </span>
                <span>(เว้นว่างไว้จะใช้ Key จาก Environment Variable `GEMINI_API_KEY`)</span>
              </div>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => handleSaveApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full sm:w-64 rounded-lg border border-amber-300 bg-white px-2.5 py-1 text-xs text-slate-900 focus:outline-none font-mono"
              />
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/40">
          {stagedItems.length === 0 && !isLoading && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white p-12 text-center hover:border-teal-600 hover:bg-teal-50/30 cursor-pointer transition shadow-2xs"
              >
                <div className="rounded-full bg-teal-50 p-4 text-teal-700 mb-3 border border-teal-200">
                  <Upload className="h-8 w-8" />
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-1">
                  คลิกเพื่ออัปโหลดรูปบิล หรือถ่ายรูปใบเสร็จ
                </h4>
                <p className="text-xs text-slate-500 max-w-sm">
                  รองรับไฟล์ PNG, JPG, JPEG ใบเสร็จภาษาไทย หรือภาษาอังกฤษ
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {/* Loading Animation */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
              <p className="text-sm font-semibold text-teal-900">{statusMessage}</p>
            </div>
          )}

          {/* Staging Preview Table */}
          {stagedItems.length > 0 && !isLoading && (
            <div className="space-y-3">
              {/* Header Controls & Price Mode Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center space-x-2">
                  <FileCheck className="h-4 w-4 text-emerald-600" />
                  <h4 className="text-sm font-bold text-slate-900">
                    รายการที่สแกนได้ ({stagedItems.length} รายการ)
                  </h4>
                </div>

                {/* Price Format Mode Switcher */}
                <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-600 px-2 flex items-center space-x-1">
                    <Calculator className="h-3 w-3 text-teal-600" />
                    <span>ราคาในบิลคือ:</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => handleTogglePriceMode('LINE_TOTAL')}
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                      priceMode === 'LINE_TOTAL'
                        ? 'bg-teal-700 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="ราคาที่แสดงในบิลคือยอดรวมตามจำนวนแล้ว (ระบบจะคำนวณราคาต่อหน่วยให้)"
                  >
                    ราคารวมจำนวนแล้ว (Line Total)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTogglePriceMode('UNIT_PRICE')}
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                      priceMode === 'UNIT_PRICE'
                        ? 'bg-teal-700 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="ราคาที่แสดงในบิลคือราคาต่อ 1 หน่วย (ยอดรวม = ราคา x จำนวน)"
                  >
                    ราคาต่อหน่วย (Unit Price)
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleAddCustomStagedItem}
                    className="flex items-center space-x-1 rounded-xl border border-slate-300 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>เพิ่มแถว</span>
                  </button>
                  <button
                    onClick={() => setStagedItems([])}
                    className="rounded-xl border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50 shadow-2xs"
                  >
                    สแกนรูปใหม่
                  </button>
                </div>
              </div>

              {statusMessage && (
                <div className="rounded-xl border border-teal-200 bg-teal-50 px-3.5 py-2 text-xs text-teal-900 font-semibold flex items-center space-x-2">
                  <span>{statusMessage}</span>
                </div>
              )}

              {/* Table */}
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
                <div className="max-h-[360px] overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-slate-50 text-slate-700 border-b border-slate-200 font-bold">
                      <tr>
                        <th className="p-2.5">ชื่อเมนูอาหาร</th>
                        <th className="p-2.5 w-16 text-center">จำนวน</th>
                        <th className="p-2.5 w-28">ราคา/หน่วย</th>
                        <th className="p-2.5 w-28">ราคารวมแถวนี้</th>
                        <th className="p-2.5 w-44">จัดเข้ากลุ่ม / แก๊ง</th>
                        <th className="p-2.5 w-8 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {stagedItems.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) =>
                                handleUpdateStagedItem(item.id, { name: e.target.value })
                              }
                              className="w-full rounded border border-transparent bg-transparent px-1.5 py-1 text-xs font-semibold text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateStagedItem(item.id, {
                                  quantity: Math.max(1, Number(e.target.value) || 1),
                                })
                              }
                              className="w-12 text-center rounded border border-transparent bg-transparent px-1 py-1 text-xs font-mono font-bold text-slate-700 focus:border-teal-600 focus:bg-white focus:outline-none"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              step="0.01"
                              value={Number(item.price.toFixed(2))}
                              onChange={(e) =>
                                handleUpdateStagedItem(item.id, {
                                  price: Number(e.target.value) || 0,
                                })
                              }
                              className="w-full rounded border border-transparent bg-transparent px-1.5 py-1 text-xs font-mono font-bold text-teal-800 focus:border-teal-600 focus:bg-white focus:outline-none"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              step="0.01"
                              value={Number(item.lineTotal.toFixed(2))}
                              onChange={(e) =>
                                handleUpdateStagedItem(item.id, {
                                  lineTotal: Number(e.target.value) || 0,
                                })
                              }
                              className="w-full rounded border border-transparent bg-transparent px-1.5 py-1 text-xs font-mono font-bold text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none"
                              title="ราคารวมของรายการนี้ (แก้ไขได้)"
                            />
                          </td>
                          <td className="p-2">
                            <select
                              value={item.assignedTo || 'COMMON'}
                              onChange={(e) =>
                                handleUpdateStagedItem(item.id, {
                                  assignedTo: e.target.value,
                                })
                              }
                              className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-teal-900 font-bold focus:border-teal-600 focus:outline-none shadow-2xs"
                            >
                              <option value="COMMON">📦 [1] กองกลาง / ส่วนรวม</option>
                              {gangs.map((g) => (
                                <option key={g.id} value={g.id}>
                                  👥 {g.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2 text-center">
                            <button
                              onClick={() => handleDeleteStagedItem(item.id)}
                              className="rounded p-1 text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-4">
          <div className="text-xs text-slate-600 flex items-center space-x-3">
            {stagedItems.length > 0 && (
              <div className="flex items-center space-x-2">
                <span>ยอดรวมทั้งบิล:</span>
                <span className="text-sm font-bold font-mono text-teal-900 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                  {formatTHB(totalScannedAmount)}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              disabled={stagedItems.length === 0}
              onClick={handleImport}
              className="flex items-center space-x-1.5 rounded-xl bg-teal-700 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-teal-800 disabled:opacity-40 transition"
            >
              <Check className="h-4 w-4" />
              <span>นำเข้า {stagedItems.length} รายการลงบิล</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
