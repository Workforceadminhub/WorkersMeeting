import type { z } from "zod";
import type { workerSchema } from "../schemas/worker";

export type WorkerFormValues = z.infer<typeof workerSchema>;

export type Worker = WorkerFormValues & {
  id?: number | string;
  worker_id?: string | null;
  fullname?: string | null;
  fullnamereverse?: string | null;
  other_name?: string | null;
  email?: string | null;
  address?: string | null;
  employment?: string | null;
  marital_status?: string | null;
  birthdate?: string | null;
  age_range?: string | null;
  updatedat?: string | null;
  createdat?: string | null;
  ispresent?: boolean | null;
  isconfirmed?: boolean | null;
};

export type SelectOption = {
  label: string;
  value: string;
};
