import { useQuery } from "@tanstack/react-query";
import supabase from "./supabase";
import type { ReportRowFilter } from "../utils/report";

export type LeaderDetail = {
  id: number | string;
  first_name: string | null;
  last_name: string | null;
  fullname: string | null;
  phone_number: string | null;
  team: string | null;
  department: string | null;
  role: string | null;
  gender: string | null;
  ispresent: boolean | null;
  isconfirmed: boolean | null;
  updatedat: string | null;
};

const PAGE_SIZE = 1000;

const fetchPage = async (
  filter: ReportRowFilter,
  from: number,
  to: number
): Promise<LeaderDetail[]> => {
  let q = supabase
    .from("workers")
    .select(
      "id, first_name, last_name, fullname, phone_number, team, department, role, gender, ispresent, isconfirmed, updatedat"
    )
    .range(from, to);

  if (filter.kind === "team") {
    q = q.ilike("team", filter.team);
  } else if (filter.kind === "team-department") {
    q = q.ilike("team", filter.team).ilike("department", filter.department);
  } else if (filter.kind === "team-department-suffix") {
    q = q.ilike("team", filter.team).ilike("department", `%${filter.suffix}`);
  }

  const { data, error } = await q;
  if (error) throw new Error("Something went wrong. Please try again.");
  return (data || []) as LeaderDetail[];
};

const fetchAllForFilter = async (
  filter: ReportRowFilter
): Promise<LeaderDetail[]> => {
  const all: LeaderDetail[] = [];
  let from = 0;
  while (true) {
    const to = from + PAGE_SIZE - 1;
    const page = await fetchPage(filter, from, to);
    if (page.length === 0) break;
    all.push(...page);
    if (page.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return all;
};

const dedupeById = (rows: LeaderDetail[]) => {
  const seen = new Set<string | number>();
  const out: LeaderDetail[] = [];
  for (const r of rows) {
    const key = r.id ?? `${r.first_name}-${r.last_name}-${r.phone_number}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out;
};

export const useLeaderDetails = (filters: ReportRowFilter[] | null) => {
  return useQuery({
    queryKey: ["worker_details", filters],
    enabled: Boolean(filters && filters.length > 0),
    queryFn: async () => {
      if (!filters || filters.length === 0) return [] as LeaderDetail[];
      const results = await Promise.all(filters.map(fetchAllForFilter));
      return dedupeById(results.flat()).sort((a, b) => {
        const an = `${a.last_name || ""} ${a.first_name || ""}`
          .trim()
          .toLowerCase();
        const bn = `${b.last_name || ""} ${b.first_name || ""}`
          .trim()
          .toLowerCase();
        return an.localeCompare(bn);
      });
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });
};
