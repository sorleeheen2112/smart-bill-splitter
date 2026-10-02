import { NextRequest, NextResponse } from 'next/server';

interface SlipOkSuccessData {
  transRef?: string;
  transDate?: string;
  transTime?: string;
  amount?: number;
  paidLocalAmount?: number;
  sender?: {
    bank?: { id?: string; name?: string };
    account?: {
      name?: { th?: string; en?: string };
      value?: string;
    };
  };
  receiver?: {
    bank?: { id?: string; name?: string };
    account?: {
      name?: { th?: string; en?: string };
      value?: string;
    };
    proxy?: {
      type?: string;
      value?: string;
    };
  };
  [key: string]: any;
}

/**
 * Check remaining quota from SlipOK
 */
async function getRemainingQuota(apiKey: string, branchId: string): Promise<{ quota: number; overQuota: number } | null> {
  try {
    const quotaRes = await fetch(`https://api.slipok.com/api/line/apikey/${branchId}/quota`, {
      method: 'GET',
      headers: {
        'x-authorization': apiKey,
      },
      // Cache quota for 30 seconds to prevent hammering the quota endpoint
      next: { revalidate: 30 },
    });

    if (!quotaRes.ok) return null;
    const json = await quotaRes.json();
    if (json.success && json.data) {
      return {
        quota: Number(json.data.quota || 0),
        overQuota: Number(json.data.overQuota || 0),
      };
    }
    return null;
  } catch (e) {
    console.warn('Failed to check SlipOK quota:', e);
    return null;
  }
}

/**
 * Check if SlipOK verification is enabled via ENV
 */
function isSlipOkEnabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_ENABLE_SLIP_VERIFICATION === 'true' ||
    process.env.ENABLE_SLIPOK_VERIFICATION === 'true'
  );
}

/**
 * GET: Check remaining quota for frontend display or host dashboard
 */
export async function GET() {
  if (!isSlipOkEnabled()) {
    return NextResponse.json({
      success: false,
      enabled: false,
      error: 'ระบบตรวจสอบสลิปอัตโนมัติถูกปิดใช้งาน (Disabled by ENV)',
    });
  }

  const apiKey = process.env.SLIPOK_API_KEY;
  const branchId = process.env.SLIPOK_BRANCH_ID || '77467';

  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: 'SLIPOK_API_KEY is not configured' },
      { status: 500 }
    );
  }

  const quotaInfo = await getRemainingQuota(apiKey, branchId);
  if (!quotaInfo) {
    return NextResponse.json(
      { success: false, error: 'ไม่สามารถตรวจสอบโควต้าได้ในขณะนี้' },
      { status: 502 }
    );
  }

  return NextResponse.json({
    success: true,
    data: quotaInfo,
  });
}

export async function POST(req: NextRequest) {
  try {
    if (!isSlipOkEnabled()) {
      return NextResponse.json({
        success: false,
        verified: false,
        enabled: false,
        message: 'ระบบตรวจสอบสลิปอัตโนมัติถูกปิดใช้งาน (Host ตรวจสอบสลิปด้วยตนเอง)',
      });
    }

    const apiKey = process.env.SLIPOK_API_KEY;
    const branchId = process.env.SLIPOK_BRANCH_ID || '77467';
    const endpoint = process.env.SLIPOK_ENDPOINT || `https://api.slipok.com/api/line/apikey/${branchId}`;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          error: 'SLIPOK_API_KEY is not configured on server',
        },
        { status: 500 }
      );
    }

    // 1. Check remaining quota before consuming
    const quotaInfo = await getRemainingQuota(apiKey, branchId);
    if (quotaInfo && quotaInfo.quota <= 0) {
      return NextResponse.json({
        success: true,
        verified: false,
        outOfQuota: true,
        quota: quotaInfo.quota,
        message: 'โควต้าการตรวจสลิปอัตโนมัติเต็มแล้ว สลิปถูกส่งให้ Host ยืนยันด้วยตนเองเรียบร้อย',
      });
    }

    const contentType = req.headers.get('content-type') || '';
    let expectedAmount: number | undefined;
    let slipFormData = new FormData();

    if (contentType.includes('multipart/form-data')) {
      const incomingFormData = await req.formData();
      const file = incomingFormData.get('file') || incomingFormData.get('files');
      const amountStr = incomingFormData.get('amount') as string | null;

      if (amountStr) {
        expectedAmount = parseFloat(amountStr);
      }

      if (file && file instanceof Blob) {
        slipFormData.append('files', file, 'slip.jpg');
      } else {
        const urlStr = incomingFormData.get('url') as string | null;
        if (urlStr) {
          const imgRes = await fetch(urlStr);
          if (!imgRes.ok) {
            return NextResponse.json(
              { success: false, verified: false, error: 'ไม่สามารถดาวน์โหลดรูปสลิปจาก URL ได้' },
              { status: 400 }
            );
          }
          const blob = await imgRes.blob();
          slipFormData.append('files', blob, 'slip.jpg');
        } else {
          return NextResponse.json(
            { success: false, verified: false, error: 'ไม่พบไฟล์รูปสลิป' },
            { status: 400 }
          );
        }
      }
    } else {
      // JSON body
      const body = await req.json();
      const { imageBase64, imageUrl, amount } = body;
      if (amount !== undefined && amount !== null) {
        expectedAmount = Number(amount);
      }

      if (imageBase64) {
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const blob = new Blob([buffer], { type: 'image/jpeg' });
        slipFormData.append('files', blob, 'slip.jpg');
      } else if (imageUrl) {
        const imgRes = await fetch(imageUrl);
        if (!imgRes.ok) {
          return NextResponse.json(
            { success: false, verified: false, error: 'ไม่สามารถดาวน์โหลดรูปสลิปจาก URL ได้' },
            { status: 400 }
          );
        }
        const blob = await imgRes.blob();
        slipFormData.append('files', blob, 'slip.jpg');
      } else {
        return NextResponse.json(
          { success: false, verified: false, error: 'ต้องระบุ imageBase64 หรือ imageUrl' },
          { status: 400 }
        );
      }
    }

    if (expectedAmount !== undefined && !isNaN(expectedAmount) && expectedAmount > 0) {
      // ปรับยอดเงินเป็นทศนิยม 2 ตำแหน่งตามค่าเงินมาตรฐาน (เช่น 702.11) ก่อนส่งให้ SlipOK
      slipFormData.append('amount', expectedAmount.toFixed(2));
    }

    // 2. Call slip verification API
    const slipOkResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'x-authorization': apiKey,
      },
      body: slipFormData,
    });

    const slipOkJson = await slipOkResponse.json();

    // Check if SlipOK returned error
    if (!slipOkResponse.ok || !slipOkJson.success) {
      console.warn('SlipOK Verification Failed Response:', slipOkJson);
      const code = slipOkJson.code || slipOkResponse.status;
      let message = slipOkJson.message || 'ตรวจสลิปไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';

      if (code === 1001 || code === 1011 || message.includes('QR')) {
        message = 'ไม่พบ QR Code ในรูปภาพสลิป หรือรูปภาพสลิปไม่ชัดเจน';
      } else if (code === 1002 || code === 1012 || message.includes('duplicate') || message.includes('ซ้ำ')) {
        message = 'สลิปนี้เคยถูกใช้งานตรวจสอบในระบบแล้ว (สลิปซ้ำ)';
      } else if (code === 1003 || code === 1013 || message.includes('amount') || message.includes('ยอด')) {
        message = 'ยอดเงินในสลิปไม่ตรงกับยอดที่ต้องชำระ';
      } else if (code === 1004 || code === 1014 || message.includes('receiver') || message.includes('บัญชี')) {
        message = 'บัญชีผู้รับเงินในสลิปไม่ตรงกับบัญชีของผู้รับ';
      }

      return NextResponse.json(
        {
          success: false,
          verified: false,
          code,
          message,
          raw: slipOkJson,
        },
        { status: 200 }
      );
    }

    const data: SlipOkSuccessData = slipOkJson.data || {};
    const rawActual = typeof data.amount === 'number' ? data.amount : Number(data.amount || 0);
    const actualAmount = Math.round(rawActual * 100) / 100;
    const roundedExpected = expectedAmount !== undefined ? Math.round(expectedAmount * 100) / 100 : undefined;

    // Validate amount match with floating point tolerance
    let amountMatched = true;
    if (roundedExpected !== undefined && roundedExpected > 0) {
      if (Math.abs(actualAmount - roundedExpected) > 0.05) {
        amountMatched = false;
      }
    }

    const senderName =
      data.sender?.account?.name?.th ||
      data.sender?.account?.name?.en ||
      'ไม่ระบุชื่อผู้โอน';

    const receiverName =
      data.receiver?.account?.name?.th ||
      data.receiver?.account?.name?.en ||
      '';

    return NextResponse.json({
      success: true,
      verified: amountMatched,
      amountMatched,
      data: {
        transRef: data.transRef,
        transDate: data.transDate,
        transTime: data.transTime,
        amount: actualAmount,
        expectedAmount,
        senderName,
        senderBank: data.sender?.bank?.name,
        receiverName,
        receiverBank: data.receiver?.bank?.name,
        receiverAccount: data.receiver?.account?.value || data.receiver?.proxy?.value,
      },
      message: amountMatched
        ? `ตรวจสลิปสำเร็จ ยอดโอน ฿${actualAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ถูกต้อง`
        : `ยอดเงินในสลิป (฿${actualAmount}) ไม่ตรงกับยอดที่ต้องชำระ (฿${expectedAmount})`,
    });
  } catch (error: any) {
    console.error('SlipOK Verification Error:', error);
    return NextResponse.json(
      {
        success: false,
        verified: false,
        error: error?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อระบบตรวจสอบสลิป',
      },
      { status: 500 }
    );
  }
}
