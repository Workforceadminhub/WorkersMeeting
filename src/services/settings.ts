import { useQuery } from "@tanstack/react-query";
import supabase from "./supabase";

export const DEFAULT_MEETING_TITLE =
  "Harvesters Gbagada Group 2\nGlobal Cell Leaders & Workforce Conference 2026\nDay 1 - Friday, 12th June 2026";

const fetchSetting = async <T = unknown>(key: string): Promise<T | null> => {
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data?.value as T | undefined) ?? null;
};

export const useMeetingTitle = () => {
  const query = useQuery({
    queryKey: ["app_settings", "meeting_title"],
    queryFn: () => fetchSetting<string>("meeting_title"),
    staleTime: 5 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 1,
    networkMode: "offlineFirst" as const,
  });

  const raw = query.data;
  const title =
    typeof raw === "string" && raw.trim().length > 0
      ? raw
      : DEFAULT_MEETING_TITLE;

  return { ...query, title };
};
