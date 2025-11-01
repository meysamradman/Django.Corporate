"use client";

import { Statistics } from "@/components/dashboard/Statistics";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">
          داشبورد
        </h1>
      </div>
      <Statistics />
    </div>
  );
} 