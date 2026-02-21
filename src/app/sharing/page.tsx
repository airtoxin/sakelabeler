"use client";

import { Header } from "@/components/Header";
import { AuthGuard } from "@/components/AuthGuard";
import { ShareManagement } from "@/components/ShareManagement";

export default function SharingPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Header title="共有管理" showBack />
        <main className="px-4 py-4 max-w-lg mx-auto">
          <ShareManagement />
        </main>
      </div>
    </AuthGuard>
  );
}
