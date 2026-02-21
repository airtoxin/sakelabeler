"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

type HeaderProps = {
  title: string;
  showBack?: boolean;
};

export function Header({ title, showBack }: HeaderProps) {
  const router = useRouter();
  const { signOut } = useAuth();

  return (
    <header className="sticky top-0 z-10 bg-violet-600 text-white px-4 py-3 flex items-center gap-3 shadow-md">
      {showBack && (
        <button
          onClick={() => router.back()}
          className="p-1 -ml-1 rounded-lg hover:bg-violet-500 active:bg-violet-700"
          aria-label="戻る"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-6 h-6"
          >
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
          </svg>
        </button>
      )}
      <h1 className="text-lg font-bold truncate flex-1">{title}</h1>
      <button
        onClick={async () => {
          await signOut();
          router.push("/login");
        }}
        className="text-xs px-2.5 py-1.5 rounded-lg bg-violet-500 hover:bg-violet-400 active:bg-violet-700 transition-colors"
      >
        ログアウト
      </button>
    </header>
  );
}
