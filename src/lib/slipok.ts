export interface SlipVerificationResult {
  success: boolean;
  verified: boolean;
  amountMatched?: boolean;
  outOfQuota?: boolean;
  quota?: number;
  message: string;
  code?: number;
  data?: {
    transRef?: string;
    transDate?: string;
    transTime?: string;
    amount?: number;
    expectedAmount?: number;
    senderName?: string;
    senderBank?: string;
    receiverName?: string;
    receiverBank?: string;
    receiverAccount?: string;
  };
}

export interface SlipQuotaResult {
  success: boolean;
  data?: {
    quota: number;
    overQuota: number;
  };
  error?: string;
}

/**
 * Check remaining SlipOK quota balance
 */
export async function checkSlipOkQuota(): Promise<SlipQuotaResult> {
  try {
    const res = await fetch('/api/verify-slip', {
      method: 'GET',
    });
    return await res.json();
  } catch (err: any) {
    console.error('checkSlipOkQuota error:', err);
    return {
      success: false,
      error: err?.message || 'ไม่สามารถตรวจสอบโควต้าได้',
    };
  }
}

/**
 * Call server-side API to verify bank transfer slip using SlipOK
 */
export async function verifySlipWithSlipOk(params: {
  imageBase64?: string;
  imageUrl?: string;
  expectedAmount?: number;
}): Promise<SlipVerificationResult> {
  try {
    const res = await fetch('/api/verify-slip', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64: params.imageBase64,
        imageUrl: params.imageUrl,
        amount: params.expectedAmount,
      }),
    });

    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error('verifySlipWithSlipOk fetch error:', err);
    return {
      success: false,
      verified: false,
      message: err?.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ตรวจสอบสลิปได้',
    };
  }
}
