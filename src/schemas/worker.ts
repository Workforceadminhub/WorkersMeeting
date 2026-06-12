import { z } from "zod";
import { departmentsWithTeams } from "../utils/options";
import { workerrolesoptions } from "../utils/teams";

export const PHONE_LENGTH = 11;

const validRoleValues = workerrolesoptions
  .map((option) => option.value)
  .filter((value) => value !== "All");

export const GENDER_OPTIONS = [
  { label: "Male", value: "Male" },
  { label: "Female", value: "Female" },
] as const;

const genderValues = GENDER_OPTIONS.map((option) => option.value);

export const CAMPUS_OPTIONS = [
  "Gbagada",
  "Ajah",
  "Apapa",
  "Arepo",
  "Ibadan",
  "Ikorodu",
  "Ilupeju",
  "Magodo",
  "New Lagos",
  "Surulere",
  "Yaba",
] as const;

export const workerSchema = z
  .object({
    first_name: z.string().trim().min(1, "First name is required"),
    last_name: z.string().trim().min(1, "Last name is required"),
    gender: z
      .string()
      .min(1, "Gender is required")
      .refine(
        (value) => (genderValues as readonly string[]).includes(value),
        "Choose a valid gender"
      ),
    phone_number: z.string().superRefine((value, ctx) => {
      if (!value) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Phone number is required",
        });
        return;
      }
      if (!/^\d+$/.test(value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Phone number must only contain digits",
        });
        return;
      }
      if (value.length < PHONE_LENGTH) {
        const missing = PHONE_LENGTH - value.length;
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Phone number has ${value.length} digits — add ${missing} more to reach ${PHONE_LENGTH} (e.g. 08012345678)`,
        });
        return;
      }
      if (value.length > PHONE_LENGTH) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Phone number has ${value.length} digits — should be ${PHONE_LENGTH}`,
        });
      }
    }),
    team: z
      .string()
      .min(1, "Team is required")
      .refine((value) => value !== "All", "Team is required"),
    department: z.string().min(1, "Department is required"),
    role: z
      .string()
      .min(1, "Role is required")
      .refine(
        (value) => validRoleValues.includes(value),
        "Choose a valid role"
      ),
    campus: z
      .string()
      .min(1, "Campus is required")
      .refine(
        (value) => (CAMPUS_OPTIONS as readonly string[]).includes(value),
        "Choose a valid campus"
      ),
  })
  .superRefine((data, ctx) => {
    const teamDepartments = departmentsWithTeams[data.team];
    if (!teamDepartments) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["team"],
        message: "Choose a valid team",
      });
      return;
    }
    if (!teamDepartments.includes(data.department)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["department"],
        message: "Choose a department that belongs to the selected team",
      });
    }
  });

export const defaultWorkerValues: z.infer<typeof workerSchema> = {
  first_name: "",
  last_name: "",
  gender: "",
  phone_number: "",
  team: "",
  department: "",
  role: "",
  campus: "",
};
