import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Masuk",
  description: "Masuk ke Sistem NPU File Manager Universitas Nusa Putra",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
