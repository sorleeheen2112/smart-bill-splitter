'use client';

import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { BillItem, Gang } from '@/lib/types';

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: BillItem) => void;
  editingItem: BillItem | null;
  gangs: Gang[];
  defaultAssignedTo?: string;
}

export const ItemModal: React.FC<ItemModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingItem,
  gangs,
  defaultAssignedTo = 'COMMON',
}) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [assignedTo, setAssignedTo] = useState<string>('COMMON');
  const [category, setCategory] = useState<string>('อาหาร');

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name);
      setPrice(editingItem.price);
      setQuantity(editingItem.quantity || 1);
      setAssignedTo(editingItem.assignedTo || 'COMMON');
      setCategory(editingItem.category || 'อาหาร');
    } else {
      setName('');
      setPrice('');
      setQuantity(1);
      setAssignedTo(defaultAssignedTo);
      setCategory('อาหาร');
    }
  }, [editingItem, defaultAssignedTo, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || price === '' || Number(price) <= 0) {
      alert('กรุณากรอกชื่อรายการอาหารและราคาให้ถูกต้อง');
      return;
    }

    const itemToSave: BillItem = {
      id: editingItem ? editingItem.id : `item-${Date.now()}`,
      name: name.trim(),
      price: Number(price),
      quantity: Number(quantity) || 1,
      assignedTo,
      category,
    };

    onSave(itemToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900">
            {editingItem ? '✏️ แก้ไขรายการอาหาร' : '➕ เพิ่มรายการอาหารใหม่'}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ชื่ออาหาร / เครื่องดื่ม
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น ต้มยำกุ้ง, เบียร์สิงห์ ทาวเวอร์"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none shadow-2xs"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                จำนวน (ชิ้น/จาน)
              </label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none shadow-2xs font-mono text-center font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ราคาต่อหน่วย
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0.00"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-teal-800 focus:border-teal-600 focus:outline-none shadow-2xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ราคารวมแถวนี้
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={price === '' ? '' : Number((Number(price) * (quantity || 1)).toFixed(2))}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    setPrice('');
                  } else {
                    const totalVal = Number(val) || 0;
                    setPrice(totalVal / (quantity || 1));
                  }
                }}
                placeholder="0.00"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none shadow-2xs font-mono font-bold"
                title="แก้ไขราคารวมตรงนี้ ระบบจะคำนวณราคาต่อหน่วยให้อัตโนมัติ"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                หมวดหมู่
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-teal-600 focus:outline-none shadow-2xs"
              >
                <option value="อาหาร">🍲 อาหาร</option>
                <option value="เครื่องดื่ม">🥤 เครื่องดื่ม</option>
                <option value="เครื่องดื่มแอลกอฮอล์">🍺 แอลกอฮอล์</option>
                <option value="มิกเซอร์">🧊 มิกเซอร์</option>
                <option value="ของหวาน">🍨 ของหวาน</option>
                <option value="อื่นๆ">📦 อื่นๆ</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                จัดเข้าก้อนอาหาร
              </label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full rounded-xl border border-teal-300 bg-teal-50/50 px-3 py-2 text-xs text-teal-900 font-bold focus:border-teal-600 focus:outline-none shadow-2xs"
              >
                <option value="COMMON">📦 [1] กองกลาง / ส่วนรวม</option>
                {gangs.map((gang) => (
                  <option key={gang.id} value={gang.id}>
                    👥 {gang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex items-center space-x-1.5 rounded-xl bg-teal-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-teal-800"
            >
              <Save className="h-3.5 w-3.5" />
              <span>บันทึก</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
