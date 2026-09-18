'use client';

import React from 'react';
import { QrCode, Percent, Gift, Calendar, MapPin, DollarSign, Users, Award, Lock, CreditCard } from 'lucide-react';
import { PartyBill, CalculationResult } from '@/lib/types';
import { formatTHB } from '@/lib/calculator';

interface HeaderSettingsProps {
  bill: PartyBill;
  calculation: CalculationResult;
  onUpdateBill: (updated: Partial<PartyBill>) => void;
  readOnly?: boolean;
}

export const HeaderSettings: React.FC<HeaderSettingsProps> = ({
  bill,
  calculation,
  onUpdateBill,
  readOnly = false,
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
      {/* Top Banner with Quick Financial Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 mb-6">
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>ยอดรวมบิลทั้งโต๊ะ</span>
            <DollarSign className="h-4 w-4 text-slate-700" />
          </div>
          <div className="mt-1 text-lg font-bold text-slate-900 sm:text-xl font-mono">
            {formatTHB(calculation.effectiveGrandTotal)}
          </div>
          <div className="text-[11px] text-slate-500 font-medium truncate">
            {bill.vatMode === 'EXCLUDE' ? (
              <span>
                อาหาร {formatTHB(calculation.rawGrandTotal)}
                {(bill.serviceChargeRate || 0) > 0 && ` + SC ${((bill.serviceChargeRate || 0) * 100).toFixed(0)}%`}
                {` + VAT ${((bill.vatRate || 0.07) * 100).toFixed(0)}%`}
              </span>
            ) : (
              'ราคาสุทธิ (Net Include)'
            )}
          </div>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5">
          <div className="flex items-center justify-between text-xs text-amber-800 font-semibold">
            <span>งบสนับสนุน (Sponsor)</span>
            <Gift className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-1 text-lg font-bold text-amber-900 sm:text-xl font-mono">
            {formatTHB(bill.sponsorBudget || 0)}
          </div>
          <span className="text-[11px] text-amber-700/80 font-medium">
            หักลดจากยอดกองกลาง
          </span>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3.5">
          <div className="flex items-center justify-between text-xs text-blue-800 font-semibold">
            <span>เงินมัดจำ (Deposit)</span>
            <CreditCard className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-1 text-lg font-bold text-blue-900 sm:text-xl font-mono">
            {formatTHB(bill.depositAmount || 0)}
          </div>
          <span className="text-[11px] text-blue-700/80 font-medium">
            หักลดจากยอดกองกลาง
          </span>
        </div>

        <div className="rounded-xl border border-teal-200 bg-teal-50/70 p-3.5">
          <div className="flex items-center justify-between text-xs text-teal-800 font-semibold">
            <span>ยอดสุทธิที่ต้องหาร</span>
            <Award className="h-4 w-4 text-teal-600" />
          </div>
          <div className="mt-1 text-lg font-bold text-teal-900 sm:text-xl font-mono">
            {formatTHB(calculation.sumTotalPayable)}
          </div>
          <span className="text-[11px] text-teal-700/80 font-medium">
            หารเฉลี่ยตามแก๊ง & กองกลาง
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>จำนวนผู้ร่วมงาน</span>
            <Users className="h-4 w-4 text-slate-700" />
          </div>
          <div className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
            {bill.members.length} คน
          </div>
          <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 font-medium truncate">
            <span>หารจริง {calculation.payingCommonMembersCount}</span>
            <span>•</span>
            <span className="text-amber-700 font-semibold">
              ฟรี {bill.members.filter((m) => m.isFree).length} (F)
            </span>
          </div>
        </div>
      </div>

      {/* Main Settings Form */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Title, Date, Location */}
        <div className="space-y-3 lg:col-span-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ชื่องานปาร์ตี้ / บิล
            </label>
            <input
              type="text"
              disabled={readOnly}
              value={bill.title}
              onChange={(e) => onUpdateBill({ title: e.target.value })}
              placeholder="เช่น ปาร์ตี้ฉลองปิดโปรเจกต์"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 transition shadow-2xs disabled:bg-slate-50 disabled:text-slate-700 disabled:cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="flex items-center space-x-1 text-xs font-medium text-slate-600 mb-1">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>วันที่</span>
              </label>
              <input
                type="date"
                disabled={readOnly}
                value={bill.date}
                onChange={(e) => onUpdateBill({ date: e.target.value })}
                className="w-full rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-teal-600 focus:outline-none transition shadow-2xs disabled:bg-slate-50 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="flex items-center space-x-1 text-xs font-medium text-slate-600 mb-1">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                <span>สถานที่ / ร้าน</span>
              </label>
              <input
                type="text"
                disabled={readOnly}
                value={bill.location || ''}
                onChange={(e) => onUpdateBill({ location: e.target.value })}
                placeholder="ชื่อร้านอาหาร"
                className="w-full rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-teal-600 focus:outline-none transition shadow-2xs disabled:bg-slate-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* PromptPay Info & Payer */}
        <div className="space-y-3 lg:col-span-4">
          <div>
            <label className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
              <span className="flex items-center space-x-1.5">
                <CreditCard className="h-3.5 w-3.5 text-teal-600" />
                <span>คนออกเงินสำรองจ่ายหน้าร้าน (Payer)</span>
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                จ่ายอัตโนมัติ 100%
              </span>
            </label>
            <select
              disabled={readOnly}
              value={bill.payerMemberId || ''}
              onChange={(e) => {
                const selectedId = e.target.value;
                const updatedMembers = bill.members.map((m) => {
                  if (m.id === selectedId) {
                    return { ...m, isPayer: true, paymentStatus: 'VERIFIED' as const };
                  }
                  return { ...m, isPayer: false };
                });
                const selectedMember = bill.members.find((m) => m.id === selectedId);
                onUpdateBill({
                  payerMemberId: selectedId,
                  members: updatedMembers,
                  promptPayName: selectedMember ? selectedMember.name : bill.promptPayName,
                });
              }}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-teal-900 focus:border-teal-600 focus:outline-none transition shadow-2xs disabled:bg-slate-50 disabled:cursor-not-allowed"
            >
              <option value="">-- เลือกคนที่จ่ายเงินให้ร้าน --</option>
              {bill.members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} {m.id === bill.payerMemberId ? '💳 (คนสำรองจ่าย)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 mb-1">
              <QrCode className="h-3.5 w-3.5 text-teal-600" />
              <span>เบอร์พร้อมเพย์ / เลขบัตรประชาชน (ผู้รับเงิน)</span>
            </label>
            <input
              type="text"
              disabled={readOnly}
              value={bill.promptPayNumber}
              onChange={(e) => onUpdateBill({ promptPayNumber: e.target.value })}
              placeholder="เช่น 0812345678"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-teal-800 font-mono font-semibold placeholder-slate-400 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 transition shadow-2xs disabled:bg-slate-50 disabled:cursor-not-allowed"
            />
          </div>

          <div className={`grid ${readOnly ? 'grid-cols-1' : 'grid-cols-2'} gap-2`}>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                ชื่อบัญชีพร้อมเพย์ (ผู้รับ)
              </label>
              <input
                type="text"
                disabled={readOnly}
                value={bill.promptPayName || ''}
                onChange={(e) => onUpdateBill({ promptPayName: e.target.value })}
                placeholder="เช่น นายสอ (เหรัญญิก)"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:outline-none transition shadow-2xs disabled:bg-slate-50 disabled:cursor-not-allowed"
              />
            </div>
            {!readOnly && (
              <div>
                <label className="flex items-center space-x-1 text-xs font-medium text-amber-800 mb-1">
                  <Lock className="h-3.5 w-3.5 text-amber-600" />
                  <span>รหัส PIN ควบคุมบิล</span>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={bill.hostPin || '1234'}
                  onChange={(e) => onUpdateBill({ hostPin: e.target.value })}
                  placeholder="1234"
                  title="รหัส PIN 4-6 หลัก สำหรับใช้ปลดล็อกสิทธิ์ Host"
                  className="w-full rounded-xl border border-amber-300 bg-amber-50/50 px-3 py-1.5 text-xs font-mono font-bold text-amber-900 text-center tracking-widest focus:border-amber-600 focus:outline-none transition shadow-2xs"
                />
              </div>
            )}
          </div>
        </div>

        {/* VAT Mode, Service Charge & Sponsor Budget */}
        <div className="space-y-3 lg:col-span-4">
          <div className="grid grid-cols-2 gap-2">
            {/* VAT Mode */}
            <div>
              <label className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                <span className="flex items-center space-x-1">
                  <Percent className="h-3.5 w-3.5 text-teal-600" />
                  <span>ภาษี VAT (7%)</span>
                </span>
              </label>
              <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200">
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => onUpdateBill({ vatMode: 'INCLUDE' })}
                  title="ราคารวมภาษีแล้ว"
                  className={`rounded-lg py-1.5 text-xs font-semibold transition ${
                    bill.vatMode === 'INCLUDE'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  } ${readOnly ? 'cursor-default' : ''}`}
                >
                  รวมแล้ว (Net)
                </button>
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => onUpdateBill({ vatMode: 'EXCLUDE' })}
                  title="ราคาบวกเพิ่ม VAT 7%"
                  className={`rounded-lg py-1.5 text-xs font-semibold transition ${
                    bill.vatMode === 'EXCLUDE'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  } ${readOnly ? 'cursor-default' : ''}`}
                >
                  +7% VAT
                </button>
              </div>
            </div>

            {/* Service Charge */}
            <div>
              <label className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Service Charge</span>
                <span className="text-[10px] text-teal-700 font-semibold">
                  {(bill.serviceChargeRate || 0) > 0 ? `${((bill.serviceChargeRate || 0) * 100).toFixed(0)}%` : 'ไม่มี'}
                </span>
              </label>
              <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200">
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => onUpdateBill({ serviceChargeRate: 0 })}
                  className={`rounded-lg py-1.5 text-xs font-semibold transition ${
                    !bill.serviceChargeRate || bill.serviceChargeRate === 0
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  } ${readOnly ? 'cursor-default' : ''}`}
                >
                  0%
                </button>
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => onUpdateBill({ serviceChargeRate: 0.10 })}
                  title="มาตรฐานร้านอาหารทั่วไป 10%"
                  className={`rounded-lg py-1.5 text-xs font-semibold transition ${
                    bill.serviceChargeRate === 0.10
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  } ${readOnly ? 'cursor-default' : ''}`}
                >
                  10%
                </button>
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => onUpdateBill({ serviceChargeRate: 0.05 })}
                  title="ค่าบริการ 5%"
                  className={`rounded-lg py-1.5 text-xs font-semibold transition ${
                    bill.serviceChargeRate === 0.05
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  } ${readOnly ? 'cursor-default' : ''}`}
                >
                  5%
                </button>
              </div>
            </div>
          </div>

          {/* Sponsor Budget & Deposit Amount Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="flex items-center justify-between text-xs font-bold text-amber-900 mb-1">
                <span className="flex items-center space-x-1 truncate">
                  <Gift className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  <span className="truncate">งบ Sponsor</span>
                </span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  disabled={readOnly}
                  min={0}
                  step={50}
                  value={bill.sponsorBudget === 0 ? '' : bill.sponsorBudget}
                  onChange={(e) => {
                    const val = e.target.value;
                    onUpdateBill({ sponsorBudget: val === '' ? 0 : Math.max(0, Number(val)) });
                  }}
                  placeholder="0"
                  className="w-full rounded-xl border border-amber-300 bg-amber-50/50 px-3 py-1.5 text-sm font-bold text-amber-900 font-mono placeholder-amber-400 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600 transition shadow-2xs disabled:bg-slate-50 disabled:border-slate-300 disabled:text-slate-700 disabled:cursor-not-allowed pr-10"
                />
                <span className="absolute right-2.5 top-2 text-[11px] font-semibold text-amber-700">
                  บาท
                </span>
              </div>
            </div>

            <div>
              <label className="flex items-center justify-between text-xs font-bold text-blue-900 mb-1">
                <span className="flex items-center space-x-1 truncate">
                  <CreditCard className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                  <span className="truncate">เงินมัดจำ</span>
                </span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  disabled={readOnly}
                  min={0}
                  step={50}
                  value={!bill.depositAmount || bill.depositAmount === 0 ? '' : bill.depositAmount}
                  onChange={(e) => {
                    const val = e.target.value;
                    onUpdateBill({ depositAmount: val === '' ? 0 : Math.max(0, Number(val)) });
                  }}
                  placeholder="0"
                  className="w-full rounded-xl border border-blue-300 bg-blue-50/50 px-3 py-1.5 text-sm font-bold text-blue-900 font-mono placeholder-blue-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition shadow-2xs disabled:bg-slate-50 disabled:border-slate-300 disabled:text-slate-700 disabled:cursor-not-allowed pr-10"
                />
                <span className="absolute right-2.5 top-2 text-[11px] font-semibold text-blue-700">
                  บาท
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
