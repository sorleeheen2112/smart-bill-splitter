'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Edit3, Layers, Check, Sparkles, X, Users, CheckCircle2, ArrowRight } from 'lucide-react';
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

  // Generate gangs from members state
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [selectedMemberIdsForGang, setSelectedMemberIdsForGang] = useState<string[]>([]);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

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

  const openGenerateModal = () => {
    if (bill.members.length === 0) {
      alert('ยังไม่มีรายชื่อสมาชิกในบิลนี้ กรุณาเพิ่มสมาชิกในส่วนของ "รายชื่อผู้ร่วมงาน" ด้านล่างก่อน');
      return;
    }
    setSelectedMemberIdsForGang(bill.members.map((m) => m.id));
    setIsGenerateModalOpen(true);
  };

  const toggleSelectMemberForGang = (memberId: string) => {
    if (selectedMemberIdsForGang.includes(memberId)) {
      setSelectedMemberIdsForGang(selectedMemberIdsForGang.filter((id) => id !== memberId));
    } else {
      setSelectedMemberIdsForGang([...selectedMemberIdsForGang, memberId]);
    }
  };

  const handleSelectAllMembersForGang = () => {
    if (selectedMemberIdsForGang.length === bill.members.length) {
      setSelectedMemberIdsForGang([]);
    } else {
      setSelectedMemberIdsForGang(bill.members.map((m) => m.id));
    }
  };

  const handleConfirmGenerateGangs = () => {
    const targetMembers = bill.members.filter((m) => selectedMemberIdsForGang.includes(m.id));
    if (targetMembers.length === 0) return;

    const currentGangs = [...bill.gangs];
    const currentMembers = bill.members.map((m) => ({ ...m, gangIds: [...(m.gangIds || [])] }));
    let createdCount = 0;
    let linkedCount = 0;

    targetMembers.forEach((member, idx) => {
      // Check if gang with this member's name exists (case-insensitive)
      const existingGangIndex = currentGangs.findIndex(
        (g) => g.name.trim().toLowerCase() === member.name.trim().toLowerCase()
      );

      let gangId: string;

      if (existingGangIndex >= 0) {
        gangId = currentGangs[existingGangIndex].id;
      } else {
        // Create new gang
        const colorKey = COLOR_OPTIONS[(currentGangs.length) % COLOR_OPTIONS.length].key;
        const newGang: Gang = {
          id: `gang-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
          name: member.name.trim(),
          description: `บิลเดี่ยวของ ${member.name.trim()}`,
          colorTag: colorKey,
        };
        currentGangs.push(newGang);
        gangId = newGang.id;
        createdCount++;
      }

      // Assign member to this gang
      const memIdx = currentMembers.findIndex((m) => m.id === member.id);
      if (memIdx >= 0) {
        const mem = currentMembers[memIdx];
        if (!mem.gangIds.includes(gangId)) {
          mem.gangIds.push(gangId);
          linkedCount++;
        }
      }
    });

    onUpdateBill({
      gangs: currentGangs,
      members: currentMembers,
    });

    setIsGenerateModalOpen(false);
    setSuccessNotice(`สร้างแก๊งตามสมาชิกสำเร็จ (สร้างใหม่ ${createdCount} แก๊ง, ผูกสมาชิกเข้าแก๊ง ${linkedCount} คน)`);
    setTimeout(() => setSuccessNotice(null), 4000);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
      {/* Toast Notification */}
      {successNotice && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2.5 text-xs font-bold text-emerald-900 shadow-2xs animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{successNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessNotice(null)}
            className="text-emerald-700 hover:text-emerald-900"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

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
              สร้างกลุ่มสำหรับแยกบิลเฉพาะกลุ่ม (เช่น แก๊งเหล้า, อาหารจานเดี่ยวรายคน)
            </p>
          </div>
        </div>

        {!readOnly && !isAdding && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={openGenerateModal}
              className="flex items-center space-x-1.5 rounded-xl border border-teal-300 bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-800 hover:bg-teal-100 transition shadow-2xs"
              title="สร้าง 1 แก๊งต่อ 1 คน และผูกสมาชิกให้อัตโนมัติ สำหรับอาหารจานเดี่ยว"
            >
              <Sparkles className="h-3.5 w-3.5 text-teal-600" />
              <span>Generate กลุ่มตามสมาชิก ({bill.members.length} คน)</span>
            </button>

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
          </div>
        )}
      </div>

      {/* Empty State */}
      {bill.gangs.length === 0 && !isAdding && (
        <div className="mb-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-6 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-700 mb-2">
            <Layers className="h-5 w-5" />
          </div>
          <p className="text-xs font-bold text-slate-800">ยังไม่มีแก๊งอาหารในบิลนี้</p>
          <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
            สร้างแก๊งสำหรับกลุ่มเครื่องดื่ม/ของหวาน หรือกด Generate กลุ่มตามสมาชิก สำหรับมื้ออาหารจานเดี่ยว
          </p>
          {!readOnly && (
            <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2">
              {bill.members.length > 0 && (
                <button
                  type="button"
                  onClick={openGenerateModal}
                  className="inline-flex items-center space-x-1.5 rounded-xl border border-teal-300 bg-teal-50 px-3.5 py-1.5 text-xs font-bold text-teal-800 hover:bg-teal-100 transition shadow-2xs"
                >
                  <Sparkles className="h-3.5 w-3.5 text-teal-600" />
                  <span>Generate กลุ่มตามสมาชิก ({bill.members.length} คน)</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setEditingGangId(null);
                  setGangName('');
                  setGangDesc('');
                  setSelectedColor(COLOR_OPTIONS[0].key);
                  setIsAdding(true);
                }}
                className="inline-flex items-center space-x-1.5 rounded-xl bg-teal-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-teal-800 transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>สร้างแก๊งใหม่</span>
              </button>
            </div>
          )}
        </div>
      )}

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

      {/* Generate Gangs From Members Modal */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center space-x-2">
                <div className="rounded-xl bg-teal-100 p-2 text-teal-800">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    ⚡ Generate กลุ่มตามสมาชิก (อาหารจานเดี่ยว)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    สร้าง 1 แก๊งต่อ 1 คน และผูกสมาชิกเข้าแก๊งของตนเองให้อัตโนมัติ
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGenerateModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="my-3 rounded-xl border border-teal-200 bg-teal-50/70 p-3 text-xs text-teal-950 shrink-0">
              <p className="font-semibold text-teal-900 mb-1">
                💡 สะดวกสุดสำหรับมื้ออาหารจานเดี่ยวที่ราคาไม่เท่ากัน:
              </p>
              <p className="text-[11px] text-teal-800 leading-relaxed">
                ระบบจะสร้างแก๊งตามชื่อของสมาชิกแต่ละคน แล้วผูกสมาชิกเข้าแก๊งตนเองทันที ทำให้คุณสามารถโยนอาหารจานเดี่ยวลงแก๊งของคนนั้นได้เลย
                <span className="block mt-1 font-bold text-teal-950">
                  📌 หมายเหตุ: รายการอาหารที่เป็น &quot;กองกลาง&quot; (COMMON) จะยังคงหารทุกคนเหมือนเดิม
                </span>
              </p>
            </div>

            <div className="flex items-center justify-between py-1 text-xs text-slate-600 shrink-0">
              <span className="font-semibold">
                เลือกสมาชิกที่จะสร้างแก๊ง ({selectedMemberIdsForGang.length} จาก {bill.members.length} คน):
              </span>
              <button
                type="button"
                onClick={handleSelectAllMembersForGang}
                className="font-bold text-teal-700 hover:text-teal-900"
              >
                {selectedMemberIdsForGang.length === bill.members.length ? 'ยกเลิกการเลือกทั้งหมด' : 'เลือกทั้งหมด'}
              </button>
            </div>

            {/* Members Preview List */}
            <div className="overflow-y-auto space-y-2 py-2 pr-1 my-1 max-h-[300px]">
              {bill.members.map((member, idx) => {
                const isSelected = selectedMemberIdsForGang.includes(member.id);
                const existingGang = bill.gangs.find(
                  (g) => g.name.trim().toLowerCase() === member.name.trim().toLowerCase()
                );
                const isAlreadyLinked = existingGang && (member.gangIds || []).includes(existingGang.id);
                const previewColor = COLOR_OPTIONS[(bill.gangs.length + idx) % COLOR_OPTIONS.length];

                return (
                  <div
                    key={member.id}
                    onClick={() => toggleSelectMemberForGang(member.id)}
                    className={`flex items-center justify-between rounded-xl border p-2.5 text-xs transition cursor-pointer select-none ${
                      isSelected
                        ? 'border-teal-300 bg-teal-50/50 hover:bg-teal-50'
                        : 'border-slate-200 bg-white opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // handled by row click
                        className="h-4 w-4 rounded text-teal-700 focus:ring-teal-600 border-slate-300"
                      />
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-100 text-[11px] font-bold text-teal-900">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-slate-900">{member.name}</span>
                          {member.isFree && (
                            <span className="rounded bg-amber-100 px-1 py-0.2 text-[9px] font-bold text-amber-800">
                              [F]
                            </span>
                          )}
                        </div>
                        {member.note && (
                          <span className="text-[10px] text-slate-400">{member.note}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <ArrowRight className="h-3 w-3 text-slate-400" />
                      {isAlreadyLinked ? (
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 border border-slate-200">
                          มีแก๊ง &quot;{existingGang?.name}&quot; แล้ว
                        </span>
                      ) : existingGang ? (
                        <span className="inline-flex items-center rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 border border-amber-200">
                          ผูกเข้าแก๊งเดิม &quot;{existingGang.name}&quot;
                        </span>
                      ) : (
                        <span className={`inline-flex items-center space-x-1 rounded-md px-2 py-0.5 text-[10px] font-semibold border ${previewColor.bg}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${previewColor.dot}`} />
                          <span>สร้างแก๊ง: {member.name}</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-end space-x-2 border-t border-slate-100 pt-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsGenerateModalOpen(false)}
                className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmGenerateGangs}
                disabled={selectedMemberIdsForGang.length === 0}
                className="flex items-center space-x-1.5 rounded-xl bg-teal-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-teal-800 disabled:opacity-40 transition"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>
                  ยืนยัน Generate ({selectedMemberIdsForGang.length} แก๊ง &amp; ผูกสมาชิก)
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
