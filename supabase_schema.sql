-- =========================================================================
-- Party Bill Splitter & AI Receipt Scanner: Supabase Schema (Free Tier)
-- =========================================================================
-- วิธีใช้งาน: คัดลอกโค้ดทั้งหมดนี้ไปวางในเมนู "SQL Editor" ของ Supabase แล้วกด "Run"

-- 1. ตารางข้อมูลโปรไฟล์ Host (ผู้สร้างบิล)
CREATE TABLE IF NOT EXISTS public.hosts (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT,
  phone_number TEXT,
  default_promptpay TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ตารางเก็บบิลปาร์ตี้ทั้งหมด (Party Bills)
CREATE TABLE IF NOT EXISTS public.party_bills (
  id TEXT PRIMARY KEY,
  host_id UUID REFERENCES public.hosts(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  location TEXT,
  vat_mode TEXT DEFAULT 'INCLUDE',
  vat_rate NUMERIC DEFAULT 0.07,
  service_charge_rate NUMERIC DEFAULT 0,
  sponsor_budget NUMERIC DEFAULT 0,
  deposit_amount NUMERIC DEFAULT 0,
  promptpay_number TEXT,
  promptpay_name TEXT,
  host_pin TEXT DEFAULT '1234',
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  gangs JSONB DEFAULT '[]'::jsonb,
  members JSONB DEFAULT '[]'::jsonb,
  items JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration support if columns already exist
ALTER TABLE public.party_bills ADD COLUMN IF NOT EXISTS service_charge_rate NUMERIC DEFAULT 0;
ALTER TABLE public.party_bills ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC DEFAULT 0;
ALTER TABLE public.party_bills ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE;
ALTER TABLE public.party_bills ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- 3. ตารางสมาชิกร่วมงานปาร์ตี้แยกรายคน (Party Members) สำหรับ Atomic Slip & Verification
CREATE TABLE IF NOT EXISTS public.party_members (
  id TEXT PRIMARY KEY,
  bill_id TEXT REFERENCES public.party_bills(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_party_members_bill_id ON public.party_members(bill_id);

-- 4. เปิดใช้งาน Row Level Security (RLS)
ALTER TABLE public.hosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_members ENABLE ROW LEVEL SECURITY;

-- 5. นโยบายความปลอดภัย (RLS Policies)

-- นโยบายสำหรับ hosts
DROP POLICY IF EXISTS "Hosts can view own profile" ON public.hosts;
CREATE POLICY "Hosts can view own profile" 
  ON public.hosts FOR SELECT 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Hosts can update own profile" ON public.hosts;
CREATE POLICY "Hosts can update own profile" 
  ON public.hosts FOR UPDATE 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Hosts can insert own profile" ON public.hosts;
CREATE POLICY "Hosts can insert own profile" 
  ON public.hosts FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- นโยบายสำหรับ party_bills
DROP POLICY IF EXISTS "Public can view party bills by id" ON public.party_bills;
CREATE POLICY "Public can view party bills by id" 
  ON public.party_bills FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Host can insert party bills" ON public.party_bills;
CREATE POLICY "Host can insert party bills" 
  ON public.party_bills FOR INSERT 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Host or Guests can update party bills" ON public.party_bills;
CREATE POLICY "Host or Guests can update party bills" 
  ON public.party_bills FOR UPDATE 
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Host can delete own party bills" ON public.party_bills;
CREATE POLICY "Host can delete own party bills" 
  ON public.party_bills FOR DELETE 
  USING (true);

-- นโยบายสำหรับ party_members (อนุญาตให้ทุกคนที่มีลิงก์เข้าดู แนบสลิป และให้ host ตรวจสอบ)
DROP POLICY IF EXISTS "Public can view party members" ON public.party_members;
CREATE POLICY "Public can view party members" 
  ON public.party_members FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Public can insert party members" ON public.party_members;
CREATE POLICY "Public can insert party members" 
  ON public.party_members FOR INSERT 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public can update party members" ON public.party_members;
CREATE POLICY "Public can update party members" 
  ON public.party_members FOR UPDATE 
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public can delete party members" ON public.party_members;
CREATE POLICY "Public can delete party members" 
  ON public.party_members FOR DELETE 
  USING (true);

-- 6. Storage Bucket สำหรับเก็บรูปภาพสลิปโอนเงิน (Optional Supabase Storage)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('slips', 'slips', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read access for slips" ON storage.objects;
CREATE POLICY "Public read access for slips" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'slips');

DROP POLICY IF EXISTS "Public upload access for slips" ON storage.objects;
CREATE POLICY "Public upload access for slips" 
  ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'slips');

DROP POLICY IF EXISTS "Public update access for slips" ON storage.objects;
CREATE POLICY "Public update access for slips" 
  ON storage.objects FOR UPDATE 
  USING (bucket_id = 'slips');

-- 7. Function อัปเดตสลิปและสถานะการชำระเงินแบบ Atomic RPC
CREATE OR REPLACE FUNCTION public.update_member_slip(
  p_bill_id TEXT,
  p_member_id TEXT,
  p_slip_url TEXT,
  p_uploaded_at TIMESTAMPTZ DEFAULT NOW()
)
RETURNS BOOLEAN AS $$
DECLARE
  v_members JSONB;
BEGIN
  -- 1. อัปเดตตาราง party_members
  UPDATE public.party_members
  SET 
    slip_url = p_slip_url,
    payment_status = 'SLIP_UPLOADED',
    slip_uploaded_at = p_uploaded_at,
    updated_at = NOW()
  WHERE id = p_member_id AND bill_id = p_bill_id;

  -- 2. อัปเดต members JSONB ใน party_bills
  SELECT members INTO v_members FROM public.party_bills WHERE id = p_bill_id;
  IF v_members IS NOT NULL THEN
    UPDATE public.party_bills
    SET 
      members = (
        SELECT jsonb_agg(
          CASE 
            WHEN (elem->>'id') = p_member_id THEN 
              elem || jsonb_build_object(
                'slipUrl', p_slip_url,
                'paymentStatus', 'SLIP_UPLOADED',
                'slipUploadedAt', p_uploaded_at
              )
            ELSE elem 
          END
        )
        FROM jsonb_array_elements(v_members) elem
      ),
      updated_at = NOW()
    WHERE id = p_bill_id;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Trigger อัปเดต public.hosts อัตโนมัติเมื่อมีการสมัครสมาชิกผ่าน Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.hosts (id, email, first_name, last_name, phone_number, default_promptpay)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'first_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    COALESCE(new.raw_user_meta_data->>'phone_number', ''),
    COALESCE(new.raw_user_meta_data->>'default_promptpay', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    phone_number = EXCLUDED.phone_number,
    default_promptpay = EXCLUDED.default_promptpay,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- สร้าง Trigger ผูกกับ auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
