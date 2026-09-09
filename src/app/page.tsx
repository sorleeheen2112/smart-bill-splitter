'use client';

import React, { useState, useEffect } from 'react';
import {
  Camera,
  Plus,
  LayoutGrid,
  Table as TableIcon,
  Users,
  FileSpreadsheet,
  UtensilsCrossed,
  ArrowLeft,
  Inbox,
  QrCode,
  CheckCircle2,
  UserCheck,
} from 'lucide-react';
import { PartyBill, BillItem, Member } from '@/lib/types';
import { calculatePartyBill } from '@/lib/calculator';
import {
  loadPartyBillFromStorage,
  savePartyBillToStorage,
} from '@/lib/storage';
import {
  fetchHostPartyBills,
  savePartyBillToSupabase,
  deletePartyBillFromSupabase,
  isSupabaseConfigured,
} from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
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
import { PartyHistoryList } from '@/components/HostDashboard/PartyHistoryList';
import { NewBillModal } from '@/components/HostDashboard/NewBillModal';
import { LandingHero } from '@/components/Landing/LandingHero';
import { initialSamplePartyBill } from '@/lib/sampleData';

export default function Home() {
  const { hostUser, isLoading: isAuthLoading } = useAuth();

  // Multi-party bills store
  const [bills, setBills] = useState<PartyBill[]>([]);
  const [activeBillId, setActiveBillId] = useState<string>('');
  const [activeScreen, setActiveScreen] = useState<'bill-editor' | 'history'>('history');
  const [isLoadingBills, setIsLoadingBills] = useState<boolean>(true);

  const [activeView, setActiveView] = useState<'host' | 'guest'>('host');
  const [hostTab, setHostTab] = useState<'food' | 'members' | 'summary'>('food');
  const [foodDisplayMode, setFoodDisplayMode] = useState<'board' | 'table'>('board');

  // Modals state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isLineShareOpen, setIsLineShareOpen] = useState(false);
  const [isNewBillModalOpen, setIsNewBillModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BillItem | null>(null);
  const [defaultAssignedTo, setDefaultAssignedTo] = useState('COMMON');
  const [viewingSlipMember, setViewingSlipMember] = useState<Member | null>(null);

  // Load bills on auth state change
  useEffect(() => {
    async function loadAllBills() {
      setIsLoadingBills(true);
      if (hostUser) {
        let loadedList: PartyBill[] = [];

        if (isSupabaseConfigured) {
          const remoteBills = await fetchHostPartyBills(hostUser.id);
          loadedList = remoteBills;
        }

        // Also check if there is an existing local bill from storage
        const local = loadPartyBillFromStorage();
        if (local && (local.items?.length > 0 || local.members?.length > 1 || local.title)) {
          if (!loadedList.some((b) => b.id === local.id)) {
            loadedList = [local, ...loadedList];
            if (isSupabaseConfigured) {
              await savePartyBillToSupabase(local, hostUser.id);
            }
          }
        }

        if (loadedList.length === 0) {
          loadedList = [initialSamplePartyBill];
        }

        setBills(loadedList);
        setActiveBillId((prev) => (prev && loadedList.some((b) => b.id === prev) ? prev : loadedList[0].id));
      } else {
        const local = loadPartyBillFromStorage();
        setBills([local]);
        setActiveBillId(local.id);
      }
      setIsLoadingBills(false);
    }

    if (!isAuthLoading) {
      loadAllBills();
    }
  }, [hostUser, isAuthLoading]);

  const activeBill = bills.find((b) => b.id === activeBillId) || bills[0] || initialSamplePartyBill;

  const handleUpdateActiveBill = async (updated: Partial<PartyBill>) => {
    const newBill = { ...activeBill, ...updated };
    const updatedList = bills.map((b) => (b.id === activeBill.id ? newBill : b));
    setBills(updatedList);
    savePartyBillToStorage(newBill);

    if (isSupabaseConfigured && hostUser) {
      await savePartyBillToSupabase(newBill, hostUser.id);
    }
  };

  const handleFullBillUpdate = async (newBill: PartyBill) => {
    const updatedList = bills.map((b) => (b.id === newBill.id ? newBill : b));
    setBills(updatedList);
    savePartyBillToStorage(newBill);

    if (isSupabaseConfigured && hostUser) {
      await savePartyBillToSupabase(newBill, hostUser.id);
    }
  };

  const handleCreateNewBill = async (newBill: PartyBill) => {
    const updatedList = [newBill, ...bills];
    setBills(updatedList);
    setActiveBillId(newBill.id);
    setActiveScreen('bill-editor');
    savePartyBillToStorage(newBill);

    if (isSupabaseConfigured && hostUser) {
      await savePartyBillToSupabase(newBill, hostUser.id);
    }
  };

  const handleDeleteBill = async (billId: string) => {
    if (confirm('คุณต้องการลบบิลงานปาร์ตี้นี้ใช่หรือไม่?')) {
      const remaining = bills.filter((b) => b.id !== billId);
      setBills(remaining);
      if (remaining.length > 0) {
        setActiveBillId(remaining[0].id);
      }
      if (isSupabaseConfigured) {
        await deletePartyBillFromSupabase(billId);
      }
    }
  };

  if (isAuthLoading || (hostUser && isLoadingBills)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">
        <div className="flex items-center space-x-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
          <span>กำลังโหลดระบบ Party Bill Splitter...</span>
        </div>
      </div>
    );
  }

  // 1. Unauthenticated Visitor -> Show Landing Page
  if (!hostUser) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-teal-700 selection:text-white">
        <Navbar
          bill={initialSamplePartyBill}
          activeView="guest"
          setActiveView={() => {}}
          onUpdateBill={() => {}}
          onOpenLineShare={() => {}}
          showHistoryButton={false}
        />
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <LandingHero />
        </main>
      </div>
    );
  }

  // 2. Authenticated Host with 0 bills
  if (hostUser && bills.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-teal-700 selection:text-white">
        <Navbar
          bill={initialSamplePartyBill}
          activeView={activeView}
          setActiveView={setActiveView}
          onUpdateBill={handleFullBillUpdate}
          onOpenLineShare={() => setIsLineShareOpen(true)}
          showHistoryButton={true}
        />
        <main className="mx-auto max-w-2xl px-4 py-16 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-teal-50 text-teal-700 border border-teal-200 shadow-sm">
            <Inbox className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            ยินดีต้อนรับคุณ {hostUser.firstName}! ยังไม่มีบิลปาร์ตี้ในบัญชีของคุณ
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto font-medium">
            เริ่มต้นสร้างบิลปาร์ตี้แรกของคุณ เพื่อเริ่มจัดอาหารเข้าแก๊งและแชร์ให้เพื่อน
          </p>

          <div className="flex items-center justify-center pt-4">
            <button
              onClick={() => setIsNewBillModalOpen(true)}
              className="flex items-center space-x-1.5 rounded-xl bg-teal-700 px-6 py-3 text-sm font-bold text-white shadow-xs hover:bg-teal-800 transition"
            >
              <Plus className="h-4 w-4" />
              <span>สร้างบิลแรกของคุณ</span>
            </button>
          </div>

          <NewBillModal
            isOpen={isNewBillModalOpen}
            onClose={() => setIsNewBillModalOpen(false)}
            onCreate={handleCreateNewBill}
          />
        </main>
      </div>
    );
  }

  // Calculations for active bill
  const calculation = calculatePartyBill(activeBill);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-teal-700 selection:text-white pb-12">
      {/* Top Navbar */}
      <Navbar
        bill={activeBill}
        activeView={activeView}
        setActiveView={setActiveView}
        onUpdateBill={handleFullBillUpdate}
        onOpenLineShare={() => setIsLineShareOpen(true)}
        onOpenHistory={() => setActiveScreen(activeScreen === 'history' ? 'bill-editor' : 'history')}
        showHistoryButton={true}
      />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
        {/* Screen: Party History Dashboard */}
        {activeScreen === 'history' ? (
          <div className="space-y-4">
            {activeBillId && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveScreen('bill-editor')}
                  className="flex items-center space-x-1.5 text-xs text-teal-800 hover:text-teal-950 font-bold"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>กลับสู่บิลปัจจุบัน ({activeBill.title})</span>
                </button>
              </div>
            )}

            <PartyHistoryList
              bills={bills}
              activeBillId={activeBillId}
              onSelectBill={(id) => {
                setActiveBillId(id);
                setActiveScreen('bill-editor');
              }}
              onCreateNewBill={() => setIsNewBillModalOpen(true)}
              onDeleteBill={handleDeleteBill}
            />
          </div>
        ) : (
          /* Screen: Active Bill Editor (Host / Guest) */
          <>
            {activeView === 'host' ? (
              <div className="space-y-6">
                {/* Host Publishing Status Control Banner */}
                <div>
                  {!activeBill.isPublished ? (
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
                        onClick={() => handleUpdateActiveBill({ isPublished: true, publishedAt: new Date().toISOString() })}
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
                            เปิดให้สแกนจ่ายเมื่อ {activeBill.publishedAt ? new Date(activeBill.publishedAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : 'สักครู่'} • หากต้องการแก้ไขรายการ สามารถกดพักการจ่ายได้
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
                          <span>ดูหน้าสแกนจ่าย (Guest)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateActiveBill({ isPublished: false })}
                          className="flex items-center justify-center space-x-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
                          title="พักการจ่ายชั่วคราวเพื่อแก้ไขบิล"
                        >
                          <span>พักการจ่าย</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Header Settings & Metric Overview */}
                <HeaderSettings
                  bill={activeBill}
                  calculation={calculation}
                  onUpdateBill={handleUpdateActiveBill}
                />

                {/* Reconciliation Check Banner */}
                <ReconciliationBar
                  bill={activeBill}
                  calculation={calculation}
                />

                {/* Host Navigation Tabs */}
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
                      <span>จัดอาหารเข้าแก๊ง ({activeBill.items.length})</span>
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
                      <span>สมาชิก & แก๊ง ({activeBill.members.length} คน)</span>
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

                  {/* Quick Actions (on Food tab) */}
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

                      <button
                        onClick={() => setIsScannerOpen(true)}
                        className="flex items-center space-x-1.5 rounded-xl bg-teal-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-teal-800 transition"
                      >
                        <Camera className="h-4 w-4" />
                        <span>สแกนบิลด้วย AI</span>
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
                    </div>
                  )}
                </div>

                {/* Host Tab Contents */}
                {hostTab === 'food' && (
                  <div>
                    {foodDisplayMode === 'board' ? (
                      <BoardView
                        bill={activeBill}
                        calculation={calculation}
                        onUpdateBill={handleUpdateActiveBill}
                        onEditItem={(it) => {
                          setEditingItem(it);
                          setIsItemModalOpen(true);
                        }}
                        onAddNewItem={(assignedTo) => {
                          setEditingItem(null);
                          setDefaultAssignedTo(assignedTo);
                          setIsItemModalOpen(true);
                        }}
                      />
                    ) : (
                      <TableView
                        bill={activeBill}
                        calculation={calculation}
                        onUpdateBill={handleUpdateActiveBill}
                        onEditItem={(it) => {
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
                      bill={activeBill}
                      calculation={calculation}
                      onUpdateBill={handleUpdateActiveBill}
                    />
                    <MemberManager
                      bill={activeBill}
                      calculation={calculation}
                      onUpdateBill={handleUpdateActiveBill}
                    />
                  </div>
                )}

                {hostTab === 'summary' && (
                  <div className="space-y-6">
                    <SheetSummaryTable
                      bill={activeBill}
                      calculation={calculation}
                      onUpdateBill={handleUpdateActiveBill}
                      onViewSlip={(m) => setViewingSlipMember(m)}
                    />
                  </div>
                )}
              </div>
            ) : (
              /* Guest View */
              <GuestViewContainer
                bill={activeBill}
                calculation={calculation}
                onUpdateBill={handleUpdateActiveBill}
              />
            )}
          </>
        )}
      </main>

      {/* Modals */}
      <ReceiptScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        gangs={activeBill.gangs}
        onImportItems={(items) => handleUpdateActiveBill({ items: [...activeBill.items, ...items] })}
      />

      <ItemModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onSave={(item) => {
          const exists = activeBill.items.some((it) => it.id === item.id);
          const updated = exists
            ? activeBill.items.map((it) => (it.id === item.id ? item : it))
            : [...activeBill.items, item];
          handleUpdateActiveBill({ items: updated });
        }}
        editingItem={editingItem}
        gangs={activeBill.gangs}
        defaultAssignedTo={defaultAssignedTo}
      />

      <NewBillModal
        isOpen={isNewBillModalOpen}
        onClose={() => setIsNewBillModalOpen(false)}
        onCreate={handleCreateNewBill}
      />

      <LineShareModal
        isOpen={isLineShareOpen}
        onClose={() => setIsLineShareOpen(false)}
        bill={activeBill}
        calculation={calculation}
      />

      <SlipVerificationModal
        member={viewingSlipMember}
        calculation={calculation}
        onClose={() => setViewingSlipMember(null)}
        onVerify={(mId) => {
          const updated = activeBill.members.map((m) =>
            m.id === mId ? { ...m, paymentStatus: 'VERIFIED' as const } : m
          );
          handleUpdateActiveBill({ members: updated });
        }}
        onReject={(mId) => {
          const updated = activeBill.members.map((m) =>
            m.id === mId
              ? { ...m, paymentStatus: 'PENDING' as const, slipUrl: undefined }
              : m
          );
          handleUpdateActiveBill({ members: updated });
        }}
      />
    </div>
  );
}
