'use client';

import React, { useState } from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Image as ImageIcon,
  Sparkles,
  Search,
  Check,
  CreditCard,
} from 'lucide-react';
import { PartyBill, CalculationResult, Member } from '@/lib/types';
import { formatTHB } from '@/lib/calculator';

interface SheetSummaryTableProps {
  bill: PartyBill;
  calculation: CalculationResult;
  onUpdateBill: (updated: Partial<PartyBill>) => void;
  onViewSlip: (member: Member) => void;
  readOnly?: boolean;
}

export const SheetSummaryTable: React.FC<SheetSummaryTableProps> = ({
  bill,
  calculation,
  onUpdateBill,
  onViewSlip,
  readOnly = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const toggleVerify = (memberId: string) => {
    if (readOnly) return;
    const updated = bill.members.map((m) => {
      if (m.id === memberId) {
        const nextStatus = m.paymentStatus === 'VERIFIED' ? 'PENDING' : 'VERIFIED';
        return { ...m, paymentStatus: nextStatus as any };
      }
      return m;
    });
    onUpdateBill({ members: updated });
  };

  const filteredMembers = bill.members.filter((m) =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const payingMembers = bill.members.filter((m) => !m.isFree);
  const verifiedCount = payingMembers.filter((m) => m.paymentStatus === 'VERIFIED').length;
  const slipCount = payingMembers.filter((m) => m.paymentStatus === 'SLIP_UPLOADED').length;

  return (
    <div className="space-y-4">
      {/* Table Top Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700">
            <FileSpreadsheet className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              ตารางสรุปยอดแยกแก๊ง
            </h3>
            <p className="text-xs text-slate-500">
              แจกแจงค่าอาหารกองกลางและแต่ละแก๊งรายบุคคล พร้อมระบบเช็กสลิป
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-2xs">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
            <span className="font-semibold">ตรวจแล้ว {verifiedCount}/{payingMembers.length} คน</span>
            {slipCount > 0 && (
              <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-300">
                รอตรวจ {slipCount}
              </span>
            )}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาชื่อ..."
              className="w-44 rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:outline-none shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* Spreadsheet Matrix Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold sticky top-0">
              <tr>
                <th className="p-3 border-r border-slate-200 min-w-[150px]">
                  ชื่อผู้ร่วมงาน
                </th>
                <th className="p-3 border-r border-slate-200 text-right min-w-[110px] text-slate-700">
                  📦 [1] กองกลาง
                </th>
                {bill.gangs.map((gang) => (
                  <th
                    key={gang.id}
                    className="p-3 border-r border-slate-200 text-right min-w-[120px] text-teal-900 bg-teal-50/50"
                  >
                    👥 {gang.name}
                  </th>
                ))}
                <th className="p-3 border-r border-slate-200 text-right min-w-[130px] bg-emerald-50/70 text-emerald-900 font-bold">
                  💰 ยอดสุทธิ
                </th>
                <th className="p-3 text-center min-w-[140px]">
                  สถานะการชำระ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredMembers.map((member) => {
                const breakdown = calculation.membersBreakdown[member.id];

                return (
                  <tr
                    key={member.id}
                    className={`transition-colors ${
                      member.isFree
                        ? 'bg-amber-50/40 hover:bg-amber-50/70'
                        : member.paymentStatus === 'VERIFIED'
                        ? 'bg-emerald-50/30 hover:bg-emerald-50/50'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Member Name */}
                    <td className="p-3 font-bold text-slate-900 border-r border-slate-200">
                      <div className="flex items-center space-x-1.5">
                        <span>{member.name}</span>
                        {member.isFree && (
                          <span className="inline-flex items-center rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-300">
                            <Sparkles className="h-2.5 w-2.5 mr-0.5 text-amber-600" />
                            [F] ฟรี
                          </span>
                        )}
                      </div>
                      {member.note && (
                        <p className="text-[10px] text-slate-400 font-normal line-clamp-1">
                          {member.note}
                        </p>
                      )}
                    </td>

                    {/* Common Share */}
                    <td className="p-3 text-right font-mono border-r border-slate-200 text-slate-600 font-semibold">
                      {member.isFree ? (
                        <span className="text-amber-600 font-bold">0.00</span>
                      ) : (
                        formatTHB(breakdown?.commonShare || 0)
                      )}
                    </td>

                    {/* Each Gang Share */}
                    {bill.gangs.map((gang) => {
                      const isInGang = (member.gangIds || []).includes(gang.id);
                      const gBreakdown = calculation.gangsBreakdown[gang.id];
                      const gangShare = isInGang ? (member.isFree ? 0 : gBreakdown?.sharePerPerson || 0) : null;

                      return (
                        <td
                          key={gang.id}
                          className={`p-3 text-right font-mono border-r border-slate-200 ${
                            isInGang ? 'text-teal-900 font-bold bg-teal-50/30' : 'text-slate-400'
                          }`}
                        >
                          {isInGang ? (
                            member.isFree ? (
                              <span className="text-amber-600">0.00</span>
                            ) : (
                              formatTHB(gangShare || 0)
                            )
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      );
                    })}

                    {/* Total Net Payable */}
                    <td className="p-3 text-right font-bold text-sm font-mono border-r border-slate-200 bg-emerald-50/40">
                      {member.isFree ? (
                        <span className="text-amber-700">0.00 👑</span>
                      ) : (
                        <span className="text-slate-900">
                          {formatTHB(breakdown?.totalPayable || 0)}
                        </span>
                      )}
                    </td>

                    {/* Status & Slip Action */}
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        {member.isFree ? (
                          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-900 border border-amber-300">
                            👑 เลี้ยงฟรี
                          </span>
                        ) : (member.isPayer || member.id === bill.payerMemberId) ? (
                          <span className="inline-flex items-center space-x-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-900 border border-emerald-300 shadow-2xs">
                            <CreditCard className="h-3 w-3 text-emerald-700" />
                            <span>💳 คนสำรองจ่าย</span>
                          </span>
                        ) : member.paymentStatus === 'VERIFIED' ? (
                          <button
                            type="button"
                            disabled={readOnly}
                            onClick={() => !readOnly && toggleVerify(member.id)}
                            className={`inline-flex items-center space-x-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800 border border-emerald-300 ${
                              readOnly ? 'cursor-default' : 'hover:bg-emerald-200 transition'
                            }`}
                            title={readOnly ? 'ชำระและตรวจสอบแล้ว' : 'คลิกเพื่อเปลี่ยนสถานะ'}
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            <span>ชำระแล้ว</span>
                          </button>
                        ) : member.paymentStatus === 'SLIP_UPLOADED' ? (
                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => onViewSlip(member)}
                              className="inline-flex items-center space-x-1 rounded-full bg-amber-100 px-2 py-1 text-[11px] font-bold text-amber-900 border border-amber-300 hover:bg-amber-200 transition"
                              title="ดูรูปสลิป"
                            >
                              <ImageIcon className="h-3 w-3 text-amber-700" />
                              <span>ดูสลิป</span>
                            </button>
                            {!readOnly && (
                              <button
                                type="button"
                                onClick={() => toggleVerify(member.id)}
                                className="rounded bg-emerald-600 p-1 text-white hover:bg-emerald-700"
                                title="ยืนยันการชำระเงิน"
                              >
                                <Check className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={readOnly}
                            onClick={() => !readOnly && toggleVerify(member.id)}
                            className={`inline-flex items-center space-x-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 border border-slate-200 ${
                              readOnly ? 'cursor-default' : 'hover:bg-slate-200 hover:text-slate-900 transition'
                            }`}
                            title={readOnly ? 'รอชำระเงิน' : 'คลิกเพื่อทำเครื่องหมายว่าชำระแล้ว'}
                          >
                            <Clock className="h-3 w-3" />
                            <span>รอชำระ</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Table Footer: Column Subtotals */}
            <tfoot className="border-t-2 border-slate-300 bg-slate-100 font-bold text-slate-900">
              <tr>
                <td className="p-3 border-r border-slate-200">
                  รวมทั้งสิ้น ({bill.members.length} คน)
                </td>
                <td className="p-3 text-right font-mono border-r border-slate-200 text-slate-700">
                  {formatTHB(calculation.effectiveCommonTotal)}
                </td>
                {bill.gangs.map((gang) => {
                  const gBreakdown = calculation.gangsBreakdown[gang.id];
                  return (
                    <td
                      key={gang.id}
                      className="p-3 text-right font-mono border-r border-slate-200 text-teal-900"
                    >
                      {formatTHB(gBreakdown?.effectiveTotal || 0)}
                    </td>
                  );
                })}
                <td className="p-3 text-right font-mono border-r border-slate-200 text-slate-900 text-sm">
                  {formatTHB(calculation.sumTotalPayable)}
                </td>
                <td className="p-3 text-center text-xs text-slate-500 font-normal">
                  (งบ +{formatTHB(bill.sponsorBudget || 0)})
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
