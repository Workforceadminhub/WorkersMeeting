import { useQuery } from "@tanstack/react-query";
import supabase from "./supabase";
import { sanitise } from "../utils/input";
import { GENERIC_ERROR, WORKERS_TABLE } from "../utils/constants";
import type { Worker } from "../types";

const SEARCH_COLUMNS = [
  "first_name",
  "last_name",
  "fullname",
  "fullnamereverse",
  "phone_number",
  "team",
  "department",
  "email",
] as const;

const searchWorkers = async (
  searchParams: string | undefined | null
): Promise<Worker[]> => {
  if (!searchParams) return [];
  // Strip characters that have meaning in PostgREST or-filter syntax
  // on top of the general sanitiser.
  const cleaned = sanitise(searchParams).replace(/[,%().]/g, "");
  if (cleaned.length < 3) return [];
  const orFilter = SEARCH_COLUMNS.map(
    (column) => `${column}.ilike.%${cleaned}%`
  ).join(",");
  const { data, error } = await supabase
    .from(WORKERS_TABLE)
    .select("*")
    .or(orFilter);
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
