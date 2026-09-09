'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Edit3, Layers, Check, Sparkles } from 'lucide-react';
import { Gang, PartyBill, CalculationResult } from '@/lib/types';
import { formatTHB } from '@/lib/calculator';

interface GangManagerProps {
  bill: PartyBill;
  calculation: CalculationResult;
  onUpdateBill: (updated: Partial<PartyBill>) => void;
  readOnly?: boolean;
}

const COLOR_OPTIONS = [
  { key: 'amber', bg: 'bg-amber-100 text-amber-900 border-amber-300', dot: 'bg-amber-500' },
  { key: 'emerald', bg: 'bg-emerald-100 text-emerald-900 border-emerald-300', dot: 'bg-emerald-500' },
  { key: 'cyan', bg: 'bg-cyan-100 text-cyan-900 border-cyan-300', dot: 'bg-cyan-500' },
  { key: 'rose', bg: 'bg-rose-100 text-rose-900 border-rose-300', dot: 'bg-rose-500' },
  { key: 'violet', bg: 'bg-violet-100 text-violet-900 border-violet-300', dot: 'bg-violet-500' },
  { key: 'purple', bg: 'bg-purple-100 text-purple-900 border-purple-300', dot: 'bg-purple-500' },
  { key: 'teal', bg: 'bg-teal-100 text-teal-900 border-teal-300', dot: 'bg-teal-500' },
  { key: 'orange', bg: 'bg-orange-100 text-orange-900 border-orange-300', dot: 'bg-orange-500' },
];

export const GangManager: React.FC<GangManagerProps> = ({
  bill,
  calculation,
  onUpdateBill,
  readOnly = false,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingGangId, setEditingGangId] = useState<string | null>(null);
  const [gangName, setGangName] = useState('');
  const [gangDesc, setGangDesc] = useState('');
  const [selectedColor, setSelectedColor] = useState('amber');

  const handleSaveGang = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gangName.trim()) return;

    if (editingGangId) {
      const updatedGangs = bill.gangs.map((g) =>
        g.id === editingGangId
          ? { ...g, name: gangName.trim(), description: gangDesc.trim(), colorTag: selectedColor }
          : g
      );
      onUpdateBill({ gangs: updatedGangs });
      setEditingGangId(null);
    } else {
      const newGang: Gang = {
        id: `gang-${Date.now()}`,
        name: gangName.trim(),
        description: gangDesc.trim(),
        colorTag: selectedColor,
      };
      onUpdateBill({ gangs: [...bill.gangs, newGang] });
    }

    setGangName('');
    setGangDesc('');
    setIsAdding(false);
  };

  const startEdit = (gang: Gang) => {
    setEditingGangId(gang.id);
    setGangName(gang.name);
    setGangDesc(gang.description || '');
    setSelectedColor(gang.colorTag || 'amber');
    setIsAdding(true);
  };

  const handleDeleteGang = (gangId: string) => {
    if (confirm('คุณต้องการลบแก๊งนี้ใช่หรือไม่? รายการอาหารและสมาชิกที่อยู่ในแก๊งนี้จะถูกย้ายเข้ากองกลาง')) {
      const remainingGangs = bill.gangs.filter((g) => g.id !== gangId);
      const updatedItems = bill.items.map((it) =>
        it.assignedTo === gangId ? { ...it, assignedTo: 'COMMON' } : it
      );
      const updatedMembers = bill.members.map((m) => ({
        ...m,
        gangIds: (m.gangIds || []).filter((id) => id !== gangId),
      }));

      onUpdateBill({
        gangs: remainingGangs,
        items: updatedItems,
        members: updatedMembers,
      });
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center space-x-2">
          <div className="rounded-lg bg-teal-50 p-2 text-teal-700">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              จัดการแก๊งอาหาร (Gang Groups)
            </h3>
            <p className="text-xs text-slate-500">
              สร้างกลุ่มสำหรับแยกบิลเฉพาะกลุ่ม (เช่น แก๊งเหล้า, แก๊งเบียร์, แก๊งของหวาน)
            </p>
          </div>
        </div>

        {!readOnly && !isAdding && (
          <button
            onClick={() => {
              setEditingGangId(null);
              setGangName('');
              setGangDesc('');
              setSelectedColor(COLOR_OPTIONS[bill.gangs.length % COLOR_OPTIONS.length].key);
              setIsAdding(true);
            }}
            className="flex items-center space-x-1.5 rounded-xl bg-teal-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-teal-800 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>สร้างแก๊งใหม่</span>
          </button>
        )}
      </div>

      {/* Add / Edit Form */}
      {isAdding && (
        <form
          onSubmit={handleSaveGang}
          className="mb-5 rounded-xl border border-teal-200 bg-teal-50/50 p-4 transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-teal-900">
              {editingGangId ? 'แก้ไขข้อมูลแก๊ง' : '➕ เพิ่มแก๊งอาหารใหม่'}
            </h4>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setEditingGangId(null);
              }}
              className="text-xs text-slate-500 hover:text-slate-900"
            >
              ยกเลิก
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ชื่อแก๊ง (เช่น แก๊ง A (แอลกอฮอล์), แก๊งไอติม)
              </label>
              <input
                type="text"
                required
                value={gangName}
                onChange={(e) => setGangName(e.target.value)}
                placeholder="ระบุชื่อแก๊ง..."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-teal-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                คำอธิบาย / รายละเอียด
              </label>
              <input
                type="text"
                value={gangDesc}
                onChange={(e) => setGangDesc(e.target.value)}
                placeholder="เช่น คนสั่งเหล้าบ๊วย โซดา มะนาว"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-teal-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Color Tag Picker */}
          <div className="mt-3">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              เลือกสีป้ายแท็ก
            </label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  type="button"
                  key={c.key}
                  onClick={() => setSelectedColor(c.key)}
                  className={`flex items-center space-x-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition ${c.bg} ${
                    selectedColor === c.key ? 'ring-2 ring-teal-700 shadow-xs' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${c.dot}`} />
                  <span className="capitalize">{c.key}</span>
                  {selectedColor === c.key && <Check className="h-3 w-3" />}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setEditingGangId(null);
              }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="rounded-lg bg-teal-700 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-teal-800"
            >
              {editingGangId ? 'บันทึกการแก้ไข' : 'ยืนยันสร้างแก๊ง'}
            </button>
          </div>
        </form>
      )}

      {/* Gang Cards Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {bill.gangs.map((gang) => {
          const breakdown = calculation.gangsBreakdown[gang.id];
          const membersInGang = bill.members.filter((m) => m.gangIds.includes(gang.id));
          const colorObj = COLOR_OPTIONS.find((c) => c.key === gang.colorTag) || COLOR_OPTIONS[0];

          return (
            <div
              key={gang.id}
              className="group relative flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition-all hover:border-slate-300 hover:bg-white hover:shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${colorObj.dot}`} />
                    <h4 className="text-sm font-bold text-slate-900">{gang.name}</h4>
                  </div>
                  {!readOnly && (
                    <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100">
                      <button
                        onClick={() => startEdit(gang)}
                        className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-800"
                        title="แก้ไข"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteGang(gang.id)}
                        className="rounded p-1 text-slate-400 hover:bg-rose-100 hover:text-rose-600"
                        title="ลบแก๊ง"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {gang.description && (
                  <p className="mt-1 text-xs text-slate-500 line-clamp-1">
                    {gang.description}
                  </p>
                )}

                {/* Subtotal & Per person breakdown */}
                <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-white p-2.5 text-xs border border-slate-200 shadow-2xs">
                  <div>
                    <span className="text-[10px] text-slate-500 font-medium">ยอดรวมก้อนนี้</span>
                    <p className="font-bold text-slate-900 font-mono">
                      {formatTHB(breakdown?.effectiveTotal || 0)}
                    </p>
                    <span className="text-[10px] text-slate-400">
                      ({breakdown?.items.length || 0} รายการ)
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-medium">หารเฉลี่ย/คน</span>
                    <p className="font-bold text-teal-700 font-mono">
                      {formatTHB(breakdown?.sharePerPerson || 0)}
                    </p>
                    <span className="text-[10px] text-slate-400">
                      (จาก {breakdown?.payingMembersCount || 0} คนจ่าย)
                    </span>
                  </div>
                </div>
              </div>

              {/* Members in gang tag list */}
              <div className="mt-3 border-t border-slate-200/80 pt-2">
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1 font-medium">
                  <span>สมาชิก ({membersInGang.length} คน):</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {membersInGang.length === 0 ? (
                    <span className="text-[11px] text-slate-400 italic">ยังไม่มีสมาชิกในแก๊งนี้</span>
                  ) : (
                    membersInGang.map((m) => (
                      <span
                        key={m.id}
                        className={`inline-flex items-center space-x-1 rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                          m.isFree
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-white text-slate-700 border border-slate-200'
                        }`}
                      >
                        {m.isFree && <Sparkles className="h-2.5 w-2.5 text-amber-600" />}
                        <span>{m.name}</span>
                        {m.isFree && <span className="font-bold">[F]</span>}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
