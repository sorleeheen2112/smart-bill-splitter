'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Lock,
  Camera,
  Plus,
  LayoutGrid,
  Table as TableIcon,
  Users,
  FileSpreadsheet,
  UtensilsCrossed,
  Shield,
  UserCheck,
  Share2,
  QrCode,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import { PartyBill, BillItem, Member } from '@/lib/types';
import { calculatePartyBill } from '@/lib/calculator';
import { fetchPartyBillFromSupabase, savePartyBillToSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { loadPartyBillFromStorage, savePartyBillToStorage } from '@/lib/storage';
import { useAuth } from '@/context/AuthContext';
import { HeaderSettings } from '@/components/HeaderSettings';
import { GangManager } from '@/components/GangManager';
import { MemberManager } from '@/components/MemberManager';
import { BoardView } from '@/components/FoodAssignment/BoardView';
import { TableView } from '@/components/FoodAssignment/TableView';
import { ItemModal } from '@/components/FoodAssignment/ItemModal';
import { ReceiptScannerModal } from '@/components/AIScanner/ReceiptScannerModal';
import { ReconciliationBar } from '@/components/Summary/ReconciliationBar';
import { SheetSummaryTable } from '@/components/Summary/SheetSummaryTable';
import { LineShareModal } from '@/components/Summary/LineShareModal';
import { SlipVerificationModal } from '@/components/Summary/SlipVerificationModal';
import { GuestViewContainer } from '@/components/Guest/GuestViewContainer';

export default function DynamicBillPage() {
  const params = useParams();
  const billId = params?.billId as string;
  const { hostUser } = useAuth();

  const [bill, setBill] = useState<PartyBill | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // View state: 'guest' for payment QR, 'details' for full dashboard (read-only for guests, editable for host)
  const [activeView, setActiveView] = useState<'guest' | 'details'>('guest');
  const [isHostUnlocked, setIsHostUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinError, setPinError] = useState('');

  // Host Tabs & Display Modes
  const [hostTab, setHostTab] = useState<'food' | 'members' | 'summary'>('food');
  const [foodDisplayMode, setFoodDisplayMode] = useState<'board' | 'table'>('board');

  // Modals
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isLineShareOpen, setIsLineShareOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BillItem | null>(null);
  const [defaultAssignedTo, setDefaultAssignedTo] = useState('COMMON');
  const [viewingSlipMember, setViewingSlipMember] = useState<Member | null>(null);

  // Load bill data
  useEffect(() => {
    async function loadBill() {
      setIsLoading(true);
      let loaded: PartyBill | null = null;

      if (isSupabaseConfigured) {
        loaded = await fetchPartyBillFromSupabase(billId);
      }

      if (!loaded) {
        const local = loadPartyBillFromStorage();
        if (local.id === billId || billId === 'default' || billId === 'party-sheet-2026') {
          loaded = local;
        }
      }

      if (loaded) {
        setBill(loaded);
        if (hostUser) {
          setIsHostUnlocked(true);
          setActiveView('details');
        }
      }
      setIsLoading(false);
    }

    if (billId) {
      loadBill();
    }
  }, [billId, hostUser]);

  const handleUpdateBill = async (updated: Partial<PartyBill>) => {
    if (!bill) return;
    const newBill = { ...bill, ...updated };
    setBill(newBill);
    savePartyBillToStorage(newBill);
    if (isSupabaseConfigured) {
      await savePartyBillToSupabase(newBill, hostUser?.id);
    }
  };

  const handleSwitchToHost = () => {
    if (isHostUnlocked || hostUser) {
      setActiveView('details');
    } else {
      setShowPinModal(true);
      setPinError('');
      setPinInput('');
    }
  };

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPin = bill?.hostPin || '1234';
    if (pinInput === correctPin) {
      setIsHostUnlocked(true);
      setActiveView('details');
      setShowPinModal(false);
      setPinError('');
    } else {
      setPinError('รหัส PIN ไม่ถูกต้อง (ค่าเริ่มต้นคือ 1234)');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">
        <div className="flex items-center space-x-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
          <span>กำลังโหลดข้อมูลบิล...</span>
        </div>
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 text-center">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 max-w-md shadow-md">
          <h3 className="text-lg font-bold text-slate-900 mb-2">ไม่พบบิลงานปาร์ตี้</h3>
          <p className="text-xs text-slate-500 mb-6">
            ลิงก์อาจหมดอายุ หรือถูกลบออกจากระบบแล้ว
          </p>
          <Link
            href="/"
            className="rounded-xl bg-teal-700 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-teal-800"
          >
            กลับสู่หน้าหลัก
          </Link>
        </div>
      </div>
    );
  }

  const calculation = calculatePartyBill(bill);
  const isReadOnly = !isHostUnlocked && !hostUser;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-teal-700 selection:text-white pb-12">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center space-x-3">
            <Link
              href="/"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition"
              title="กลับหน้าหลัก / ประวัติบิล"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-sm font-bold text-slate-900 sm:text-base line-clamp-1">
                  {bill.title}
                </h1>
                {bill.isPublished ? (
                  <span className="hidden sm:inline-flex items-center space-x-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>เปิดรับเงินแล้ว</span>
                  </span>
                ) : (
                  <span className="hidden sm:inline-flex items-center space-x-1 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    <span>กำลังจัดบิล</span>
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                {bill.date} {bill.location ? `• ${bill.location}` : ''}
              </span>
            </div>
          </div>

          {/* View Switcher: Guest QR / Details Breakdown / Host Unlock */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200">
              <button
                onClick={() => setActiveView('guest')}
                className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  activeView === 'guest'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className="h-3.5 w-3.5" />
                <span>จ่ายเงิน (Guest)</span>
              </button>

              <button
                onClick={() => setActiveView('details')}
                className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  activeView === 'details'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span>ดูรายละเอียดบิล</span>
              </button>
            </div>

            {/* Host Status / Unlock Button */}
            {isHostUnlocked || hostUser ? (
              <div className="hidden sm:flex items-center space-x-1 rounded-xl bg-teal-100/70 border border-teal-200 px-3 py-1.5 text-xs font-bold text-teal-800">
                <Shield className="h-3.5 w-3.5 text-teal-700" />
                <span>โหมด Host</span>
              </div>
            ) : (
              <button
                onClick={handleSwitchToHost}
                className="flex items-center space-x-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100 transition shadow-2xs"
                title="ปลดล็อกแก้ไขบิล"
              >
                <Lock className="h-3.5 w-3.5 text-amber-600" />
                <span>ปลดล็อก Host</span>
              </button>
            )}

            <button
              onClick={() => setIsLineShareOpen(true)}
              className="flex items-center space-x-1 rounded-xl bg-[#06C755]/10 px-3 py-1.5 text-xs font-bold text-[#05963f] border border-[#06C755]/30 hover:bg-[#06C755]/20 transition"
              title="สรุปส่งเข้า LINE"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">ส่ง LINE</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
        {activeView === 'details' ? (
          /* Full Bill Details & Dashboard */
          <div className="space-y-6">
            {/* Host Publishing Status Control Banner */}
            {!isReadOnly && (
              <div>
                {!bill.isPublished ? (
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-2xl border border-amber-300 bg-amber-50/90 p-4 text-amber-950 shadow-xs">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-200 text-amber-800 font-bold">
                        <QrCode className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="rounded-md bg-amber-200 px-2 py-0.5 text-[10px] font-extrabold text-amber-900 tracking-wide uppercase">
                            สถานะ: กำลังจัดบิล (Draft)
                          </span>
                          <span className="text-xs font-bold text-amber-950">ยังไม่เปิดให้เพื่อนสแกนจ่าย QR</span>
                        </div>
                        <p className="text-[11px] text-amber-800 mt-0.5">
                          เมื่อใส่รายการอาหาร จัดแก๊ง และตรวจยอดเป๊ะแล้ว ให้กดปุ่มเพื่อสร้าง QR และเปิดรับชำระเงิน
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUpdateBill({ isPublished: true, publishedAt: new Date().toISOString() })}
                      className="w-full md:w-auto flex items-center justify-center space-x-2 rounded-xl bg-teal-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-teal-800 active:scale-95 transition"
                    >
                      <CheckCircle2 className="h-4 w-4 text-teal-200" />
                      <span>จัดการเสร็จแล้ว • สร้าง QR & เปิดรับเงิน</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-emerald-950 shadow-xs">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-200 text-emerald-800 font-bold">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="rounded-md bg-emerald-200 px-2 py-0.5 text-[10px] font-extrabold text-emerald-900 tracking-wide uppercase">
                            สถานะ: เปิดรับเงินแล้ว (Live)
                          </span>
                          <span className="text-xs font-bold text-emerald-950">เพื่อนๆ สามารถเลือกชื่อและสแกน QR ได้แล้ว</span>
                        </div>
                        <p className="text-[11px] text-emerald-800 mt-0.5">
                          เปิดให้สแกนจ่ายเมื่อ {bill.publishedAt ? new Date(bill.publishedAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : 'สักครู่'} • หากต้องการแก้ไขรายการ สามารถกดพักการจ่ายได้
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 w-full md:w-auto">
                      <button
                        type="button"
                        onClick={() => setActiveView('guest')}
                        className="flex-1 md:flex-initial flex items-center justify-center space-x-1.5 rounded-xl border border-emerald-300 bg-white px-3.5 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-50 shadow-2xs transition"
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                        <span>ไปหน้าจ่ายเงิน (Guest)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateBill({ isPublished: false })}
                        className="flex items-center justify-center space-x-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
                        title="พักการจ่ายชั่วคราวเพื่อแก้ไขบิล"
                      >
                        <span>พักการจ่าย</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Read-Only Notice Banner for Guests */}
            {isReadOnly && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-teal-200 bg-teal-50/70 p-4 text-teal-900 shadow-2xs">
                <div className="flex items-center space-x-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
                    <Shield className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">โหมดดูรายละเอียดบิล (Read-Only)</h4>
                    <p className="text-[11px] text-slate-600">คุณกำลังดูรายละเอียดอาหาร สมาชิก และตารางหารบิล (ไม่สามารถแก้ไขได้)</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSwitchToHost}
                  className="flex items-center space-x-1.5 rounded-xl bg-teal-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-teal-800 transition"
                >
                  <Lock className="h-3.5 w-3.5 text-amber-300" />
                  <span>ปลดล็อกเพื่อแก้ไข (Host PIN)</span>
                </button>
              </div>
            )}

            <HeaderSettings
              bill={bill}
              calculation={calculation}
              onUpdateBill={handleUpdateBill}
              readOnly={isReadOnly}
            />

            <ReconciliationBar
              bill={bill}
              calculation={calculation}
            />

            {/* Dashboard Navigation Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-1 rounded-xl bg-slate-100 p-1 border border-slate-200">
                <button
                  onClick={() => setHostTab('food')}
                  className={`flex items-center space-x-2 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
                    hostTab === 'food'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UtensilsCrossed className="h-4 w-4" />
                  <span>จัดอาหารเข้าแก๊ง ({bill.items.length})</span>
                </button>

                <button
                  onClick={() => setHostTab('members')}
                  className={`flex items-center space-x-2 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
                    hostTab === 'members'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Users className="h-4 w-4" />
                  <span>สมาชิก & แก๊ง ({bill.members.length} คน)</span>
                </button>

                <button
                  onClick={() => setHostTab('summary')}
                  className={`flex items-center space-x-2 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
                    hostTab === 'summary'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>ตารางสรุปยอด & สลิป</span>
                </button>
              </div>

              {hostTab === 'food' && (
                <div className="flex items-center space-x-2">
                  <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200">
                    <button
                      onClick={() => setFoodDisplayMode('board')}
                      className={`flex items-center space-x-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                        foodDisplayMode === 'board'
                          ? 'bg-teal-700 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <LayoutGrid className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">บอร์ด</span>
                    </button>
                    <button
                      onClick={() => setFoodDisplayMode('table')}
                      className={`flex items-center space-x-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                        foodDisplayMode === 'table'
                          ? 'bg-teal-700 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <TableIcon className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">ตาราง</span>
                    </button>
                  </div>

                  {!isReadOnly && (
                    <>
                      <button
                        onClick={() => setIsScannerOpen(true)}
                        className="flex items-center space-x-1.5 rounded-xl bg-teal-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-teal-800 transition"
                      >
                        <Camera className="h-4 w-4" />
                        <span>สแกนบิล AI</span>
                      </button>

                      <button
                        onClick={() => {
                          setEditingItem(null);
                          setDefaultAssignedTo('COMMON');
                          setIsItemModalOpen(true);
                        }}
                        className="flex items-center space-x-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                      >
                        <Plus className="h-4 w-4" />
                        <span className="hidden md:inline">เพิ่มรายการ</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Content */}
            {hostTab === 'food' && (
              <div>
                {foodDisplayMode === 'board' ? (
                  <BoardView
                    bill={bill}
                    calculation={calculation}
                    onUpdateBill={handleUpdateBill}
                    readOnly={isReadOnly}
                    onEditItem={(it) => {
                      if (isReadOnly) return;
                      setEditingItem(it);
                      setIsItemModalOpen(true);
                    }}
                    onAddNewItem={(assignedTo) => {
                      if (isReadOnly) return;
                      setEditingItem(null);
                      setDefaultAssignedTo(assignedTo);
                      setIsItemModalOpen(true);
                    }}
                  />
                ) : (
                  <TableView
                    bill={bill}
                    calculation={calculation}
                    onUpdateBill={handleUpdateBill}
                    readOnly={isReadOnly}
                    onEditItem={(it) => {
                      if (isReadOnly) return;
                      setEditingItem(it);
                      setIsItemModalOpen(true);
                    }}
                  />
                )}
              </div>
            )}

            {hostTab === 'members' && (
              <div className="space-y-6">
                <GangManager
                  bill={bill}
                  calculation={calculation}
                  onUpdateBill={handleUpdateBill}
                  readOnly={isReadOnly}
                />
                <MemberManager
                  bill={bill}
                  calculation={calculation}
                  onUpdateBill={handleUpdateBill}
                  readOnly={isReadOnly}
                />
              </div>
            )}

            {hostTab === 'summary' && (
              <div className="space-y-6">
                <SheetSummaryTable
                  bill={bill}
                  calculation={calculation}
                  onUpdateBill={handleUpdateBill}
                  readOnly={isReadOnly}
                  onViewSlip={(m) => setViewingSlipMember(m)}
                />
              </div>
            )}
          </div>
        ) : (
          /* Guest View */
          <GuestViewContainer
            bill={bill}
            calculation={calculation}
            onUpdateBill={handleUpdateBill}
            onSwitchToDetails={() => setActiveView('details')}
          />
        )}
      </main>

      {/* Host PIN Lock Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 mb-3">
                <Lock className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                ปลดล็อกโหมดจัดการบิล (Host PIN)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                กรุณากรอกรหัส PIN 4 หลักเพื่อเข้าสู่ระบบจัดการบิล
              </p>
            </div>

            <form onSubmit={handleVerifyPin} className="mt-5 space-y-3">
              <input
                type="password"
                maxLength={6}
                autoFocus
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="รหัส PIN (เช่น 1234)"
                className="w-full text-center tracking-widest text-lg font-mono rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-teal-600 focus:outline-none shadow-2xs"
              />

              {pinError && (
                <p className="text-xs text-rose-600 text-center font-bold">{pinError}</p>
              )}

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="w-1/2 rounded-xl border border-slate-300 bg-white py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="w-1/2 rounded-xl bg-teal-700 py-2 text-xs font-bold text-white shadow-xs hover:bg-teal-800"
                >
                  ปลดล็อก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modals */}
      <ReceiptScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        gangs={bill.gangs}
        onImportItems={(items) => handleUpdateBill({ items: [...bill.items, ...items] })}
      />

      <ItemModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onSave={(item) => {
          const exists = bill.items.some((it) => it.id === item.id);
          const updated = exists
            ? bill.items.map((it) => (it.id === item.id ? item : it))
            : [...bill.items, item];
          handleUpdateBill({ items: updated });
        }}
        editingItem={editingItem}
        gangs={bill.gangs}
        defaultAssignedTo={defaultAssignedTo}
      />

      <LineShareModal
        isOpen={isLineShareOpen}
        onClose={() => setIsLineShareOpen(false)}
        bill={bill}
        calculation={calculation}
      />

      <SlipVerificationModal
        member={viewingSlipMember}
        calculation={calculation}
        onClose={() => setViewingSlipMember(null)}
        onVerify={(mId) => {
          const updated = bill.members.map((m) =>
            m.id === mId ? { ...m, paymentStatus: 'VERIFIED' as const } : m
          );
          handleUpdateBill({ members: updated });
        }}
        onReject={(mId) => {
          const updated = bill.members.map((m) =>
            m.id === mId
              ? { ...m, paymentStatus: 'PENDING' as const, slipUrl: undefined }
              : m
          );
          handleUpdateBill({ members: updated });
        }}
      />
    </div>
  );
}
