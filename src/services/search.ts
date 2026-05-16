import { useQuery } from "@tanstack/react-query";
import supabase from "./supabase";
import type { Worker } from "../types";

const sanitise = (input: string) =>
  input.trim().slice(0, 100).replace(/[<>"'`;]/g, "");

const searchWorkers = async (
  searchParams: string | undefined | null
): Promise<Worker[]> => {
  if (!searchParams) return [];
  const cleaned = sanitise(searchParams);
  if (cleaned.length < 3) return [];
  const { data, error } = await supabase.rpc("get_search_results_v2", {
    search_text: cleaned,
  });
  if (error) {
    throw new Error("Search failed. Please try again.");
  }
  return (data as Worker[]) ?? [];
};

export const useSearchWorker = (searchParams: string | undefined | null) => {
  return useQuery<Worker[]>({
    queryKey: [searchParams],
    queryFn: () => searchWorkers(searchParams),
  });
};
