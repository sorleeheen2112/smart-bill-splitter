import { NextRequest, NextResponse } from 'next/server';

interface ScannedItem {
  id: string;
  name: string;
  price: number; // Unit price
  lineTotal?: number; // Row total
  quantity: number;
  category?: string;
  suggestedGang?: string; // 'COMMON' or a hint
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64, mimeType = 'image/jpeg', apiKey } = body;

    const geminiKey = apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    // If Gemini key is available, call Gemini API
    if (geminiKey && imageBase64) {
      try {
        const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

        const prompt = `คุณคือระบบ AI OCR อัจฉริยะสำหรับสแกนและแกะใบเสร็จร้านอาหาร/บาร์ไทยและสากล
ภารกิจ: สแกนและถอด "ทุกรายการอาหาร เครื่องดื่ม แอลกอฮอล์ และบริการ" ออกมาให้ครบถ้วน 100% ตั้งแต่รายการแรกจนถึงรายการสุดท้ายในใบเสร็จ ห้ามตัดทอนหรือข้ามรายการใดๆ

วิเคราะห์ราคาในบิลให้ละเอียด:
ตรวจสอบว่าราคาที่แสดงในคอลัมน์ของบิลคือ "ราคาต่อหน่วย (Unit Price)" หรือ "ราคารวมตามจำนวนแล้ว (Line Total)"
- quantity: จำนวนชิ้น/ที่ (ตัวเลข เช่น 1, 2, 3)
- unitPrice: ราคาต่อ 1 หน่วย (ตัวเลข)
- lineTotal: ราคารวมของแถวนั้น (lineTotal = unitPrice * quantity)
*ตัวอย่าง: สั่ง 3 แก้ว ยอดในแถวบิลเขียน 450 -> quantity=3, unitPrice=150, lineTotal=450

โครงสร้างผลลัพธ์: ตอบกลับเป็น JSON Array ตามนี้เท่านั้น:
[
  {
    "name": "ชื่อรายการเต็มตามใบเสร็จ (ภาษาไทยหรืออังกฤษ)",
    "quantity": จำนวน (ตัวเลข เช่น 1, 2),
    "unitPrice": ราคาต่อหน่วย (ตัวเลข),
    "lineTotal": ราคารวมของแถวนั้น (ตัวเลข),
    "category": "อาหาร" | "เครื่องดื่ม" | "แอลกอฮอล์" | "มิกเซอร์" | "ของหวาน" | "อื่นๆ"
  }
]

กฎเหล็ก:
1. แกะทุกบรรทัดรายการสินค้าทั้งหมดในรูปภาพ ห้ามสรุปรวมเป็นรายการเดียว
2. ไม่เอาบรรทัดยอดรวมสุทธิ (Grand Total), Subtotal, VAT 7%, Service Charge 10%, เงินทอน หรือเลขที่ใบเสร็จ
3. ตอบกลับเฉพาะ JSON Array เท่านั้น ไม่มี Markdown อื่นใดทั้งสิ้น`;

        // Supported Gemini vision models
        const models = [
          'gemini-3.6-flash',
          'gemini-3.5-flash',
          'gemini-flash-latest',
          'gemini-3-flash-preview',
          'gemini-2.0-flash',
          'gemini-1.5-flash',
        ];
        let resultData: any = null;

        for (const modelName of models) {
          try {
            const response = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [
                    {
                      parts: [
                        { text: prompt },
                        {
                          inline_data: {
                            mime_type: mimeType,
                            data: cleanBase64,
                          },
                        },
                      ],
                    },
                  ],
                  generationConfig: {
                    temperature: 0.1,
                    response_mime_type: 'application/json',
                  },
                }),
              }
            );

            if (response.ok) {
              resultData = await response.json();
              if (resultData?.candidates?.[0]?.content?.parts?.[0]?.text) {
                break;
              }
            }
          } catch (e) {
            console.warn(`Model ${modelName} attempt failed:`, e);
          }
        }

        if (resultData) {
          const rawText = resultData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const cleanJson = rawText.trim().replace(/^```json/, '').replace(/```$/, '').trim();
            const parsedItems = JSON.parse(cleanJson);
            if (Array.isArray(parsedItems) && parsedItems.length > 0) {
              const formattedItems: ScannedItem[] = parsedItems.map((item: any, idx: number) => {
                const qty = Math.max(1, Number(item.quantity) || 1);
                let unitP = Number(item.unitPrice) || Number(item.price) || 0;
                let lineT = Number(item.lineTotal) || (unitP * qty);

                // If lineTotal was given but unitPrice was same as lineTotal and qty > 1
                if (item.lineTotal && !item.unitPrice && qty > 1) {
                  unitP = Number(item.lineTotal) / qty;
                }

                return {
                  id: `ai-item-${Date.now()}-${idx}`,
                  name: String(item.name || `รายการที่ ${idx + 1}`).trim(),
                  price: unitP,
                  lineTotal: lineT,
                  quantity: qty,
                  category: item.category || 'อาหาร',
                  suggestedGang: 'COMMON',
                };
              });

              return NextResponse.json({
                success: true,
                items: formattedItems,
                source: 'gemini-ai',
                totalItemsFound: formattedItems.length,
              });
            }
          }
        }
      } catch (geminiError: any) {
        console.error('Gemini OCR API error:', geminiError);
      }
    }

    // Fallback simulation when no API key provided
    const simulatedItems: ScannedItem[] = [
      { id: `mock-${Date.now()}-1`, name: 'ส้มตำไทยไข่เค็ม', price: 150, quantity: 2, category: 'อาหาร', suggestedGang: 'COMMON' },
      { id: `mock-${Date.now()}-2`, name: 'ปีกไก่ทอดเกลือ', price: 180, quantity: 3, category: 'อาหาร', suggestedGang: 'COMMON' },
      { id: `mock-${Date.now()}-3`, name: 'ต้มยำกุ้งหม้อไฟ', price: 380, quantity: 1, category: 'อาหาร', suggestedGang: 'COMMON' },
      { id: `mock-${Date.now()}-4`, name: 'Asahi Tower 3L', price: 890, quantity: 1, category: 'แอลกอฮอล์', suggestedGang: 'gang-b' },
      { id: `mock-${Date.now()}-5`, name: 'เหล้าบ๊วย Choya', price: 950, quantity: 1, category: 'แอลกอฮอล์', suggestedGang: 'gang-a' },
      { id: `mock-${Date.now()}-6`, name: 'โซดาขวด', price: 30, quantity: 6, category: 'มิกเซอร์', suggestedGang: 'gang-a' },
      { id: `mock-${Date.now()}-7`, name: 'น้ำแข็งถังใหญ่', price: 50, quantity: 2, category: 'มิกเซอร์', suggestedGang: 'gang-a' },
      { id: `mock-${Date.now()}-8`, name: 'ไอศกรีมซันเดย์', price: 180, quantity: 3, category: 'ของหวาน', suggestedGang: 'gang-g' },
    ];

    return NextResponse.json({
      success: true,
      items: simulatedItems,
      source: 'mock-simulation',
      note: 'ยังไม่ได้ใส่ Gemini API Key (กำลังแสดงรายการจำลองตัวอย่าง)',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}
