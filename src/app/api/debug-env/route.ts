import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    supabaseUrlSet: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseAnonKeySet: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    // サーバーサイドでの確認（NEXT_PUBLIC_変数はSSRでも利用可能）
    supabaseUrlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30) ?? null,
  });
}
