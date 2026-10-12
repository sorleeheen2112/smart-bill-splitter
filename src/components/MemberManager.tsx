'use client';

import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Crown,
  Trash2,
  Edit3,
  Check,
  Search,
  Sparkles,
  FileText,
  CreditCard,
  X,
  ArrowRight,
  CheckCircle2,
  Layers,
} from 'lucide-react';
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

  // Generate members from gangs state
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [selectedGangIdsForMember, setSelectedGangIdsForMember] = useState<string[]>([]);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

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

  const openGenerateModal = () => {
    if (bill.gangs.length === 0) {
      alert('ยังไม่มีแก๊งในบิลนี้ กรุณาสร้างแก๊งในส่วนของ "จัดการแก๊งอาหาร" ด้านบนก่อน');
      return;
    }
    setSelectedGangIdsForMember(bill.gangs.map((g) => g.id));
    setIsGenerateModalOpen(true);
  };

  const toggleSelectGangForMember = (gangId: string) => {
    if (selectedGangIdsForMember.includes(gangId)) {
      setSelectedGangIdsForMember(selectedGangIdsForMember.filter((id) => id !== gangId));
    } else {
      setSelectedGangIdsForMember([...selectedGangIdsForMember, gangId]);
    }
  };

  const handleSelectAllGangsForMember = () => {
    if (selectedGangIdsForMember.length === bill.gangs.length) {
      setSelectedGangIdsForMember([]);
    } else {
      setSelectedGangIdsForMember(bill.gangs.map((g) => g.id));
    }
  };

  const handleConfirmGenerateMembers = () => {
    const targetGangs = bill.gangs.filter((g) => selectedGangIdsForMember.includes(g.id));
    if (targetGangs.length === 0) return;

    const currentMembers = bill.members.map((m) => ({ ...m, gangIds: [...(m.gangIds || [])] }));
    let createdCount = 0;
    let linkedCount = 0;

    targetGangs.forEach((gang, idx) => {
      // Check if member with gang name already exists (case-insensitive)
      const existingMemberIndex = currentMembers.findIndex(
        (m) => m.name.trim().toLowerCase() === gang.name.trim().toLowerCase()
      );

      if (existingMemberIndex >= 0) {
        // Member exists: ensure gang is in gangIds
        const mem = currentMembers[existingMemberIndex];
        if (!mem.gangIds.includes(gang.id)) {
          mem.gangIds.push(gang.id);
          linkedCount++;
        }
      } else {
        // Create new member
        const newMember: Member = {
          id: `m-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
          name: gang.name.trim(),
          gangIds: [gang.id],
          isFree: false,
          paymentStatus: 'PENDING',
        };
        currentMembers.push(newMember);
        createdCount++;
        linkedCount++;
      }
    });

    onUpdateBill({
      members: currentMembers,
    });

    setIsGenerateModalOpen(false);
    setSuccessNotice(`สร้างสมาชิกตามแก๊งสำเร็จ (สร้างใหม่ ${createdCount} คน, ผูกเข้าแก๊ง ${linkedCount} รายการ)`);
    setTimeout(() => setSuccessNotice(null), 4000);
  };

  const filteredMembers = bill.members.filter((m) =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              type="button"
              onClick={openGenerateModal}
              className="flex items-center space-x-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition shadow-2xs"
              title="สร้างสมาชิกอัตโนมัติตามแก๊ง (1 แก๊ง = 1 คน) พร้อมผูกเข้าแก๊งทันที"
            >
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              <span>Generate สมาชิกตามกลุ่ม ({bill.gangs.length} แก๊ง)</span>
            </button>

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

      {/* Empty State */}
      {bill.members.length === 0 && !isAdding && !isBatchAdding && (
        <div className="mb-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-6 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 mb-2">
            <Users className="h-5 w-5" />
          </div>
          <p className="text-xs font-bold text-slate-800">ยังไม่มีรายชื่อสมาชิกในบิลนี้</p>
          <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
            กดปุ่มวางหลายชื่อพร้อมกันเพื่อคัดลอกรายชื่อจาก LINE หรือกด Generate สมาชิกตามกลุ่มถ้ามีแก๊งอยู่แล้ว
          </p>
          {!readOnly && (
            <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2">
              {bill.gangs.length > 0 && (
                <button
                  type="button"
                  onClick={openGenerateModal}
                  className="inline-flex items-center space-x-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition shadow-2xs"
                >
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Generate สมาชิกตามกลุ่ม ({bill.gangs.length} แก๊ง)</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsBatchAdding(true);
                  setIsAdding(false);
                }}
                className="inline-flex items-center space-x-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
              >
                <FileText className="h-3.5 w-3.5 text-slate-500" />
                <span>วางหลายชื่อพร้อมกัน (Batch)</span>
              </button>
            </div>
          )}
        </div>
      )}

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

      {/* Generate Members From Gangs Modal */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center space-x-2">
                <div className="rounded-xl bg-emerald-100 p-2 text-emerald-800">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    ⚡ Generate สมาชิกตามกลุ่ม (อาหารจานเดี่ยว)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    สร้าง 1 สมาชิกต่อ 1 แก๊ง และผูกสมาชิกเข้าแก๊งนั้นให้อัตโนมัติ
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

            <div className="my-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-950 shrink-0">
              <p className="font-semibold text-emerald-900 mb-1">
                💡 สะดวกสุดสำหรับมื้ออาหารจานเดี่ยวที่ราคาไม่เท่ากัน:
              </p>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                ระบบจะสร้างรายชื่อสมาชิกตามชื่อแก๊งที่มีอยู่ พร้อมผูกสมาชิกเข้าแก๊งให้อัตโนมัติทันที
                <span className="block mt-1 font-bold text-emerald-950">
                  📌 หมายเหตุ: รายการอาหารที่เป็น &quot;กองกลาง&quot; (COMMON) จะยังคงหารทุกคนเหมือนเดิม
                </span>
              </p>
            </div>

            <div className="flex items-center justify-between py-1 text-xs text-slate-600 shrink-0">
              <span className="font-semibold">
                เลือกแก๊งที่จะสร้างสมาชิก ({selectedGangIdsForMember.length} จาก {bill.gangs.length} แก๊ง):
              </span>
              <button
                type="button"
                onClick={handleSelectAllGangsForMember}
                className="font-bold text-emerald-700 hover:text-emerald-900"
              >
                {selectedGangIdsForMember.length === bill.gangs.length ? 'ยกเลิกการเลือกทั้งหมด' : 'เลือกทั้งหมด'}
              </button>
            </div>

            {/* Gangs Preview List */}
            <div className="overflow-y-auto space-y-2 py-2 pr-1 my-1 max-h-[300px]">
              {bill.gangs.map((gang) => {
                const isSelected = selectedGangIdsForMember.includes(gang.id);
                const existingMember = bill.members.find(
                  (m) => m.name.trim().toLowerCase() === gang.name.trim().toLowerCase()
                );
                const isAlreadyInGang = existingMember && (existingMember.gangIds || []).includes(gang.id);

                return (
                  <div
                    key={gang.id}
                    onClick={() => toggleSelectGangForMember(gang.id)}
                    className={`flex items-center justify-between rounded-xl border p-2.5 text-xs transition cursor-pointer select-none ${
                      isSelected
                        ? 'border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50'
                        : 'border-slate-200 bg-white opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // handled by row click
                        className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                      />
                      <div className="flex items-center space-x-2">
                        <span
                          className={`h-2.5 w-2.5 rounded-full shrink-0 ${
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
                        <span className="font-bold text-slate-900">{gang.name}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <ArrowRight className="h-3 w-3 text-slate-400" />
                      {isAlreadyInGang ? (
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 border border-slate-200">
                          มีสมาชิก &quot;{existingMember?.name}&quot; (อยู่ในแก๊งแล้ว)
                        </span>
                      ) : existingMember ? (
                        <span className="inline-flex items-center rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 border border-amber-200">
                          ผูกสมาชิกเดิม &quot;{existingMember.name}&quot; เข้าแก๊งนี้
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 border border-emerald-200">
                          <Users className="h-2.5 w-2.5 text-emerald-600" />
                          <span>สร้างสมาชิก: {gang.name}</span>
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
                onClick={handleConfirmGenerateMembers}
                disabled={selectedGangIdsForMember.length === 0}
                className="flex items-center space-x-1.5 rounded-xl bg-teal-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-teal-800 disabled:opacity-40 transition"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>
                  ยืนยัน Generate ({selectedGangIdsForMember.length} สมาชิก &amp; ผูกเข้าแก๊ง)
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
