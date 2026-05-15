import { useEffect, useMemo } from "react";
import {
  Controller,
  useForm,
  useWatch,
  type Control,
  type UseFormSetValue,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import capitalize from "lodash/capitalize";
import Select from "./Dropdown";
import {
  GENDER_OPTIONS,
  PHONE_LENGTH,
  defaultWorkerValues,
  workerSchema,
} from "../schemas/worker";
import { departmentsWithTeams, teamsSummary } from "../utils/options";
import { workerrolesoptions } from "../utils/teams";
import type { WorkerFormValues } from "../types";

const onlyDigits = (value: string) => (value || "").replace(/\D/g, "");

type TeamDepartmentSelectsProps = {
  control: Control<WorkerFormValues>;
  setValue: UseFormSetValue<WorkerFormValues>;
};

const TeamDepartmentSelects = ({
  control,
  setValue,
}: TeamDepartmentSelectsProps) => {
  const team = useWatch({ control, name: "team" });

  const teamOptions = useMemo(
    () => [
      { label: "Choose team", value: "" },
      ...teamsSummary.filter((option) => option.value !== "All"),
    ],
    []
  );

  const departmentOptions = useMemo(() => {
    const list = team ? departmentsWithTeams[team] || [] : [];
    return [
      { label: "Choose department", value: "" },
      ...list.map((department) => ({
        label: department,
        value: department,
      })),
    ];
  }, [team]);

  return (
    <>
      <Controller
        control={control}
        name="team"
        render={({ field, fieldState }) => (
          <Select
            label="Team"
            options={teamOptions}
            value={field.value}
            onChange={(value) => {
              field.onChange(value);
              setValue("department", "", { shouldValidate: true });
            }}
            onBlur={field.onBlur}
            hasErrors={Boolean(fieldState.error)}
            error={fieldState.error?.message}
            className="mb-3"
          />
        )}
      />
      <Controller
        control={control}
        name="department"
        render={({ field, fieldState }) => (
          <Select
            label="Department"
            options={departmentOptions}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            hasErrors={Boolean(fieldState.error)}
            error={fieldState.error?.message}
            className="mb-3"
          />
        )}
      />
    </>
  );
};

type WorkerFormProps = {
  mode: "create" | "edit";
  initialValues: Partial<WorkerFormValues> | null;
  isSubmitting: boolean;
  submitLabel: string;
  onSubmit: (values: WorkerFormValues) => void;
  onCancel: () => void;
};

const WorkerForm = ({
  mode,
  initialValues,
  isSubmitting,
  submitLabel,
  onSubmit,
  onCancel,
}: WorkerFormProps) => {
  const roleOptions = useMemo(
    () => [
      { label: "Choose role", value: "" },
      ...workerrolesoptions.filter((option) => option.value !== "All"),
    ],
    []
  );

  const genderOptions = useMemo(
    () => [
      { label: "Choose gender", value: "" },
      ...GENDER_OPTIONS.map((o) => ({ label: o.label, value: o.value })),
    ],
    []
  );

  const {
    control,
    register,
    handleSubmit,
    setValue,
    getValues,
    reset,
    trigger,
    formState: { errors, isValid },
  } = useForm<WorkerFormValues>({
    resolver: zodResolver(workerSchema),
    mode: "onTouched",
    defaultValues: { ...defaultWorkerValues, ...initialValues },
  });

  useEffect(() => {
    reset({ ...defaultWorkerValues, ...initialValues });
    // Validate the pre-filled values immediately so isValid reflects
    // reality and any problems (e.g. a 10-digit phone) are surfaced
    // right away instead of only after the user touches a field.
    void trigger();
  }, [initialValues, reset, trigger]);

  const capitalizeOnBlur = (field: "first_name" | "last_name") => () => {
    const current = getValues(field) || "";
    const next = capitalize(current.trim());
    if (next !== current) {
      setValue(field, next, { shouldValidate: true, shouldDirty: true });
    }
  };

  const idPrefix = mode;
  const buttonDisabled = isSubmitting || !isValid;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <label htmlFor={`${idPrefix}-firstname`} className="form-label">
          First name
        </label>
        <input
          id={`${idPrefix}-firstname`}
          type="text"
          autoComplete="given-name"
          placeholder="First Name"
          className="form-input"
          aria-invalid={errors.first_name ? true : undefined}
          {...register("first_name", {
            onBlur: capitalizeOnBlur("first_name"),
          })}
        />
        {errors.first_name && (
          <p className="mt-1 text-xs text-red-600" role="alert">
            {errors.first_name.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor={`${idPrefix}-lastname`} className="form-label">
          Last name
        </label>
        <input
          id={`${idPrefix}-lastname`}
          type="text"
          autoComplete="family-name"
          placeholder="Last Name"
          className="form-input"
          aria-invalid={errors.last_name ? true : undefined}
          {...register("last_name", {
            onBlur: capitalizeOnBlur("last_name"),
          })}
        />
        {errors.last_name && (
          <p className="mt-1 text-xs text-red-600" role="alert">
            {errors.last_name.message}
          </p>
        )}
      </div>

      <Controller
        control={control}
        name="gender"
        render={({ field, fieldState }) => (
          <Select
            label="Gender"
            options={genderOptions}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            hasErrors={Boolean(fieldState.error)}
            error={fieldState.error?.message}
            className="mb-3"
          />
        )}
      />

      <div>
        <label htmlFor={`${idPrefix}-phone`} className="form-label">
          Phone number
        </label>
        <Controller
          control={control}
          name="phone_number"
          render={({ field, fieldState }) => {
            const value = field.value || "";
            const length = value.length;
            const showError = Boolean(fieldState.error);
            return (
              <>
                <input
                  id={`${idPrefix}-phone`}
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  pattern={`\\d{${PHONE_LENGTH}}`}
                  maxLength={PHONE_LENGTH}
                  placeholder={`${PHONE_LENGTH}-digit phone number`}
                  className="form-input"
                  value={value}
                  onBlur={field.onBlur}
                  onChange={(e) =>
                    field.onChange(onlyDigits(e.target.value).slice(0, PHONE_LENGTH))
                  }
                  aria-invalid={showError ? true : undefined}
                  aria-describedby={`${idPrefix}-phone-hint`}
                />
                <div id={`${idPrefix}-phone-hint`} className="mt-1 flex items-center justify-between text-xs">
                  {showError ? (
                    <p className="text-red-600" role="alert">{fieldState.error?.message}</p>
                  ) : (
                    <span aria-hidden="true" />
                  )}
                  <span
                    aria-hidden="true"
                    style={{ color: length === PHONE_LENGTH ? "var(--green)" : "var(--text-muted)" }}
                  >
                    {length}/{PHONE_LENGTH}
                  </span>
                </div>
              </>
            );
          }}
        />
      </div>

      <TeamDepartmentSelects control={control} setValue={setValue} />

      <Controller
        control={control}
        name="role"
        render={({ field, fieldState }) => (
          <Select
            label="Role"
            options={roleOptions}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            hasErrors={Boolean(fieldState.error)}
            error={fieldState.error?.message}
            className="mb-3"
          />
        )}
      />

      <div className="flex space-x-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-ghost w-full">
          Cancel
        </button>
        <button
          type="submit"
          disabled={buttonDisabled}
          aria-disabled={buttonDisabled}
          className="btn-submit w-full"
        >
          {isSubmitting ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
};

export default WorkerForm;
