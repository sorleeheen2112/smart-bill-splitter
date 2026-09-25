/**
 * Utility functions for generating shareable text and links
 */

export interface QuickShareOptions {
  title?: string;
  billId?: string;
  origin?: string;
}

/**
 * สร้างข้อความคำเปรยสั้นๆ พร้อมลิงก์ สำหรับแชร์ลงใน LINE หรือแชทกลุ่ม
 * เพื่อให้ผู้รับทราบคืองานอะไร และวิธีจ่ายเงินสั้นๆ ทันที
 */
export function getQuickShareText({ title, billId, origin }: QuickShareOptions): string {
  const baseOrigin = origin || (typeof window !== 'undefined' ? window.location.origin : '');
  const url = billId ? `${baseOrigin}/bill/${billId}` : baseOrigin;
  const billTitle = title?.trim() || 'ปาร์ตี้';

  return `🎉 สรุปยอดบิล: ${billTitle}
👉 วิธีจ่าย: กดลิงก์ > เลือกชื่อตัวเอง > สแกน QR > แนบสลิปได้เลย
🔗 ${url}`;
}
