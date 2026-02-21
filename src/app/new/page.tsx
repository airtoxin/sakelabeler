"use client";

import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { SakeForm } from "@/components/SakeForm";
import { AuthGuard } from "@/components/AuthGuard";
import { useStorage } from "@/components/StorageProvider";
import type { SakeRecordInput } from "@/lib/types";

export default function NewRecordPage() {
  const router = useRouter();
  const storage = useStorage();

  const handleSubmit = async (values: SakeRecordInput) => {
    await storage.create(values);
    router.push("/");
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Header title="新しい記録" showBack />
        <main className="px-4 py-4 max-w-lg mx-auto">
          <SakeForm onSubmit={handleSubmit} />
        </main>
      </div>
    </AuthGuard>
  );
}
