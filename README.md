# 🥂 Party Bill Splitter & AI Receipt Scanner

ระบบสแกนบิล, แยกอาหารเข้ากลุ่ม/แก๊ง, หารค่าใช้จ่ายปาร์ตี้อัจฉริยะ พร้อม PromptPay QR Code และระบบแนบสลิป รองรับกลุ่มคนขนาดใหญ่ 20-30+ คนขึ้นไป

## 🚀 ฟีเจอร์หลัก (Key Features)

1. **Food-to-Gang Architecture**:
   - `[1] กองกลาง / ส่วนรวม (Common Items)`: หารเท่าทุกคน (ยกเว้นแท็ก F) + หักงบสนับสนุน Sponsor Budget ก่อนหาร
   - `[2..N] ก้อนอาหารประจำแก๊ง (Gang-Specific Groups)`: เช่น แก๊ง A (แอลกอฮอล์หวาน), แก๊ง B (Asahi Tower 1), แก๊ง G (ของหวาน) หารเฉพาะสมาชิกในแก๊ง
2. **Food Assignment UI 3 รูปแบบ**:
   - **Kanban Board View**: ลากการ์ดอาหาร (Drag & Drop) ระหว่างคอลัมน์ ส่วนรวม ↔ แก๊งต่างๆ
   - **Batch Table View**: ติ๊ก Checkbox หลายเมนูแล้วกดย้ายเข้าแก๊งพร้อมกัน
   - **AI Staging Modal**: สแกนบิลและเลือก Dropdown จัดเข้าแก๊งได้ทันทีก่อนบันทึก
3. **Calculation & Business Logic**:
   - **VAT Include vs Exclude**: รองรับราคารวม VAT หรือบวก VAT 7% เพิ่มอัตโนมัติ
   - **VIP Tag `[F]` (Free)**: ยอดจ่าย = 0 บาท และถูกหักออกจากตัวหารของแก๊งและกองกลางอัตโนมัติ
   - **Reconciliation 100%**: แถบตรวจสอบความถูกต้องสีเขียว `ผลรวมทุกคน + งบ Sponsor == ยอดบิลรวมจริง`
4. **Host & Guest Mode**:
   - **Host**: สแกนบิลด้วย AI (Gemini 1.5 Flash Vision / Simulator), จัดการสมาชิกและแก๊ง, ตรวจสอบสลิป, ส่งออกข้อความเข้ากลุ่ม LINE
   - **Guest**: แขกเลือกชื่อตัวเอง ดู Breakdown ค่าอาหารส่วนรวมและแก๊ง, สแกน Dynamic PromptPay QR และแนบสลิป

## 💻 Tech Stack
- **Framework**: Next.js 16 (App Router) + TypeScript
- **Styling**: Tailwind CSS + Thai Google Font (Prompt)
- **Drag & Drop**: `@hello-pangea/dnd`
- **QR Code**: Thai PromptPay EMVCo Standard + `qrcode.react`
- **AI OCR**: Google Gemini 1.5 Flash Vision API (`/api/scan-receipt`)

## 🛠️ การติดตั้งและรันโปรเจกต์

```bash
# ติดตั้ง dependencies
npm install

# รัน Development Server
npm run dev
```

เปิดเว็บเบราว์เซอร์ไปที่ [http://localhost:3000](http://localhost:3000)
