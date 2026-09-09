'use client';

import React, { useState } from 'react';
import { X, Plus, Calendar, MapPin, QrCode, Gift, Check } from 'lucide-react';
import { PartyBill, Gang } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';

interface NewBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (newBill: PartyBill) => void;
}

export const NewBillModal: React.FC<NewBillModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const { hostUser } = useAuth();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState('');
  const [promptPayNumber, setPromptPayNumber] = useState(hostUser?.defaultPromptPay || '0891234567');
  const [promptPayName, setPromptPayName] = useState(hostUser ? `${hostUser.firstName} (เหรัญญิก)` : '');
  const [sponsorBudget, setSponsorBudget] = useState<number>(0);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const defaultGangs: Gang[] = [
      { id: `gang-a-${Date.now()}`, name: 'แก๊ง A (แอลกอฮอล์)', colorTag: 'amber' },
      { id: `gang-b-${Date.now()}`, name: 'แก๊ง B (เบียร์สด)', colorTag: 'emerald' },
      { id: `gang-g-${Date.now()}`, name: 'แก๊ง G (ของหวาน/ไอติม)', colorTag: 'rose' },
    ];

    const newBill: PartyBill = {
      id: `party-${Date.now()}`,
      title: title.trim(),
      date,
      location: location.trim(),
      vatMode: 'INCLUDE',
      vatRate: 0.07,
      sponsorBudget: Number(sponsorBudget) || 0,
      promptPayNumber: promptPayNumber.trim(),
      promptPayName: promptPayName.trim(),
      hostPin: '1234',
      isPublished: false,
      gangs: defaultGangs,
      members: [
        {
          id: `m-host-${Date.now()}`,
          name: hostUser ? hostUser.firstName : 'Host (ฉัน)',
          gangIds: [],
          isFree: false,
          paymentStatus: 'PENDING',
          note: 'ผู้จัดการบิล',
        },
      ],
      items: [],
    };

    onCreate(newBill);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-700 shadow-xs">
              <Plus className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                สร้างบิลปาร์ตี้งานใหม่
              </h3>
              <p className="text-[11px] text-slate-500">
                ตั้งค่างานและเริ่มสแกนบิลหรือเพิ่มอาหาร
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ชื่องานปาร์ตี้ / โอกาส *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น ปาร์ตี้วันเกิดมุก, เลี้ยงส่งทีมพัฒนา"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-teal-600 focus:outline-none shadow-2xs"
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
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-teal-600 focus:outline-none shadow-2xs"
              />
            </div>
            <div>
              <label className="flex items-center space-x-1 text-xs font-medium text-slate-600 mb-1">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                <span>สถานที่</span>
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="ชื่อร้านอาหาร"
                className="w-full rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-teal-600 focus:outline-none shadow-2xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="flex items-center space-x-1 text-xs font-bold text-slate-700 mb-1">
                <QrCode className="h-3.5 w-3.5 text-teal-600" />
                <span>เบอร์พร้อมเพย์</span>
              </label>
              <input
                type="text"
                value={promptPayNumber}
                onChange={(e) => setPromptPayNumber(e.target.value)}
                placeholder="0812345678"
                className="w-full rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-teal-800 font-mono font-semibold focus:border-teal-600 focus:outline-none shadow-2xs"
              />
            </div>
            <div>
              <label className="flex items-center space-x-1 text-xs font-bold text-amber-900 mb-1">
                <Gift className="h-3.5 w-3.5 text-amber-600" />
                <span>งบ Sponsor (บาท)</span>
              </label>
              <input
                type="number"
                min={0}
                step={100}
                value={sponsorBudget === 0 ? '' : sponsorBudget}
                onChange={(e) => {
                  const val = e.target.value;
                  setSponsorBudget(val === '' ? 0 : Math.max(0, Number(val)));
                }}
                placeholder="0"
                className="w-full rounded-xl border border-amber-300 bg-amber-50/50 px-2.5 py-1.5 text-xs text-amber-900 font-mono font-bold focus:border-amber-600 focus:outline-none shadow-2xs"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex items-center space-x-1.5 rounded-xl bg-teal-700 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-teal-800"
            >
              <Check className="h-3.5 w-3.5" />
              <span>เริ่มสร้างบิล</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
