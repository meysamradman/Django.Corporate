"use client";

import { Statistics } from "@/components/dashboard/Statistics";
import { RolesSection } from "@/components/dashboard/RolesSection";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">
          داشبورد
        </h1>
      </div>
      <Statistics />
      <RolesSection />
    </div>
  );
} 