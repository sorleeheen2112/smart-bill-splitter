'use client';

import React from 'react';
import {
  X,
  Camera,
  Layers,
  CreditCard,
  Share2,
  CheckCircle2,
  Sparkles,
  Shield,
  Utensils,
  Percent,
  Users,
  PlusCircle,
  ReceiptText,
} from 'lucide-react';

interface HostInfographicModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HostInfographicModal: React.FC<HostInfographicModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-teal-900 to-teal-800 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-xl bg-white/10 p-2 text-white/80 hover:bg-white/20 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center space-x-2 text-amber-300 text-xs font-bold uppercase tracking-wider mb-1">
            <Shield className="h-4 w-4" />
            <span>Host Mastery Guide</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black">
            👑 คู่มือการจัดการบิลสำหรับ Host (เจ้าของบิล)
          </h2>
          <p className="text-xs sm:text-sm text-teal-100 mt-1">
            ขั้นตอนการจัดบิล เพิ่มเพื่อน สร้างแก๊ง และเรียกเก็บเงินแบบมืออาชีพ
          </p>
        </div>

        {/* Body Steps */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Step Workflow Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Step 1: Create Bill */}
            <div className="rounded-2xl border border-teal-100 bg-teal-50/50 p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-700 text-white text-xs font-black shadow-xs">
                    1
                  </span>
                  <ReceiptText className="h-4 w-4 text-teal-600" />
                </div>
                <h3 className="text-xs font-black text-slate-900 mb-1">
                  1. กดสร้างบิลใหม่
                </h3>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  กดปุ่ม <strong>"+ สร้างบิลใหม่"</strong> จากหน้าหลัก กรอกชื่อมื้ออาหาร/ปาร์ตี้ และใส่เลขพร้อมเพย์ของคุณ
                </p>
              </div>
              <div className="mt-2.5 rounded-lg bg-teal-100/70 px-2 py-1 text-[10px] font-bold text-teal-800 text-center">
                📝 เริ่มต้นสร้างบิล
              </div>
            </div>

            {/* Step 2: Add Members */}
            <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-700 text-white text-xs font-black shadow-xs">
                    2
                  </span>
                  <Users className="h-4 w-4 text-sky-600" />
                </div>
                <h3 className="text-xs font-black text-slate-900 mb-1">
                  2. เพิ่มสมาชิกในโต๊ะ
                </h3>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  ไปที่แท็บ <strong>"แก๊ง & สมาชิก"</strong> พิมพ์ชื่อเพื่อนร่วมโต๊ะทุกคน (เปิดสวิตช์ <strong>[F]</strong> ถ้ามีคนถูกเลี้ยง)
                </p>
              </div>
              <div className="mt-2.5 rounded-lg bg-sky-100/70 px-2 py-1 text-[10px] font-bold text-sky-800 text-center">
                👥 ใส่ชื่อเพื่อนทุกคน
              </div>
            </div>

            {/* Step 3: AI Scanner / Items */}
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-700 text-white text-xs font-black shadow-xs">
                    3
                  </span>
                  <Camera className="h-4 w-4 text-emerald-600" />
                </div>
                <h3 className="text-xs font-black text-slate-900 mb-1">
                  3. สแกนบิลด้วย AI
                </h3>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  กดปุ่ม <strong>"AI สแกนใบเสร็จ"</strong> ถ่ายรูปบิลร้านอาหาร AI จะดึงเมนูและราคาให้ใน 3 วินาที หรือพิมพ์เพิ่มเอง
                </p>
              </div>
              <div className="mt-2.5 rounded-lg bg-emerald-100/70 px-2 py-1 text-[10px] font-bold text-emerald-800 text-center">
                📸 อ่านบิลอัตโนมัติ
              </div>
            </div>

            {/* Step 4: Create Gangs */}
            <div className="rounded-2xl border border-violet-100 bg-violet-50/50 p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-700 text-white text-xs font-black shadow-xs">
                    4
                  </span>
                  <PlusCircle className="h-4 w-4 text-violet-600" />
                </div>
                <h3 className="text-xs font-black text-slate-900 mb-1">
                  4. สร้างแก๊งตามสายกิน
                </h3>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  กด <strong>"+ สร้างแก๊งใหม่"</strong> ตั้งชื่อ เช่น สายดริงก์, สายเนื้อ, ของหวาน เลือกสี และติ๊กเพื่อนที่อยู่ในแก๊ง
                </p>
              </div>
              <div className="mt-2.5 rounded-lg bg-violet-100/70 px-2 py-1 text-[10px] font-bold text-violet-800 text-center">
                🏷️ จัดกลุ่มคนกิน
              </div>
            </div>

            {/* Step 5: Assign Items */}
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-700 text-white text-xs font-black shadow-xs">
                    5
                  </span>
                  <Layers className="h-4 w-4 text-indigo-600" />
                </div>
                <h3 className="text-xs font-black text-slate-900 mb-1">
                  5. จัดอาหารเข้าแก๊ง
                </h3>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  ลากหรือเลือกอาหารใส่แก๊งที่สั่ง ส่วนเมนูที่กินร่วมกันทุกคนให้จัดไว้ที่ <strong>"กองกลาง"</strong>
                </p>
              </div>
              <div className="mt-2.5 rounded-lg bg-indigo-100/70 px-2 py-1 text-[10px] font-bold text-indigo-800 text-center">
                🍽️ ลากจัดแบบ Kanban
              </div>
            </div>

            {/* Step 6: Settings & Payer */}
            <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-700 text-white text-xs font-black shadow-xs">
                    6
                  </span>
                  <CreditCard className="h-4 w-4 text-amber-600" />
                </div>
                <h3 className="text-xs font-black text-slate-900 mb-1">
                  6. ระบุคนสำรองจ่าย & ภาษี
                </h3>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  เลือก <strong>"คนสำรองจ่าย"</strong> (ระบบจะตัดยอดให้) + ตั้งค่า <strong>VAT / SC</strong> หรือใส่ส่วนลด/งบสปอนเซอร์
                </p>
              </div>
              <div className="mt-2.5 rounded-lg bg-amber-100/70 px-2 py-1 text-[10px] font-bold text-amber-900 text-center">
                💳 คุมยอด & ภาษีครบ
              </div>
            </div>

            {/* Step 7: Publish & Share */}
            <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-700 text-white text-xs font-black shadow-xs">
                    7
                  </span>
                  <Share2 className="h-4 w-4 text-blue-600" />
                </div>
                <h3 className="text-xs font-black text-slate-900 mb-1">
                  7. เปิดรับเงิน & ส่ง LINE
                </h3>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  กดปุ่ม <strong>"เปิดรับเงิน"</strong> แล้วกด <strong>"ส่ง LINE"</strong> ก๊อปปี้สรุปยอดพร้อมลิงก์ส่งเข้ากลุ่มเพื่อนได้ทันที
                </p>
              </div>
              <div className="mt-2.5 rounded-lg bg-blue-100/70 px-2 py-1 text-[10px] font-bold text-blue-900 text-center">
                🚀 ส่งลิงก์เข้ากลุ่ม
              </div>
            </div>

            {/* Step 8: Verify Slips */}
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-700 text-white text-xs font-black shadow-xs">
                    8
                  </span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
                <h3 className="text-xs font-black text-slate-900 mb-1">
                  8. ตรวจสลิป & ปิดยอด
                </h3>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  เมื่อเพื่อนแนบสลิปเข้ามา Host กดดูรูปสลิปและกด <strong>"ยืนยัน"</strong> เพื่อปิดยอดคนนั้นเป็นอันเสร็จสิ้น!
                </p>
              </div>
              <div className="mt-2.5 rounded-lg bg-emerald-100/70 px-2 py-1 text-[10px] font-bold text-emerald-900 text-center">
                ✅ ตรวจสอบสลิป 1-Click
              </div>
            </div>
          </div>

          {/* Pro Tips for Hosts */}
          <div className="rounded-2xl bg-teal-50/70 p-5 border border-teal-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-900 flex items-center space-x-1.5">
              <Sparkles className="h-4 w-4 text-teal-700" />
              <span>เคล็ดลับการจัดบิลขั้นเซียน (Host Pro Tips)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="rounded-xl bg-white p-3.5 border border-teal-100 shadow-2xs">
                <div className="font-bold text-slate-900 mb-1">🎁 Sponsor & เงินมัดจำ</div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  ถ้ามีคนช่วยออกเงิน (Sponsor) หรือมีการจ่ายเงินมัดจำล่วงหน้า ให้กรอกยอด ระบบจะหักลดจากยอดอาหารกองกลางให้อัตโนมัติ
                </p>
              </div>

              <div className="rounded-xl bg-white p-3.5 border border-teal-100 shadow-2xs">
                <div className="font-bold text-slate-900 mb-1">👑 แขก VIP กินฟรี [Tag F]</div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  คนที่ให้กินฟรี (เช่น เจ้าของวันเกิด/น้องฝึกงาน) ให้เปิดสวิตช์ <strong>[F] กินฟรี</strong> ที่การ์ดสมาชิก ระบบจะตัดตัวหารออกให้อัตโนมัติ
                </p>
              </div>

              <div className="rounded-xl bg-white p-3.5 border border-teal-100 shadow-2xs">
                <div className="font-bold text-slate-900 mb-1">🔍 ตรวจสลิปแบบ 1-Click</div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  ในตารางสรุปยอด สามารถกดที่รูปสลิปเพื่อตรวจเช็กยอดโอน และกด <strong>"ยืนยัน"</strong> เพื่อปิดยอดของคนนั้นได้ทันที
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 p-4 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-teal-700 px-6 py-2.5 text-xs font-bold text-white hover:bg-teal-800 transition shadow-xs"
          >
            เข้าใจแล้ว เริ่มจัดการบิลเลย!
          </button>
        </div>
      </div>
    </div>
  );
};
