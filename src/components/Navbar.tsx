'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  ReceiptText,
  Share2,
  Shield,
  UserCheck,
  History,
  LogIn,
  LogOut,
  Cloud,
  HelpCircle,
  Link2,
  Check,
} from 'lucide-react';
import { PartyBill } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { AuthModal } from '@/components/Auth/AuthModal';
import { HostInfographicModal } from '@/components/HostDashboard/HostInfographicModal';

interface NavbarProps {
  bill: PartyBill;
  activeView: 'host' | 'guest';
  setActiveView: (view: 'host' | 'guest') => void;
  onUpdateBill?: (newBill: PartyBill) => void;
  onOpenLineShare: () => void;
  onOpenHistory?: () => void;
  showHistoryButton?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  bill,
  activeView,
  setActiveView,
  onOpenLineShare,
  onOpenHistory,
  showHistoryButton = true,
}) => {
  const { hostUser, signOut, isSupabaseActive } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isHostGuideOpen, setIsHostGuideOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyBillLink = () => {
    if (typeof window !== 'undefined' && bill?.id) {
      const url = `${window.location.origin}/bill/${bill.id}`;
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-teal-700 via-emerald-600 to-teal-500 shadow-md shadow-emerald-700/20">
              <ReceiptText className="h-5 w-5 text-white" />
              <Sparkles className="absolute -top-1 -right-1 h-3.5 w-3.5 text-amber-300 drop-shadow-xs animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
                  Party Bill Splitter
                </h1>
                <span
                  className={`hidden sm:inline-flex items-center space-x-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                    isSupabaseActive
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  <Cloud className="h-3 w-3 mr-0.5 text-emerald-600" />
                  <span>{isSupabaseActive ? 'Cloud Sync' : 'Local Mode'}</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden md:block">
                {bill.title || 'ระบบหารบิลปาร์ตี้อัจฉริยะ'}
              </p>
            </div>
          </div>

          {/* View Switcher: Host / Guest (Show only if logged in as Host) */}
          {hostUser && (
            <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200">
              <button
                onClick={() => setActiveView('host')}
                className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  activeView === 'host'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Shield className="h-3.5 w-3.5" />
                <span>Host (จัดการบิล)</span>
              </button>
              <button
                onClick={() => setActiveView('guest')}
                className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  activeView === 'guest'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className="h-3.5 w-3.5" />
                <span>Guest (จ่ายเงิน)</span>
              </button>
            </div>
          )}

          {/* Host Account / Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsHostGuideOpen(true)}
              className="flex items-center space-x-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
              title="คู่มือการใช้งานสำหรับ Host"
            >
              <HelpCircle className="h-3.5 w-3.5 text-teal-600" />
              <span className="hidden sm:inline">คู่มือ Host</span>
            </button>

            {hostUser && showHistoryButton && onOpenHistory && (
              <button
                onClick={onOpenHistory}
                className="flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-teal-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs"
                title="ประวัติบิลทั้งหมด"
              >
                <History className="h-3.5 w-3.5 text-teal-600" />
                <span className="hidden sm:inline">ประวัติบิล</span>
              </button>
            )}

            {hostUser && (
              <button
                type="button"
                onClick={handleCopyBillLink}
                className="flex items-center space-x-1 rounded-xl border border-teal-300 bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-800 hover:bg-teal-100 transition shadow-2xs cursor-pointer"
                title="คัดลอกลิงก์หน้าบิลส่งให้เพื่อน"
              >
                {copiedLink ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-emerald-700">คัดลอกลิงก์แล้ว!</span>
                  </>
                ) : (
                  <>
                    <Link2 className="h-3.5 w-3.5 text-teal-700" />
                    <span className="hidden sm:inline">คัดลอกลิงก์ให้เพื่อน</span>
                  </>
                )}
              </button>
            )}

            {hostUser && (
              <button
                onClick={onOpenLineShare}
                className="flex items-center space-x-1 rounded-xl bg-[#06C755]/10 px-3 py-1.5 text-xs font-bold text-[#05963f] border border-[#06C755]/30 hover:bg-[#06C755]/20 transition"
                title="สรุปยอดส่งเข้า LINE"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span className="hidden md:inline">ส่งเข้า LINE</span>
              </button>
            )}

            {/* Host Auth Avatar / Login Button */}
            {hostUser ? (
              <div className="flex items-center space-x-1.5 rounded-xl border border-teal-200 bg-teal-50 p-1 pl-2.5">
                <span className="text-xs font-bold text-teal-900 hidden sm:inline">
                  {hostUser.firstName}
                </span>
                <button
                  onClick={() => signOut()}
                  className="rounded-lg p-1 text-slate-400 hover:bg-white hover:text-rose-600 transition"
                  title="ออกจากระบบ Host"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center space-x-1.5 rounded-xl bg-teal-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-teal-800 transition"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  <span>เข้าสู่ระบบ / สมัครสมาชิก</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <HostInfographicModal
        isOpen={isHostGuideOpen}
        onClose={() => setIsHostGuideOpen(false)}
      />
    </>
  );
};
