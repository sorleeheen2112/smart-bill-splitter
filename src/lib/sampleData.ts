import { PartyBill } from './types';

export const initialSamplePartyBill: PartyBill = {
  id: 'party-sheet-2026',
  title: '🎉 ปาร์ตี้สังสรรค์รวมแก๊ง • แยกกลุ่ม หารเป๊ะ สแกนจ่าย QR',
  date: new Date().toISOString().split('T')[0],
  location: 'Waterside Restaurant & Bar',
  vatMode: 'INCLUDE',
  vatRate: 0.07,
  sponsorBudget: 5000,
  depositAmount: 1000,
  promptPayNumber: '0891234567',
  promptPayName: 'นายสอ (เหรัญญิกปาร์ตี้)',
  hostPin: '1234',
  gangs: [
    {
      id: 'gang-a',
      name: 'แก๊ง A (แอลหวาน/เหล้าบ๊วย)',
      colorTag: 'amber',
      description: 'คนดื่มเหล้าบ๊วย โซดา มะนาว น้ำแข็ง',
    },
    {
      id: 'gang-b',
      name: 'แก๊ง B (Asahi Tower 1)',
      colorTag: 'emerald',
      description: 'เบียร์สด Asahi ทาวเวอร์ 1',
    },
    {
      id: 'gang-c',
      name: 'แก๊ง C (Asahi Tower 2)',
      colorTag: 'cyan',
      description: 'เบียร์สด Asahi ทาวเวอร์ 2',
    },
    {
      id: 'gang-g',
      name: 'แก๊ง G (ไอศกรีมของหวาน)',
      colorTag: 'rose',
      description: 'คนทานไอศกรีมซันเดย์และของหวาน',
    },
    {
      id: 'gang-h',
      name: 'แก๊ง H (Whiskey in the Dark)',
      colorTag: 'purple',
      description: 'สายวิสกี้เข้มข้น',
    },
  ],
  members: [
    {
      id: 'm-1',
      name: 'สอ (Host)',
      gangIds: ['gang-a', 'gang-b'],
      isFree: false,
      paymentStatus: 'VERIFIED',
      note: 'คนคุมโต๊ะ',
    },
    {
      id: 'm-2',
      name: 'มุก',
      gangIds: ['gang-g'],
      isFree: false,
      paymentStatus: 'PENDING',
    },
    {
      id: 'm-3',
      name: 'บุ๊ค',
      gangIds: ['gang-g'],
      isFree: true, // แท็ก F (VIP ฟรี)
      paymentStatus: 'VERIFIED',
      note: '👑 เลี้ยงส่ง VIP (ฟรีทุกรายการ)',
    },
    {
      id: 'm-4',
      name: 'พริก',
      gangIds: [],
      isFree: true, // แท็ก F (VIP ฟรี)
      paymentStatus: 'VERIFIED',
      note: '👑 แขกพิเศษ (ฟรีทุกรายการ)',
    },
    {
      id: 'm-5',
      name: 'แชมป์',
      gangIds: ['gang-a'],
      isFree: true, // แท็ก F
      paymentStatus: 'VERIFIED',
      note: '👑 น้องใหม่ยินดีต้อนรับ (ฟรี)',
    },
    {
      id: 'm-6',
      name: 'แคท',
      gangIds: ['gang-g', 'gang-a'],
      isFree: false,
      paymentStatus: 'PENDING',
    },
    {
      id: 'm-7',
      name: 'แคร์',
      gangIds: ['gang-g'],
      isFree: false,
      paymentStatus: 'PENDING',
    },
    {
      id: 'm-8',
      name: 'ก้อย',
      gangIds: ['gang-g', 'gang-b'],
      isFree: false,
      paymentStatus: 'PENDING',
    },
    {
      id: 'm-9',
      name: 'บูม',
      gangIds: ['gang-g', 'gang-c'],
      isFree: false,
      paymentStatus: 'PENDING',
    },
    {
      id: 'm-10',
      name: 'อาร์ท',
      gangIds: ['gang-a', 'gang-b'],
      isFree: false,
      paymentStatus: 'PENDING',
    },
    {
      id: 'm-11',
      name: 'นิว',
      gangIds: ['gang-b'],
      isFree: false,
      paymentStatus: 'PENDING',
    },
    {
      id: 'm-12',
      name: 'เบนซ์',
      gangIds: ['gang-c', 'gang-h'],
      isFree: false,
      paymentStatus: 'PENDING',
    },
    {
      id: 'm-13',
      name: 'แพรว',
      gangIds: ['gang-a'],
      isFree: false,
      paymentStatus: 'PENDING',
    },
    {
      id: 'm-14',
      name: 'ตูน',
      gangIds: ['gang-c'],
      isFree: false,
      paymentStatus: 'PENDING',
    },
    {
      id: 'm-15',
      name: 'มายด์',
      gangIds: ['gang-a', 'gang-g'],
      isFree: false,
      paymentStatus: 'PENDING',
    },
    {
      id: 'm-16',
      name: 'บอส',
      gangIds: ['gang-h'],
      isFree: false,
      paymentStatus: 'PENDING',
    },
  ],
  items: [
    // [1] ส่วนรวม (Common Items)
    { id: 'i-1', name: 'ส้มตำไทยไข่เค็ม', price: 150, quantity: 3, assignedTo: 'COMMON', category: 'อาหาร' },
    { id: 'i-2', name: 'ปีกไก่ทอดเกลือ', price: 180, quantity: 4, assignedTo: 'COMMON', category: 'อาหาร' },
    { id: 'i-3', name: 'ต้มยำกุ้งหม้อไฟ', price: 380, quantity: 2, assignedTo: 'COMMON', category: 'อาหาร' },
    { id: 'i-4', name: 'ปลากะพงทอดน้ำปลา', price: 520, quantity: 2, assignedTo: 'COMMON', category: 'อาหาร' },
    { id: 'i-5', name: 'ข้าวเหนียว & ข้าวสวยโถ', price: 80, quantity: 6, assignedTo: 'COMMON', category: 'อาหาร' },
    { id: 'i-6', name: 'น้ำเปล่าขวดใหญ่', price: 40, quantity: 10, assignedTo: 'COMMON', category: 'เครื่องดื่ม' },
    { id: 'i-7', name: 'ยำวุ้นเส้นรวมมิตร', price: 220, quantity: 3, assignedTo: 'COMMON', category: 'อาหาร' },
    { id: 'i-8', name: 'คอหมูย่างจิ้มแจ่ว', price: 200, quantity: 4, assignedTo: 'COMMON', category: 'อาหาร' },

    // [2] แก๊ง A (แอลหวาน/เหล้าบ๊วย)
    { id: 'i-9', name: 'เหล้าบ๊วย Choya', price: 950, quantity: 1, assignedTo: 'gang-a', category: 'เครื่องดื่มแอลกอฮอล์' },
    { id: 'i-10', name: 'โซดาขวดแก้ว', price: 30, quantity: 8, assignedTo: 'gang-a', category: 'มิกเซอร์' },
    { id: 'i-11', name: 'น้ำแข็งถังใหญ่', price: 50, quantity: 3, assignedTo: 'gang-a', category: 'มิกเซอร์' },
    { id: 'i-12', name: 'มะนาวหั่นแว่น', price: 40, quantity: 2, assignedTo: 'gang-a', category: 'มิกเซอร์' },

    // [3] แก๊ง B (Asahi Tower 1)
    { id: 'i-13', name: 'Asahi Beer Tower 1 (3L)', price: 890, quantity: 1, assignedTo: 'gang-b', category: 'เบียร์' },

    // [4] แก๊ง C (Asahi Tower 2)
    { id: 'i-14', name: 'Asahi Beer Tower 2 (3L)', price: 890, quantity: 1, assignedTo: 'gang-c', category: 'เบียร์' },

    // [5] แก๊ง G (ไอศกรีมซันเดย์ของหวาน)
    { id: 'i-15', name: 'ไอศกรีมซันเดย์ & วาฟเฟิลช็อกโกแลต', price: 181.90, quantity: 3, assignedTo: 'gang-g', category: 'ของหวาน' },

    // [6] แก๊ง H (Whiskey in the Dark)
    { id: 'i-16', name: 'Black Label 700ml', price: 1650, quantity: 1, assignedTo: 'gang-h', category: 'เครื่องดื่มแอลกอฮอล์' },
  ],
};
