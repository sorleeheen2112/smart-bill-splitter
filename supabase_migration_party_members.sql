-- =========================================================================
-- Migration: Separate `party_members` table from `party_bills`
-- Description: แยกตารางสมาชิกออกจากบิล เพื่อป้องกันปัญหา Race Condition (ข้อมูลชนกันเมื่อแนบสลิปพร้อมกัน)
-- =========================================================================
-- วิธีใช้งาน: คัดลอกโค้ดทั้งหมดนี้ไปวางในเมนู "SQL Editor" ใน Supabase Dashboard แล้วกด "Run"

-- 1. สร้างตาราง party_members
CREATE TABLE IF NOT EXISTS public.party_members (
  id TEXT PRIMARY KEY,
  bill_id TEXT NOT NULL REFERENCES public.party_bills(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  gang_ids JSONB DEFAULT '[]'::jsonb,
  is_free BOOLEAN DEFAULT FALSE,
  is_payer BOOLEAN DEFAULT FALSE,
  payment_status TEXT DEFAULT 'PENDING',
  slip_url TEXT,
  slip_uploaded_at TIMESTAMPTZ,
  paid_amount NUMERIC DEFAULT 0,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. สร้าง Index สำหรับค้นหาสมาชิกตาม bill_id ได้อย่างรวดเร็วระดับเสี้ยววินาที
CREATE INDEX IF NOT EXISTS idx_party_members_bill_id ON public.party_members(bill_id);
CREATE INDEX IF NOT EXISTS idx_party_members_payment_status ON public.party_members(payment_status);

-- 3. เปิดใช้งาน Row Level Security (RLS)
ALTER TABLE public.party_members ENABLE ROW LEVEL SECURITY;

-- 4. ตั้งค่านโยบายความปลอดภัย (RLS Policies)
DROP POLICY IF EXISTS "Public can view party members" ON public.party_members;
CREATE POLICY "Public can view party members" 
  ON public.party_members FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Anyone can insert party members" ON public.party_members;
CREATE POLICY "Anyone can insert party members" 
  ON public.party_members FOR INSERT 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update party members" ON public.party_members;
CREATE POLICY "Anyone can update party members" 
  ON public.party_members FOR UPDATE 
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can delete party members" ON public.party_members;
CREATE POLICY "Anyone can delete party members" 
  ON public.party_members FOR DELETE 
  USING (true);

-- 5. เปิดใช้งาน Supabase Realtime สำหรับตาราง party_members
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.party_members;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN NULL;
  END;
END $$;

-- 6. 🚀 DATA MIGRATION: ย้ายข้อมูลสมาชิกเดิมจากตาราง party_bills (ก้อน JSONB) เข้าตาราง party_members
INSERT INTO public.party_members (
  id,
  bill_id,
  name,
  gang_ids,
  is_free,
  is_payer,
  payment_status,
  slip_url,
  slip_uploaded_at,
  paid_amount,
  note
)
SELECT
  COALESCE(m->>'id', gen_random_uuid()::text) AS id,
  b.id AS bill_id,
  COALESCE(m->>'name', 'ไม่ระบุชื่อ') AS name,
  COALESCE(m->'gangIds', '[]'::jsonb) AS gang_ids,
  COALESCE((m->>'isFree')::boolean, false) AS is_free,
  COALESCE((m->>'isPayer')::boolean, false) AS is_payer,
  COALESCE(m->>'paymentStatus', 'PENDING') AS payment_status,
  m->>'slipUrl' AS slip_url,
  CASE 
    WHEN m->>'slipUploadedAt' IS NOT NULL AND m->>'slipUploadedAt' != '' 
    THEN (m->>'slipUploadedAt')::timestamptz 
    ELSE NULL 
  END AS slip_uploaded_at,
  COALESCE((m->>'paidAmount')::numeric, 0) AS paid_amount,
  m->>'note' AS note
FROM public.party_bills b,
LATERAL jsonb_array_elements(
  CASE 
    WHEN jsonb_typeof(b.members) = 'array' THEN b.members 
    ELSE '[]'::jsonb 
  END
) AS m
ON CONFLICT (id) DO UPDATE SET
  bill_id = EXCLUDED.bill_id,
  name = EXCLUDED.name,
  gang_ids = EXCLUDED.gang_ids,
  is_free = EXCLUDED.is_free,
  is_payer = EXCLUDED.is_payer,
  payment_status = EXCLUDED.payment_status,
  slip_url = EXCLUDED.slip_url,
  slip_uploaded_at = EXCLUDED.slip_uploaded_at,
  paid_amount = EXCLUDED.paid_amount,
  note = EXCLUDED.note,
  updated_at = NOW();

-- 7. ฟังก์ชันสำหรับการอัปเดตสลิปแบบ Atomic (เพื่อความเสถียรและเร็วสูงสุด)
CREATE OR REPLACE FUNCTION public.update_member_slip(
  p_bill_id TEXT,
  p_member_id TEXT,
  p_slip_url TEXT,
  p_uploaded_at TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- อัปเดตในตาราง party_members
  UPDATE public.party_members
  SET 
    slip_url = p_slip_url,
    payment_status = 'SLIP_UPLOADED',
    slip_uploaded_at = p_uploaded_at,
    updated_at = NOW()
  WHERE id = p_member_id AND bill_id = p_bill_id;

  -- อัปเดต sync ย้อนกลับเข้าตาราง party_bills (jsonb) เพื่อ backward compatibility
  UPDATE public.party_bills
  SET 
    members = (
      SELECT jsonb_agg(
        CASE 
          WHEN m->>'id' = p_member_id THEN
            jsonb_set(
              jsonb_set(
                jsonb_set(m, '{slipUrl}', to_jsonb(p_slip_url)),
                '{paymentStatus}', '"SLIP_UPLOADED"'
              ),
              '{slipUploadedAt}', to_jsonb(to_char(p_uploaded_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
            )
          ELSE m
        END
      )
      FROM jsonb_array_elements(members) AS m
    ),
    updated_at = NOW()
  WHERE id = p_bill_id;

  SELECT to_jsonb(m.*) INTO v_result FROM public.party_members m WHERE m.id = p_member_id;
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
