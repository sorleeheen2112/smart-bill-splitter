'use client';

import React, { useState } from 'react';
import { CheckSquare, Square, Trash2, Edit2, ArrowRight, Filter } from 'lucide-react';
import { BillItem, PartyBill, CalculationResult } from '@/lib/types';
import { formatTHB, getItemEffectivePrice } from '@/lib/calculator';

interface TableViewProps {
  bill: PartyBill;
  calculation: CalculationResult;
  onUpdateBill: (updated: Partial<PartyBill>) => void;
  onEditItem: (item: BillItem) => void;
  readOnly?: boolean;
}

export const TableView: React.FC<TableViewProps> = ({
  bill,
  calculation,
  onUpdateBill,
  onEditItem,
  readOnly = false,
}) => {
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [filterGang, setFilterGang] = useState<string>('ALL');
  const [targetGangToBatchMove, setTargetGangToBatchMove] = useState<string>('COMMON');

  const filteredItems = bill.items.filter((item) => {
    if (filterGang === 'ALL') return true;
    if (filterGang === 'COMMON') return !item.assignedTo || item.assignedTo === 'COMMON';
    return item.assignedTo === filterGang;
  });

  const handleToggleSelect = (id: string) => {
    if (selectedItemIds.includes(id)) {
      setSelectedItemIds(selectedItemIds.filter((itemId) => itemId !== id));
    } else {
      setSelectedItemIds([...selectedItemIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedItemIds.length === filteredItems.length) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(filteredItems.map((i) => i.id));
    }
  };

  const handleBatchMove = () => {
    if (selectedItemIds.length === 0) return;

    const updated = bill.items.map((item) => {
      if (selectedItemIds.includes(item.id)) {
        return {
          ...item,
          assignedTo: targetGangToBatchMove,
        };
      }
      return item;
    });

    onUpdateBill({ items: updated });
    setSelectedItemIds([]);
  };

  const handleBatchDelete = () => {
    if (selectedItemIds.length === 0) return;
    if (confirm(`คุณต้องการลบ ${selectedItemIds.length} รายการที่เลือกใช่หรือไม่?`)) {
      onUpdateBill({
        items: bill.items.filter((it) => !selectedItemIds.includes(it.id)),
      });
      setSelectedItemIds([]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white p-3 border border-slate-200 shadow-2xs">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-slate-500" />
          <span className="text-xs font-bold text-slate-700">กรองตามกลุ่ม:</span>
          <select
            value={filterGang}
            onChange={(e) => setFilterGang(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-900 focus:border-teal-600 focus:outline-none"
          >
            <option value="ALL">ทั้งหมด ({bill.items.length} รายการ)</option>
            <option value="COMMON">📦 [1] ส่วนรวม ({bill.items.filter((i) => !i.assignedTo || i.assignedTo === 'COMMON').length})</option>
            {bill.gangs.map((g) => (
              <option key={g.id} value={g.id}>
                👥 {g.name} ({bill.items.filter((i) => i.assignedTo === g.id).length})
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          แสดง <span className="font-bold text-slate-900">{filteredItems.length}</span> รายการ
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                {!readOnly && (
                  <th className="p-3 w-10 text-center">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-slate-400 hover:text-slate-800"
                    >
                      {selectedItemIds.length > 0 && selectedItemIds.length === filteredItems.length ? (
                        <CheckSquare className="h-4 w-4 text-teal-700" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </th>
                )}
                <th className="p-3">รายการอาหาร / เครื่องดื่ม</th>
                <th className="p-3">หมวดหมู่</th>
                <th className="p-3 text-right">ราคา/หน่วย</th>
                <th className="p-3 text-center">จำนวน</th>
                <th className="p-3 text-right">ราคารวม (VAT)</th>
                <th className="p-3">กลุ่ม / แก๊งที่รับผิดชอบ</th>
                {!readOnly && <th className="p-3 text-center">จัดการ</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={readOnly ? 6 : 8} className="p-8 text-center text-slate-400 font-medium">
                    ไม่พบรายการอาหารในหมวดหมู่นี้
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isSelected = selectedItemIds.includes(item.id);
                  const effPrice = getItemEffectivePrice(item, bill.vatMode, bill.vatRate);
                  const currentGang = bill.gangs.find((g) => g.id === item.assignedTo);

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors ${
                        isSelected ? 'bg-teal-50/70' : 'hover:bg-slate-50'
                      }`}
                    >
                      {!readOnly && (
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleSelect(item.id)}
                            className="text-slate-400 hover:text-slate-800"
                          >
                            {isSelected ? (
                              <CheckSquare className="h-4 w-4 text-teal-700" />
                            ) : (
                              <Square className="h-4 w-4" />
                            )}
                          </button>
                        </td>
                      )}
                      <td className="p-3 font-bold text-slate-900">
                        {item.name}
                      </td>
                      <td className="p-3 text-slate-500 font-medium">
                        {item.category || 'อาหาร'}
                      </td>
                      <td className="p-3 text-right font-mono font-semibold">
                        {item.price.toFixed(2)}
                      </td>
                      <td className="p-3 text-center">
                        <span className="rounded bg-slate-100 px-2 py-0.5 font-mono font-bold text-slate-700 border border-slate-200">
                          {item.quantity || 1}
                        </span>
                      </td>
                      <td className="p-3 text-right font-bold text-slate-900 font-mono">
                        {formatTHB(effPrice)}
                      </td>
                      <td className="p-3">
                        {readOnly ? (
                          <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold border ${
                            item.assignedTo === 'COMMON' || !item.assignedTo
                              ? 'bg-slate-100 text-slate-800 border-slate-200'
                              : 'bg-teal-50 text-teal-900 border-teal-200'
                          }`}>
                            {item.assignedTo === 'COMMON' || !item.assignedTo
                              ? '📦 [1] กองกลาง / ส่วนรวม'
                              : `👥 ${currentGang?.name || item.assignedTo}`}
                          </span>
                        ) : (
                          <select
                            value={item.assignedTo || 'COMMON'}
                            onChange={(e) => {
                              const updated = bill.items.map((it) =>
                                it.id === item.id ? { ...it, assignedTo: e.target.value } : it
                              );
                              onUpdateBill({ items: updated });
                            }}
                            className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-teal-900 font-bold focus:border-teal-600 focus:outline-none shadow-2xs"
                          >
                            <option value="COMMON">📦 [1] กองกลาง / ส่วนรวม</option>
                            {bill.gangs.map((g) => (
                              <option key={g.id} value={g.id}>
                                👥 {g.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      {!readOnly && (
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => onEditItem(item)}
                              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-800"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                onUpdateBill({
                                  items: bill.items.filter((it) => it.id !== item.id),
                                });
                              }}
                              className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sticky Batch Action Bar */}
      {selectedItemIds.length > 0 && (
        <div className="sticky bottom-4 z-30 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-teal-300 bg-white/95 p-4 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center space-x-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-700 text-xs font-bold text-white">
              {selectedItemIds.length}
            </span>
            <span className="text-xs font-bold text-slate-900">
              รายการที่เลือกแล้ว
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-600 font-medium">ย้ายเข้าร่วม:</span>
            <select
              value={targetGangToBatchMove}
              onChange={(e) => setTargetGangToBatchMove(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-teal-900 font-bold focus:outline-none shadow-2xs"
            >
              <option value="COMMON">📦 [1] กองกลาง / ส่วนรวม</option>
              {bill.gangs.map((g) => (
                <option key={g.id} value={g.id}>
                  👥 {g.name}
                </option>
              ))}
            </select>

            <button
              onClick={handleBatchMove}
              className="flex items-center space-x-1 rounded-xl bg-teal-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-teal-800 transition"
            >
              <ArrowRight className="h-3.5 w-3.5" />
              <span>ย้ายทันที</span>
            </button>

            <button
              onClick={handleBatchDelete}
              className="flex items-center space-x-1 rounded-xl bg-rose-50 px-3.5 py-1.5 text-xs font-bold text-rose-700 border border-rose-200 hover:bg-rose-100 transition"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>ลบรายการที่เลือก</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
