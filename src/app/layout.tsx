import type { Metadata } from "next";
import { Inter, Prompt } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const prompt = Prompt({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-prompt",
});

export const metadata: Metadata = {
  title: "Party Bill Splitter & AI Receipt Scanner | ระบบหารบิลปาร์ตี้อัจฉริยะ",
  description:
    "เว็บแอปพลิเคชันสแกนบิล, จัดอาหารเข้าแก๊ง, หารค่าใช้จ่ายปาร์ตี้อัจฉริยะ พร้อม PromptPay QR, ประวัติบิล และระบบแนบสลิป",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={`${inter.variable} ${prompt.variable}`}>
      <body className="font-sans antialiased bg-slate-50 text-slate-900 min-h-screen">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
