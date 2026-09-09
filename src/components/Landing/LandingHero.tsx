'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  LogIn,
  Search,
  ArrowRight,
  Layers,
  Camera,
  QrCode,
  ShieldCheck,
  Crown,
  FileSpreadsheet,
} from 'lucide-react';
import { AuthModal } from '@/components/Auth/AuthModal';

export const LandingHero: React.FC = () => {
  const router = useRouter();
  const [billIdInput, setBillIdInput] = useState('');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authDefaultTab, setAuthDefaultTab] = useState<'signin' | 'signup'>('signin');

  const handleSearchBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!billIdInput.trim()) return;
    router.push(`/bill/${billIdInput.trim()}`);
  };

  const handleOpenAuth = (tab: 'signin' | 'signup') => {
    setAuthDefaultTab(tab);
    setIsAuthOpen(true);
  };

  return (
    <div className="space-y-12 py-6 sm:py-12">
      {/* Hero Header */}
      <div className="mx-auto max-w-3xl text-center space-y-4">
        <div className="inline-flex items-center space-x-2 rounded-full bg-teal-50 px-3.5 py-1 text-xs font-bold text-teal-900 border border-teal-200">
          <Sparkles className="h-3.5 w-3.5 text-teal-700" />
          <span>ระบบหารบิลปาร์ตี้อัจฉริยะ • สแกนบิลด้วย AI Vision</span>
        </div>

        <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-5xl leading-tight">
          หารค่าอาหารปาร์ตี้ง่ายๆ <br />
          <span className="bg-gradient-to-r from-teal-700 via-emerald-600 to-teal-800 bg-clip-text text-transparent">
            แยกแก๊ง • สแกนบิล • พร้อมเพย์ QR
          </span>
        </h1>

        <p className="mx-auto max-w-xl text-sm sm:text-base text-slate-600 leading-relaxed font-medium">
          แก้ปัญหาหารบิลคนกลุ่มใหญ่ 20-30 คน ไม่ต้องปวดหัวกับคนกินเหล้า คนกินไอติม หรือแขกที่กินฟรี
          คำนวณเป๊ะทุกบาททุกสตางค์ พร้อมส่ง QR จ่ายเงินตรงยอดทันที
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => handleOpenAuth('signup')}
            className="flex items-center space-x-2 rounded-xl bg-teal-700 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-teal-800 transition"
          >
            <LogIn className="h-4 w-4" />
            <span>เริ่มต้นใช้งาน (สมัครสมาชิก Host)</span>
          </button>
          <button
            onClick={() => handleOpenAuth('signin')}
            className="flex items-center space-x-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            <span>เข้าสู่ระบบ Host</span>
          </button>
        </div>
      </div>

      {/* Guest Bill Quick Search Box */}
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-xs font-bold text-slate-700 mb-2 flex items-center space-x-1.5">
          <Search className="h-3.5 w-3.5 text-teal-700" />
          <span>เพื่อนส่งรหัสบิลมาให้? เข้าดูบิลได้ที่นี่</span>
        </h3>
        <form onSubmit={handleSearchBill} className="flex gap-2">
          <input
            type="text"
            value={billIdInput}
            onChange={(e) => setBillIdInput(e.target.value)}
            placeholder="ใส่รหัสบิล เช่น party-1234"
            className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-teal-600 focus:outline-none shadow-2xs font-mono"
          />
          <button
            type="submit"
            className="flex items-center space-x-1 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
          >
            <span>เปิดบิล</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mx-auto max-w-5xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-200 mb-3">
            <Layers className="h-5 w-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 mb-1">
            Food-to-Gang Architecture
          </h4>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            แยกชัดเจนระหว่าง [1] อาหารกองกลางที่ทุกคนร่วมหาร กับ [2..N] ก้อนอาหารประจำแก๊ง (เช่น แก๊งเหล้า, แก๊งไอติม)
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 mb-3">
            <Camera className="h-5 w-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 mb-1">
            AI Receipt OCR Scanner
          </h4>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            ถ่ายรูปใบเสร็จร้านอาหาร AI สแกนรายการและราคาให้อัตโนมัติ พร้อม Dropdown จัดเข้าแก๊งได้ตั้งแต่หน้าพรีวิว
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200 mb-3">
            <Crown className="h-5 w-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 mb-1">
            VIP Tag [F] & Sponsor Budget
          </h4>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            แท็กแขกพิเศษกินฟรี 0 บาทและหักออกจากตัวหารกลุ่มอัตโนมัติ พร้อมหักลดงบสนับสนุน Sponsor ก่อนหารกองกลาง
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-200 mb-3">
            <QrCode className="h-5 w-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 mb-1">
            Dynamic PromptPay QR Code
          </h4>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            สร้าง QR Code พร้อมเพย์ตามยอดที่แต่ละคนต้องจ่ายจริง สแกนผ่านแอปธนาคารได้ทันที ไม่ต้องพิมพ์ยอดเอง
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 border border-slate-200 mb-3">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 mb-1">
            Google Sheets Matrix View
          </h4>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            ตารางสรุปยอดสไตล์ Google Sheet เห็นยอดกองกลางและแต่ละแก๊งชัดเจน พร้อมระบบตรวจสลิปและ Verify ในคลิกเดียว
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 mb-3">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 mb-1">
            Reconciliation 100% Match
          </h4>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            ระบบตรวจสอบความถูกต้อง ตรวจเช็กผลรวมทุกคน + งบสนับสนุน == ยอดบิลรวม ป้องกันปัญหาเศษสตางค์ดิฟ
          </p>
        </div>
      </div>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        defaultTab={authDefaultTab}
      />
    </div>
  );
};
