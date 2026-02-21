import { supabase } from "./supabase";

export type DbShare = {
  id: string;
  owner_id: string;
  invitee_id: string;
  created_at: string;
};

export async function inviteByUserId(inviteeId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("db_shares").insert({
    owner_id: user.id,
    invitee_id: inviteeId,
  });
  if (error) throw error;
}

export async function revokeShare(shareId: string): Promise<void> {
  const { error } = await supabase
    .from("db_shares")
    .delete()
    .eq("id", shareId);
  if (error) throw error;
}

export async function leaveShare(shareId: string): Promise<void> {
  const { error } = await supabase
    .from("db_shares")
    .delete()
    .eq("id", shareId);
  if (error) throw error;
}

export async function getMyShares(): Promise<DbShare[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("db_shares")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as DbShare[];
}

export async function getSharedWithMe(): Promise<DbShare[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("db_shares")
    .select("*")
    .eq("invitee_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as DbShare[];
}
