'use client';

import React, { useState } from 'react';
import { X, Lock, Mail, User, Phone, QrCode, LogIn, UserPlus, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'signin',
}) => {
  const { signIn, signUp, isSupabaseActive } = useAuth();
  const [tab, setTab] = useState<'signin' | 'signup'>(defaultTab);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [defaultPromptPay, setDefaultPromptPay] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      if (tab === 'signin') {
        const res = await signIn(email.trim(), password);
        if (res.success) {
          onClose();
        } else {
          setErrorMessage(res.error || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
        }
      } else {
        if (!firstName.trim()) {
          setErrorMessage('กรุณาระบุชื่อของคุณ');
          setIsLoading(false);
          return;
        }

        const res = await signUp(
          email.trim(),
          password,
          firstName.trim(),
          lastName.trim(),
          phoneNumber.trim(),
          defaultPromptPay.trim()
        );

        if (res.success) {
          onClose();
        } else {
          setErrorMessage(res.error || 'ไม่สามารถสมัครสมาชิกได้');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-700 shadow-xs">
              <Lock className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {tab === 'signin' ? 'เข้าสู่ระบบ Host (คนจัดการบิล)' : 'สมัครสมาชิก Host ใหม่'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {isSupabaseActive ? 'เชื่อมต่อ Supabase Cloud Database' : 'ระบบ Host จัดการประวัติปาร์ตี้'}
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

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 border-b border-slate-100 bg-slate-50 p-1">
          <button
            type="button"
            onClick={() => {
              setTab('signin');
              setErrorMessage('');
            }}
            className={`flex items-center justify-center space-x-1.5 py-2 text-xs font-bold rounded-lg transition ${
              tab === 'signin'
                ? 'bg-white text-teal-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>เข้าสู่ระบบ</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('signup');
              setErrorMessage('');
            }}
            className={`flex items-center justify-center space-x-1.5 py-2 text-xs font-bold rounded-lg transition ${
              tab === 'signup'
                ? 'bg-white text-teal-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>สมัครสมาชิก Host</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-3.5">
          {errorMessage && (
            <div className="flex items-center space-x-2 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {tab === 'signup' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  ชื่อจริง *
                </label>
                <div className="relative">
                  <User className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="สอ"
                    className="w-full rounded-xl border border-slate-300 bg-white pl-8 pr-2.5 py-1.5 text-xs text-slate-900 focus:border-teal-600 focus:outline-none shadow-2xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  นามสกุล
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="เหรัญญิก"
                  className="w-full rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-teal-600 focus:outline-none shadow-2xs"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              อีเมล (Email) *
            </label>
            <div className="relative">
              <Mail className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="youremail@example.com"
                className="w-full rounded-xl border border-slate-300 bg-white pl-8 pr-2.5 py-1.5 text-xs text-slate-900 focus:border-teal-600 focus:outline-none shadow-2xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              รหัสผ่าน (Password) *
            </label>
            <div className="relative">
              <Lock className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="อย่างน้อย 6 ตัวอักษร"
                className="w-full rounded-xl border border-slate-300 bg-white pl-8 pr-2.5 py-1.5 text-xs text-slate-900 focus:border-teal-600 focus:outline-none shadow-2xs"
              />
            </div>
          </div>

          {tab === 'signup' && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  เบอร์โทรศัพท์
                </label>
                <div className="relative">
                  <Phone className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="0812345678"
                    className="w-full rounded-xl border border-slate-300 bg-white pl-8 pr-2.5 py-1.5 text-xs text-slate-900 focus:border-teal-600 focus:outline-none font-mono shadow-2xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  พร้อมเพย์เริ่มต้น
                </label>
                <div className="relative">
                  <QrCode className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={defaultPromptPay}
                    onChange={(e) => setDefaultPromptPay(e.target.value)}
                    placeholder="0812345678"
                    className="w-full rounded-xl border border-slate-300 bg-white pl-8 pr-2.5 py-1.5 text-xs text-teal-800 focus:border-teal-600 focus:outline-none font-mono shadow-2xs"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-teal-700 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-teal-800 disabled:opacity-50 transition"
            >
              {isLoading
                ? 'กำลังดำเนินการ...'
                : tab === 'signin'
                ? 'เข้าสู่ระบบ Host'
                : 'ยืนยันการสมัครสมาชิก'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
