import { useQuery } from "@tanstack/react-query";
import supabase from "./supabase";
import { sanitise } from "../utils/input";
import { GENERIC_ERROR } from "../utils/constants";
import type { Worker } from "../types";

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
    throw new Error(GENERIC_ERROR);
  }
  return (data as Worker[]) ?? [];
};

export const useSearchWorker = (searchParams: string | undefined | null) => {
  return useQuery<Worker[]>({
    queryKey: [searchParams],
    queryFn: () => searchWorkers(searchParams),
  });
};
