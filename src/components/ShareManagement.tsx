"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  inviteByUserId,
  revokeShare,
  leaveShare,
  getMyShares,
  getSharedWithMe,
  type DbShare,
} from "@/lib/sharing";

function shortenId(id: string): string {
  return id.substring(0, 7) + "...";
}

export function ShareManagement() {
  const [userId, setUserId] = useState<string | null>(null);
  const [myShares, setMyShares] = useState<DbShare[]>([]);
  const [sharedWithMe, setSharedWithMe] = useState<DbShare[]>([]);
  const [inviteeId, setInviteeId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const refresh = useCallback(async () => {
    const [my, shared] = await Promise.all([getMyShares(), getSharedWithMe()]);
    setMyShares(my);
    setSharedWithMe(shared);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      const [{ data: { user } }, my, shared] = await Promise.all([
        supabase.auth.getUser(),
        getMyShares(),
        getSharedWithMe(),
      ]);
      if (cancelled) return;
      if (user) setUserId(user.id);
      setMyShares(my);
      setSharedWithMe(shared);
      setLoading(false);
    }
    init();
    return () => { cancelled = true; };
  }, []);

  const handleCopyId = async () => {
    if (!userId) return;
    await navigator.clipboard.writeText(userId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInvite = async () => {
    setError(null);
    const trimmed = inviteeId.trim();
    if (!trimmed) return;
    if (trimmed === userId) {
      setError("自分自身は招待できません");
      return;
    }
    try {
      await inviteByUserId(trimmed);
      setInviteeId("");
      await refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "招待に失敗しました";
      if (msg.includes("duplicate") || msg.includes("unique")) {
        setError("このユーザーは既に招待済みです");
      } else {
        setError(msg);
      }
    }
  };

  const handleRevoke = async (shareId: string) => {
    await revokeShare(shareId);
    await refresh();
  };

  const handleLeave = async (shareId: string) => {
    await leaveShare(shareId);
    await refresh();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 自分のユーザーID */}
      <section>
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
          自分のユーザーID
        </h2>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg break-all">
            {userId}
          </code>
          <button
            type="button"
            onClick={handleCopyId}
            className="shrink-0 text-xs px-3 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700 active:bg-violet-800 transition-colors"
          >
            {copied ? "コピー済" : "コピー"}
          </button>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          このIDを相手に伝えて、招待してもらってください
        </p>
      </section>

      {/* 招待フォーム */}
      <section>
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
          ユーザーを招待
        </h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={inviteeId}
            onChange={(e) => setInviteeId(e.target.value)}
            placeholder="相手のユーザーIDを入力"
            className="flex-1 text-sm px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
          />
          <button
            type="button"
            onClick={handleInvite}
            disabled={!inviteeId.trim()}
            className="shrink-0 text-sm px-4 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700 active:bg-violet-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            招待
          </button>
        </div>
        {error && (
          <p className="text-xs text-red-500 mt-1">{error}</p>
        )}
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          招待すると、相手があなたのDBのレコードを閲覧・編集できるようになります
        </p>
      </section>

      {/* 共有中の一覧（自分がオーナー） */}
      <section>
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
          共有中（自分が招待した）
        </h2>
        {myShares.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">
            まだ誰も招待していません
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {myShares.map((share) => (
              <li
                key={share.id}
                className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg"
              >
                <code className="text-xs break-all">
                  {shortenId(share.invitee_id)}
                </code>
                <button
                  type="button"
                  onClick={() => handleRevoke(share.id)}
                  className="text-xs text-red-500 hover:text-red-600 px-2 py-1"
                >
                  取消
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 招待された一覧 */}
      <section>
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
          招待されたDB
        </h2>
        {sharedWithMe.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">
            まだ招待されていません
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {sharedWithMe.map((share) => (
              <li
                key={share.id}
                className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg"
              >
                <code className="text-xs break-all">
                  {shortenId(share.owner_id)}
                </code>
                <button
                  type="button"
                  onClick={() => handleLeave(share.id)}
                  className="text-xs text-red-500 hover:text-red-600 px-2 py-1"
                >
                  脱退
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
