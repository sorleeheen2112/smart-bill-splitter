'use client';

import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { GripVertical, Plus, Trash2, Edit2, ArrowRightLeft, Copy } from 'lucide-react';
import { BillItem, PartyBill, CalculationResult } from '@/lib/types';
import { formatTHB, getItemEffectivePrice } from '@/lib/calculator';
import { DuplicateItemModal } from './DuplicateItemModal';

interface BoardViewProps {
  bill: PartyBill;
  calculation: CalculationResult;
  onUpdateBill: (updated: Partial<PartyBill>) => void;
  onEditItem: (item: BillItem) => void;
  onAddNewItem: (assignedTo: string) => void;
  readOnly?: boolean;
}

export const BoardView: React.FC<BoardViewProps> = ({
  bill,
  calculation,
  onUpdateBill,
  onEditItem,
  onAddNewItem,
  readOnly = false,
}) => {
  const [itemToSplit, setItemToSplit] = useState<BillItem | null>(null);
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const targetAssignedTo = destination.droppableId;

    const updatedItems = bill.items.map((item) => {
      if (item.id === draggableId) {
        return {
          ...item,
          assignedTo: targetAssignedTo,
        };
      }
      return item;
    });

    onUpdateBill({ items: updatedItems });
  };

  const handleDeleteItem = (itemId: string) => {
    onUpdateBill({
      items: bill.items.filter((it) => it.id !== itemId),
    });
  };

  const handleQuickMove = (itemId: string, newAssignedTo: string) => {
    onUpdateBill({
      items: bill.items.map((it) => (it.id === itemId ? { ...it, assignedTo: newAssignedTo } : it)),
    });
  };

  const handleDuplicateItem = (itemToDuplicate: BillItem) => {
    const currentQty = itemToDuplicate.quantity || 1;
    if (currentQty <= 1) return;

    if (currentQty === 2) {
      // 1-click split into 1 and 1 directly (no modal needed)
      const newId = `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newItem: BillItem = {
        ...itemToDuplicate,
        id: newId,
        quantity: 1,
      };

      const updatedItems = bill.items.flatMap((it) => {
        if (it.id === itemToDuplicate.id) {
          return [{ ...it, quantity: 1 }, newItem];
        }
        return [it];
      });

      onUpdateBill({ items: updatedItems });
      setHighlightedItemId(newId);
      setTimeout(() => setHighlightedItemId(null), 2000);
    } else {
      // More than 2 pieces: open options modal
      setItemToSplit(itemToDuplicate);
    }
  };

  const handleConfirmSplit = (item: BillItem, splitQty: number) => {
    const currentQty = item.quantity || 1;
    if (splitQty <= 0 || splitQty >= currentQty) return;

    const newId = `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newItem: BillItem = {
      ...item,
      id: newId,
      quantity: splitQty,
    };

    const updatedItems = bill.items.flatMap((it) => {
      if (it.id === item.id) {
        return [{ ...it, quantity: currentQty - splitQty }, newItem];
      }
      return [it];
    });

    onUpdateBill({ items: updatedItems });
    setHighlightedItemId(newId);
    setTimeout(() => setHighlightedItemId(null), 2000);
  };

  const handleConfirmSplitAll = (item: BillItem) => {
    const currentQty = item.quantity || 1;
    if (currentQty <= 1) return;

    const newItems: BillItem[] = Array.from({ length: currentQty - 1 }).map((_, idx) => ({
      ...item,
      id: `item-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
      quantity: 1,
    }));

    const updatedItems = bill.items.flatMap((it) => {
      if (it.id === item.id) {
        return [{ ...it, quantity: 1 }, ...newItems];
      }
      return [it];
    });

    onUpdateBill({ items: updatedItems });
  };

  const handleConfirmClone = (item: BillItem) => {
    const newId = `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newItem: BillItem = {
      ...item,
      id: newId,
    };

    const updatedItems = bill.items.flatMap((it) => {
      if (it.id === item.id) {
        return [it, newItem];
      }
      return [it];
    });

    onUpdateBill({ items: updatedItems });
    setHighlightedItemId(newId);
    setTimeout(() => setHighlightedItemId(null), 2000);
  };

  const columns = [
    {
      id: 'COMMON',
      name: '📦 [1] กองกลาง / ส่วนรวม',
      description: 'ทุกคนช่วยกันหาร (หักงบ Sponsor & มัดจำ ก่อนหาร)',
      colorClass: 'border-slate-300 bg-slate-100/80',
      headerBg: 'bg-white text-slate-900 border-slate-200',
      items: bill.items.filter((it) => !it.assignedTo || it.assignedTo === 'COMMON'),
      effectiveTotal: calculation.effectiveCommonTotal,
      membersCount: calculation.payingCommonMembersCount,
    },
    ...bill.gangs.map((gang) => {
      const breakdown = calculation.gangsBreakdown[gang.id];
      return {
        id: gang.id,
        name: `👥 ${gang.name}`,
        description: gang.description || 'หารเฉพาะคนในแก๊งนี้',
        colorClass: 'border-teal-200 bg-teal-50/50',
        headerBg: 'bg-teal-50 text-teal-950 border-teal-200',
        items: bill.items.filter((it) => it.assignedTo === gang.id),
        effectiveTotal: breakdown?.effectiveTotal || 0,
        membersCount: breakdown?.payingMembersCount || 0,
      };
    }),
  ];

  return (
    <div className="w-full">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-6 pt-1 snap-x">
          {columns.map((col) => (
            <div
              key={col.id}
              className={`flex min-w-[320px] max-w-[360px] flex-1 flex-col rounded-2xl border ${col.colorClass} shadow-xs snap-start`}
            >
              {/* Column Header */}
              <div className={`rounded-t-2xl border-b p-3.5 ${col.headerBg}`}>
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold truncate">{col.name}</h4>
                  <div className="flex items-center space-x-1.5 shrink-0">
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => onAddNewItem(col.id)}
                        className="flex items-center space-x-1 rounded-lg bg-teal-700 hover:bg-teal-800 active:scale-95 text-white px-2.5 py-1 text-[11px] font-bold shadow-2xs transition cursor-pointer"
                        title="เพิ่มรายการอาหารในกลุ่มนี้"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>เพิ่ม</span>
                      </button>
                    )}
                    <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-slate-700 border border-slate-200 shadow-2xs">
                      {col.items.length} รายการ
                    </span>
                  </div>
                </div>
                <p className="mt-1 text-[11px] text-slate-500 line-clamp-1">{col.description}</p>

                <div className="mt-2.5 flex items-center justify-between rounded-lg bg-white px-2.5 py-1.5 text-xs border border-slate-200 shadow-2xs">
                  <div>
                    <span className="text-[10px] text-slate-500 font-medium">ยอดรวม:</span>
                    <p className="font-bold text-slate-900 font-mono">{formatTHB(col.effectiveTotal)}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 font-medium">ตัวหารจริง:</span>
                    <p className="font-bold text-teal-800">{col.membersCount} คน</p>
                  </div>
                </div>
              </div>

              {/* Droppable Area */}
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 space-y-2.5 p-3 min-h-[160px] transition-colors ${
                      snapshot.isDraggingOver ? 'bg-teal-100/50' : ''
                    }`}
                  >
                    {col.items.length === 0 ? (
                      <div className="flex h-24 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 text-slate-400 bg-white/50">
                        <ArrowRightLeft className="h-5 w-5 stroke-[1.5] mb-1 text-slate-300" />
                        <span className="text-xs font-medium">ลากอาหารมาวางที่นี่</span>
                      </div>
                    ) : (
                      col.items.map((item, index) => {
                        const itemEff = getItemEffectivePrice(item, bill.vatMode, bill.vatRate);
                        return (
                          <Draggable key={item.id} draggableId={item.id} index={index} isDragDisabled={readOnly}>
                            {(dragProvided, dragSnapshot) => (
                              <div
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                className={`group rounded-xl border bg-white p-3 shadow-2xs transition-all ${
                                  highlightedItemId === item.id
                                    ? 'border-teal-500 ring-2 ring-teal-500/40 shadow-md bg-teal-50/20'
                                    : dragSnapshot.isDragging
                                    ? 'border-teal-600 shadow-xl ring-2 ring-teal-600/30'
                                    : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
                                }`}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start space-x-2">
                                    {!readOnly && (
                                      <div
                                        {...dragProvided.dragHandleProps}
                                        className="mt-0.5 cursor-grab text-slate-400 hover:text-slate-700"
                                        title="ลากการ์ด"
                                      >
                                        <GripVertical className="h-4 w-4" />
                                      </div>
                                    )}
                                    <div>
                                      <h5 className="text-xs font-bold text-slate-900">
                                        {item.name}
                                      </h5>
                                      <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 font-medium">
                                        <span>
                                          {item.price} บาท × {item.quantity || 1}
                                        </span>
                                        {item.category && (
                                          <>
                                            <span>•</span>
                                            <span className="text-slate-400">{item.category}</span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="text-right">
                                    <span className="text-xs font-bold text-slate-900 font-mono">
                                      {formatTHB(itemEff)}
                                    </span>
                                  </div>
                                </div>

                                {/* Bottom card actions & Quick Move Selector (Host only) */}
                                {!readOnly && (
                                  <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2">
                                    <select
                                      value={item.assignedTo || 'COMMON'}
                                      onChange={(e) => handleQuickMove(item.id, e.target.value)}
                                      className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-700 focus:border-teal-600 focus:outline-none"
                                    >
                                      <option value="COMMON">ย้ายไป: กองกลาง</option>
                                      {bill.gangs.map((g) => (
                                        <option key={g.id} value={g.id}>
                                          ย้ายไป: {g.name}
                                        </option>
                                      ))}
                                    </select>

                                    <div className="flex items-center space-x-1">
                                      {(item.quantity || 1) > 1 && (
                                        <button
                                          type="button"
                                          onClick={() => handleDuplicateItem(item)}
                                          className="rounded p-1 text-slate-400 hover:bg-teal-50 hover:text-teal-700 transition"
                                          title="แยก/ทำสำเนารายการ (Duplicate)"
                                        >
                                          <Copy className="h-3 w-3" />
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => onEditItem(item)}
                                        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-800"
                                        title="แก้ไข"
                                      >
                                        <Edit2 className="h-3 w-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteItem(item.id)}
                                        className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                                        title="ลบ"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </Draggable>
                        );
                      })
                    )}
                    {provided.placeholder}

                    {/* Bottom Add Item Button - Placed immediately under the last item in the list */}
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => onAddNewItem(col.id)}
                        className="flex w-full items-center justify-center space-x-1.5 rounded-xl border-2 border-dashed border-slate-300 bg-white/80 hover:bg-white hover:border-teal-600 hover:text-teal-800 active:scale-98 py-2.5 text-xs font-bold text-slate-600 transition shadow-2xs cursor-pointer mt-1"
                      >
                        <Plus className="h-4 w-4 text-teal-600" />
                        <span>เพิ่มรายการในกลุ่มนี้</span>
                      </button>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* Modal for splitting / duplicating items with >2 quantity */}
      <DuplicateItemModal
        isOpen={!!itemToSplit}
        onClose={() => setItemToSplit(null)}
        item={itemToSplit}
        onConfirmSplit={handleConfirmSplit}
        onConfirmSplitAll={handleConfirmSplitAll}
        onConfirmClone={handleConfirmClone}
      />
    </div>
  );
};
