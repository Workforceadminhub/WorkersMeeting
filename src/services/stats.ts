import supabase from "./supabase";
import { WORKERS_TABLE } from "../utils/constants";

type CountFilters = {
  ispresent?: boolean;
  isconfirmed?: boolean;
  department?: string;
};

export const countWorkers = async (filters: CountFilters): Promise<number> => {
  let q = supabase.from(WORKERS_TABLE).select("*", { count: "exact", head: true });
  if (filters.ispresent !== undefined) q = q.eq("ispresent", filters.ispresent);
  if (filters.isconfirmed !== undefined) q = q.eq("isconfirmed", filters.isconfirmed);
  if (filters.department && filters.department !== "All") {
    q = q.eq("department", filters.department);
  }
  const { count } = await q;
  return count ?? 0;
};
