import { useMutation } from "@tanstack/react-query";
import supabase from "./supabase";
import { nowISO } from "../utils/formatting";
import { GENERIC_ERROR } from "../utils/constants";
import type { Worker } from "../types";

const table = "workers";

const manualAttendance = async (person: Worker): Promise<Worker[] | null> => {
  const { data, error } = await supabase
    .from(table)
    .insert({
      first_name: person.first_name,
      last_name: person.last_name,
      gender: person.gender,
      phone_number: person.phone_number,
      team: person.team,
      department: person.department,
      role: person.role,
      fullname: person.fullname,
      ispresent: true,
      updatedat: nowISO(),
    })
    .select("*");

  if (error) throw new Error(GENERIC_ERROR);
  return data as Worker[] | null;
};

const updateWorker = async (person: Worker): Promise<Worker[] | null> => {
  const { id } = person;
  const { data, error } = await supabase
    .from(table)
    .update({ ispresent: true, updatedat: nowISO() })
    .eq("id", id as number | string)
    .select("*");

  if (error) throw new Error(GENERIC_ERROR);
  return data as Worker[] | null;
};

const mutationDefaults = {
  networkMode: "offlineFirst" as const,
  retry: 3,
  retryDelay: (attempt: number) => Math.min(1000 * 2 ** attempt, 15000),
  gcTime: 0,
};

export const useManualAttendance = () => {
  return useMutation({
    mutationFn: manualAttendance,
    ...mutationDefaults,
  });
};

export const useWorkerUpdate = () => {
  return useMutation({
    mutationFn: updateWorker,
    ...mutationDefaults,
  });
};
