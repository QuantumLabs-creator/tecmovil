import DashboardShell from "@/src/components/layout/DashboardShell";
import type { ReactNode } from "react";


export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}