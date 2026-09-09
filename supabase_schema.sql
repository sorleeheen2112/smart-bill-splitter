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
  sponsor_budget NUMERIC DEFAULT 0,
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

-- Migration support if table already exists
ALTER TABLE public.party_bills ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE;
ALTER TABLE public.party_bills ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- 3. เปิดใช้งาน Row Level Security (RLS)
ALTER TABLE public.hosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_bills ENABLE ROW LEVEL SECURITY;

-- 4. นโยบายความปลอดภัย (RLS Policies)

-- นโยบายสำหรับ hosts
CREATE POLICY "Hosts can view own profile" 
  ON public.hosts FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Hosts can update own profile" 
  ON public.hosts FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Hosts can insert own profile" 
  ON public.hosts FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- นโยบายสำหรับ party_bills
-- 4.1 ทุกคนที่มีลิงก์สามารถดูบิลได้ (สำหรับเพื่อนที่เข้าลิงก์ /bill/xxx)
DROP POLICY IF EXISTS "Public can view party bills by id" ON public.party_bills;
CREATE POLICY "Public can view party bills by id" 
  ON public.party_bills FOR SELECT 
  USING (true);

-- 4.2 Host เจ้าของบิลสามารถสร้างบิลใหม่ได้
DROP POLICY IF EXISTS "Host can insert party bills" ON public.party_bills;
CREATE POLICY "Host can insert party bills" 
  ON public.party_bills FOR INSERT 
  WITH CHECK (true);

-- 4.3 Host หรือผู้ที่มีลิงก์สามารถอัปเดตบิลได้ (Host แก้ไขบิล / Guest แนบสลิป)
DROP POLICY IF EXISTS "Host or Guests can update party bills" ON public.party_bills;
CREATE POLICY "Host or Guests can update party bills" 
  ON public.party_bills FOR UPDATE 
  USING (true)
  WITH CHECK (true);

-- 4.4 Host เจ้าของบิลสามารถลบบิลของตัวเองได้
DROP POLICY IF EXISTS "Host can delete own party bills" ON public.party_bills;
CREATE POLICY "Host can delete own party bills" 
  ON public.party_bills FOR DELETE 
  USING (auth.uid() = host_id OR host_id IS NULL);

-- 5. Trigger อัปเดต public.hosts อัตโนมัติเมื่อมีการสมัครสมาชิกผ่าน Supabase Auth
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
