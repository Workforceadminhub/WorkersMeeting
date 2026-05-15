import { useQuery } from "@tanstack/react-query";
import supabase from "./supabase";
import { buildReport, type LeaderAggRow } from "../utils/report";

const PAGE_SIZE = 1000;

const fetchAllLeaderAggRows = async (): Promise<LeaderAggRow[]> => {
  const all: LeaderAggRow[] = [];
  let from = 0;
  while (true) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from("workers")
      .select("team, department, ispresent, isconfirmed")
      .range(from, to);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    all.push(...(data as LeaderAggRow[]));
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return all;
};

export const useReportData = () => {
  return useQuery({
    queryKey: ["admin_report"],
    queryFn: async () => {
      const leaders = await fetchAllLeaderAggRows();
      return buildReport(leaders);
    },
    staleTime: 30 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
};
