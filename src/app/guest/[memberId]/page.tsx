'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Sparkles, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { PartyBill, Member } from '@/lib/types';
import { calculatePartyBill } from '@/lib/calculator';
import { loadPartyBillFromStorage, savePartyBillToStorage } from '@/lib/storage';
import { fetchPartyBillFromSupabase, savePartyBillToSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { GuestBillCard } from '@/components/Guest/GuestBillCard';
import { PromptPayQRCode } from '@/components/Guest/PromptPayQRCode';
import { SlipUploadSection } from '@/components/Guest/SlipUploadSection';

export default function GuestDirectPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const memberId = params?.memberId as string;
  const billId = searchParams.get('billId');

  const [bill, setBill] = useState<PartyBill | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      let loaded: PartyBill | null = null;
      if (billId && isSupabaseConfigured) {
        loaded = await fetchPartyBillFromSupabase(billId);
      }
      if (!loaded) {
        loaded = loadPartyBillFromStorage();
      }
      setBill(loaded);
      setIsLoading(false);
    }
    load();
  }, [billId]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-5 w-5 animate-spin text-teal-400" />
          <span>กำลังโหลดข้อมูลบิล...</span>
        </div>
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        ไม่พบบิลในระบบ
      </div>
    );
  }

  const calculation = calculatePartyBill(bill);
  const member = bill.members.find((m) => m.id === memberId) || bill.members[0];

  if (!member) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-4 text-center">
        <h2 className="text-lg font-bold text-white mb-2">ไม่พบรายชื่อในระบบ</h2>
        <Link
          href="/"
          className="rounded-xl bg-teal-700 px-4 py-2 text-xs font-semibold text-white"
        >
          กลับหน้าหลัก
        </Link>
      </div>
    );
  }

  const breakdown = calculation.membersBreakdown[member.id];

  const handleUploadSlip = async (mId: string, slipUrl: string) => {
    const updated = {
      ...bill,
      members: bill.members.map((m) =>
        m.id === mId
          ? {
              ...m,
              slipUrl,
              slipUploadedAt: new Date().toISOString(),
              paymentStatus: 'SLIP_UPLOADED' as const,
            }
          : m
      ),
    };
    setBill(updated);
    savePartyBillToStorage(updated);
    if (isSupabaseConfigured) {
      await savePartyBillToSupabase(updated, bill.hostId);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link
            href="/"
            className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>ดูบิลทั้งหมด / เข้าสู่ระบบ Host</span>
          </Link>

          <div className="flex items-center space-x-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-slate-300">
              {bill.title}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 pt-6 space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          <div className="space-y-4 md:col-span-7">
            <GuestBillCard
              bill={bill}
              member={member}
              calculation={calculation}
            />
          </div>

          <div className="space-y-4 md:col-span-5">
            {!member.isFree && (
              <PromptPayQRCode
                key={`qr-${member.id}`}
                promptPayNumber={bill.promptPayNumber}
                promptPayName={bill.promptPayName}
                amount={breakdown?.totalPayable || 0}
                memberName={member.name}
              />
            )}

            {!member.isFree && (
              <SlipUploadSection
                key={`slip-${member.id}`}
                member={member}
                onUploadSlip={handleUploadSlip}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
