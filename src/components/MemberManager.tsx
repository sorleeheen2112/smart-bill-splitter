'use client';

import React, { useState } from 'react';
import { Users, UserPlus, Crown, Trash2, Edit3, Check, Search, Sparkles, FileText, CreditCard } from 'lucide-react';
import { Member, PartyBill, CalculationResult } from '@/lib/types';
import { formatTHB } from '@/lib/calculator';

interface MemberManagerProps {
  bill: PartyBill;
  calculation: CalculationResult;
  onUpdateBill: (updated: Partial<PartyBill>) => void;
  readOnly?: boolean;
}

export const MemberManager: React.FC<MemberManagerProps> = ({
  bill,
  calculation,
  onUpdateBill,
  readOnly = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isBatchAdding, setIsBatchAdding] = useState(false);
  const [batchNamesText, setBatchNamesText] = useState('');

  // Single Member Form State
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [selectedGangIds, setSelectedGangIds] = useState<string[]>([]);
  const [isFree, setIsFree] = useState(false);
  const [note, setNote] = useState('');

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingMemberId) {
      const updatedMembers = bill.members.map((m) =>
        m.id === editingMemberId
          ? {
              ...m,
              name: name.trim(),
              gangIds: selectedGangIds,
              isFree,
              note: note.trim(),
            }
          : m
      );
      onUpdateBill({ members: updatedMembers });
      setEditingMemberId(null);
    } else {
      const newMember: Member = {
        id: `m-${Date.now()}`,
        name: name.trim(),
        gangIds: selectedGangIds,
        isFree,
        paymentStatus: isFree ? 'VERIFIED' : 'PENDING',
        note: note.trim(),
      };
      onUpdateBill({ members: [...bill.members, newMember] });
    }

    setName('');
    setSelectedGangIds([]);
    setIsFree(false);
    setNote('');
    setIsAdding(false);
  };

  const handleBatchAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchNamesText.trim()) return;

    const names = batchNamesText
      .split(/[\n,]+/)
      .map((n) => n.trim())
      .filter((n) => n.length > 0);

    const newMembers: Member[] = names.map((n, idx) => ({
      id: `m-batch-${Date.now()}-${idx}`,
      name: n,
      gangIds: [],
      isFree: false,
      paymentStatus: 'PENDING',
    }));

    onUpdateBill({ members: [...bill.members, ...newMembers] });
    setBatchNamesText('');
    setIsBatchAdding(false);
  };

  const startEdit = (m: Member) => {
    setEditingMemberId(m.id);
    setName(m.name);
    setSelectedGangIds(m.gangIds || []);
    setIsFree(m.isFree);
    setNote(m.note || '');
    setIsAdding(true);
    setIsBatchAdding(false);
  };

  const handleDeleteMember = (id: string) => {
    if (confirm('คุณต้องการลบผู้ร่วมงานคนนี้ใช่หรือไม่?')) {
      onUpdateBill({
        members: bill.members.filter((m) => m.id !== id),
      });
    }
  };

  const toggleGangSelection = (gangId: string) => {
    if (selectedGangIds.includes(gangId)) {
      setSelectedGangIds(selectedGangIds.filter((id) => id !== gangId));
    } else {
      setSelectedGangIds([...selectedGangIds, gangId]);
    }
  };

  const toggleQuickGangForMember = (memberId: string, gangId: string) => {
    const updated = bill.members.map((m) => {
      if (m.id === memberId) {
        const hasGang = (m.gangIds || []).includes(gangId);
        const newGangs = hasGang
          ? m.gangIds.filter((id) => id !== gangId)
          : [...(m.gangIds || []), gangId];
        return { ...m, gangIds: newGangs };
      }
      return m;
    });
    onUpdateBill({ members: updated });
  };

  const toggleQuickFreeForMember = (memberId: string) => {
    const updated = bill.members.map((m) => {
      if (m.id === memberId) {
        const newFree = !m.isFree;
        return {
          ...m,
          isFree: newFree,
          paymentStatus: newFree ? 'VERIFIED' : m.paymentStatus,
        };
      }
      return m;
    });
    onUpdateBill({ members: updated });
  };

  const togglePayer = (memberId: string) => {
    if (readOnly) return;
    const isCurrentlyPayer = bill.payerMemberId === memberId;
    const nextPayerId = isCurrentlyPayer ? undefined : memberId;
    const updated = bill.members.map((m) => {
      if (m.id === memberId) {
        return {
          ...m,
          isPayer: !isCurrentlyPayer,
          paymentStatus: !isCurrentlyPayer ? ('VERIFIED' as const) : m.paymentStatus,
        };
      }
      return { ...m, isPayer: false };
    });
    const selectedMember = bill.members.find((m) => m.id === nextPayerId);
    onUpdateBill({
      payerMemberId: nextPayerId,
      members: updated,
      promptPayName: selectedMember ? selectedMember.name : bill.promptPayName,
    });
  };

  const filteredMembers = bill.members.filter((m) =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center space-x-2">
          <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              รายชื่อผู้ร่วมงาน ({bill.members.length} คน)
            </h3>
            <p className="text-xs text-slate-500">
              กำหนดแก๊งที่แต่ละคนสังกัด และแท็ก 👑 [F] สำหรับแขกที่กินฟรี
            </p>
          </div>
        </div>

        {!readOnly && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setIsBatchAdding(!isBatchAdding);
                setIsAdding(false);
              }}
              className="flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
            >
              <FileText className="h-3.5 w-3.5 text-slate-500" />
              <span>วางหลายชื่อพร้อมกัน (Batch)</span>
            </button>

            <button
              onClick={() => {
                setEditingMemberId(null);
                setName('');
                setSelectedGangIds([]);
                setIsFree(false);
                setNote('');
                setIsAdding(true);
                setIsBatchAdding(false);
              }}
              className="flex items-center space-x-1.5 rounded-xl bg-teal-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-teal-800 transition"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>เพิ่มคนใหม่</span>
            </button>
          </div>
        )}
      </div>

      {/* Batch Add Area */}
      {isBatchAdding && (
        <form
          onSubmit={handleBatchAdd}
          className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-emerald-900">
              📋 นำเข้ารายชื่อแบบหลายคน (คัดลอกจาก LINE ได้เลย)
            </h4>
            <button
              type="button"
              onClick={() => setIsBatchAdding(false)}
              className="text-xs text-slate-500 hover:text-slate-900"
            >
              ยกเลิก
            </button>
          </div>
          <p className="text-xs text-slate-600 mb-2">
            ใส่ชื่อคั่นด้วยเครื่องหมายจุลภาค (,) หรือขึ้นบรรทัดใหม่ เช่น: สอ, มุก, บุ๊ค, แชมป์, แคท
          </p>
          <textarea
            rows={3}
            value={batchNamesText}
            onChange={(e) => setBatchNamesText(e.target.value)}
            placeholder="สอ&#10;มุก&#10;บุ๊ค&#10;แชมป์&#10;แคท"
            className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:outline-none"
          />
          <div className="mt-3 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsBatchAdding(false)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700"
            >
              เพิ่มรายชื่อทั้งหมด
            </button>
          </div>
        </form>
      )}

      {/* Single Add / Edit Form */}
      {isAdding && (
        <form
          onSubmit={handleSaveMember}
          className="mb-5 rounded-xl border border-teal-200 bg-teal-50/50 p-4 transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-teal-900">
              {editingMemberId ? 'แก้ไขข้อมูลผู้ร่วมงาน' : '👤 เพิ่มสมาชิกใหม่'}
            </h4>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setEditingMemberId(null);
              }}
              className="text-xs text-slate-500 hover:text-slate-900"
            >
              ยกเลิก
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ชื่อผู้ร่วมงาน
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น มุก, บุ๊ค, สอ"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-teal-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                หมายเหตุ (ถ้ามี)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="เช่น แขกพิเศษ, น้องใหม่"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-teal-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Tag F (Free VIP) Toggle */}
          <div className="mt-3.5 rounded-xl border border-amber-300 bg-amber-50/60 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Crown className="h-4 w-4 text-amber-600" />
                <div>
                  <span className="text-xs font-bold text-amber-900">
                    👑 เลี้ยงฟรี / แขก VIP (แท็ก F)
                  </span>
                  <p className="text-[11px] text-amber-700">
                    ยอดชำระ = 0 บาท และถูกหักออกจากตัวหารกลุ่มอัตโนมัติ
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFree(!isFree)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isFree ? 'bg-amber-500' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isFree ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Gang Selection */}
          <div className="mt-3.5">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              เลือกแก๊งอาหารที่คนนี้ร่วมกิน (เลือกได้มากกว่า 1 แก๊ง)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {bill.gangs.map((gang) => {
                const isSelected = selectedGangIds.includes(gang.id);
                return (
                  <button
                    type="button"
                    key={gang.id}
                    onClick={() => toggleGangSelection(gang.id)}
                    className={`flex items-center space-x-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                      isSelected
                        ? 'border-teal-600 bg-teal-50 text-teal-900 font-bold'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                    }`}
                  >
                    <span>{gang.name}</span>
                    {isSelected && <Check className="h-3 w-3 text-teal-700" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setEditingMemberId(null);
              }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="rounded-lg bg-teal-700 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-teal-800"
            >
              {editingMemberId ? 'บันทึกการแก้ไข' : 'บันทึกสมาชิก'}
            </button>
          </div>
        </form>
      )}

      {/* Search Bar */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="ค้นหาชื่อเพื่อน..."
          className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:outline-none shadow-2xs"
        />
      </div>

      {/* Member Cards Grid */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {filteredMembers.map((member) => {
          const breakdown = calculation.membersBreakdown[member.id];

          return (
            <div
              key={member.id}
              className={`group flex flex-col justify-between rounded-xl border p-3.5 transition-all ${
                member.isFree
                  ? 'border-amber-300 bg-amber-50/40 hover:border-amber-400'
                  : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-white hover:shadow-sm'
              }`}
            >
              <div>
                {/* Header: Name, Tag F, Status, Edit/Delete */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-100 text-xs font-bold text-teal-900">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="text-sm font-bold text-slate-900">
                          {member.name}
                        </span>
                        {(member.isPayer || member.id === bill.payerMemberId) && (
                          <span className="inline-flex items-center space-x-0.5 rounded bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-900 border border-emerald-300">
                            <CreditCard className="h-2.5 w-2.5 text-emerald-700 mr-0.5" />
                            <span>💳 คนสำรองจ่าย</span>
                          </span>
                        )}
                        {member.isFree && (
                          <span className="inline-flex items-center space-x-0.5 rounded bg-amber-100 px-1.5 py-0.2 text-[10px] font-bold text-amber-900 border border-amber-300">
                            <Crown className="h-2.5 w-2.5 text-amber-600 mr-0.5" />
                            <span>[F] เลี้ยงฟรี</span>
                          </span>
                        )}
                      </div>
                      {member.note && (
                        <p className="text-[11px] text-slate-500 line-clamp-1">
                          {member.note}
                        </p>
                      )}
                    </div>
                  </div>

                  {!readOnly && (
                    <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100">
                      <button
                        onClick={() => togglePayer(member.id)}
                        className={`rounded p-1 text-xs transition ${
                          member.isPayer || member.id === bill.payerMemberId
                            ? 'text-emerald-700 bg-emerald-100'
                            : 'text-slate-400 hover:text-emerald-700 hover:bg-emerald-50'
                        }`}
                        title={
                          member.isPayer || member.id === bill.payerMemberId
                            ? 'คนนี้คือผู้สำรองจ่าย'
                            : 'ตั้งคนนี้เป็นผู้สำรองจ่าย (จ่ายหน้าร้าน)'
                        }
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => toggleQuickFreeForMember(member.id)}
                        className={`rounded p-1 text-xs transition ${
                          member.isFree
                            ? 'text-amber-600 hover:text-amber-800'
                            : 'text-slate-400 hover:text-amber-600'
                        }`}
                        title={member.isFree ? 'ยกเลิกแท็ก F' : 'ตั้งเป็นแท็ก F (กินฟรี)'}
                      >
                        <Crown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => startEdit(member)}
                        className="rounded p-1 text-slate-400 hover:text-slate-900 hover:bg-slate-200"
                        title="แก้ไข"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteMember(member.id)}
                        className="rounded p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        title="ลบ"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Amount Payable */}
                <div className="mt-2.5 flex items-center justify-between rounded-lg bg-white px-2.5 py-1.5 border border-slate-200 shadow-2xs">
                  <span className="text-xs text-slate-500 font-medium">ยอดที่ต้องชำระ:</span>
                  <span
                    className={`text-xs font-bold font-mono ${
                      member.isFree
                        ? 'text-amber-700'
                        : breakdown?.totalPayable > 0
                        ? 'text-emerald-700'
                        : 'text-slate-700'
                    }`}
                  >
                    {member.isFree ? '0.00 บาท (ฟรี)' : formatTHB(breakdown?.totalPayable || 0)}
                  </span>
                </div>
              </div>

              {/* Quick Gang Toggle Chips */}
              <div className="mt-2.5 border-t border-slate-200/80 pt-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 mr-0.5 font-medium">แก๊ง:</span>
                  {bill.gangs.map((gang) => {
                    const isInGang = (member.gangIds || []).includes(gang.id);
                    if (readOnly && !isInGang) return null;
                    return (
                      <button
                        key={gang.id}
                        type="button"
                        disabled={readOnly}
                        onClick={() => !readOnly && toggleQuickGangForMember(member.id, gang.id)}
                        className={`inline-flex items-center space-x-1 rounded-md px-2 py-0.5 text-[11px] font-semibold transition ${
                          isInGang
                            ? 'bg-teal-100 text-teal-900 border border-teal-300 shadow-2xs'
                            : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300 hover:text-slate-800 hover:bg-slate-50'
                        } ${readOnly ? 'cursor-default' : ''}`}
                        title={readOnly ? gang.name : `คลิกเพื่อ ${isInGang ? 'นำออกจาก' : 'เพิ่มเข้า'} ${gang.name}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                            gang.colorTag === 'emerald'
                              ? 'bg-emerald-500'
                              : gang.colorTag === 'cyan'
                              ? 'bg-cyan-500'
                              : gang.colorTag === 'rose'
                              ? 'bg-rose-500'
                              : gang.colorTag === 'violet'
                              ? 'bg-violet-500'
                              : gang.colorTag === 'purple'
                              ? 'bg-purple-500'
                              : gang.colorTag === 'teal'
                              ? 'bg-teal-500'
                              : gang.colorTag === 'orange'
                              ? 'bg-orange-500'
                              : 'bg-amber-500'
                          }`}
                        />
                        <span>{gang.name}</span>
                      </button>
                    );
                  })}
                  {bill.gangs.length === 0 && (
                    <span className="text-[10px] text-slate-400 italic">ยังไม่มีแก๊ง (กองกลางเท่านั้น)</span>
                  )}
                  {readOnly && (member.gangIds || []).length === 0 && bill.gangs.length > 0 && (
                    <span className="text-[10px] text-slate-400 italic">กองกลางเท่านั้น</span>
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
