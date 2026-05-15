import { useMutation } from "@tanstack/react-query";
import supabase from "./supabase";
import type { Worker } from "../types";

const table = "workers";

const markPresent = async (person: Worker): Promise<Worker | null> => {
  const isPresentKey = "ispresent";
  const { data: worker } = await supabase
    .from(table)
    .select("*")
    .eq("id", person.id as number | string);

  if (!worker || worker.length === 0) return null;
  const workerAttendance = (worker[0] as Worker)[isPresentKey];
  if (workerAttendance) return worker[0] as Worker;

  const dateUTC = new Date();
  const dateISO = dateUTC.toISOString();

  const { data, error } = await supabase
    .from(table)
    .update({ [isPresentKey]: true, updatedat: dateISO })
    .eq("id", person.id as number | string);

  if (error) {
    throw new Error(error.message);
  }

  return data as Worker | null;
};

const manualAttendance = async (person: Worker): Promise<Worker[] | null> => {
  const { data, error } = await supabase
    .from(table)
    .insert({
      ...person,
      validate: true,
      updatedat: new Date().toISOString(),
    })
    .select("*");

  if (error) {
    throw new Error(error.message);
  }

  return data as Worker[] | null;
};

const updateWorker = async (person: Worker): Promise<Worker[] | null> => {
  const { id, ...rest } = person;
  const { data, error } = await supabase
    .from(table)
    .update({
      ...rest,
      ispresent: true,
      updatedat: new Date().toISOString(),
    })
    .eq("id", id as number | string)
    .select("*");

  if (error) {
    throw new Error(error.message);
  }

  return data as Worker[] | null;
};

const mutationDefaults = {
  networkMode: "offlineFirst" as const,
  retry: 3,
  retryDelay: (attempt: number) => Math.min(1000 * 2 ** attempt, 15000),
  gcTime: 0,
};

export const useAttendance = () => {
  return useMutation({
    mutationFn: markPresent,
    ...mutationDefaults,
  });
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
