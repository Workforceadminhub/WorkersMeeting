import { useSearchWorker } from "../services/search";
import { useDebouncedSearch } from "../hooks/useDebouncedSearch";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  useManualAttendance,
  useWorkerUpdate,
} from "../services/attendance";
import { CheckBadgeIcon } from "@heroicons/react/16/solid";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import WorkerForm from "./WorkerForm";
import { useMeetingTitle } from "../services/settings";
import type { Worker, WorkerFormValues } from "../types";

const CONFIRMATION_TIMEOUT_MS = 4500;

type Confirmation = {
  name: string;
  team: string;
  department: string;
  role: string;
  timestamp: Date;
};

const Attendance = () => {
  const { debouncedSearch, search: searchValue } = useDebouncedSearch();
  const { data: filteredPeople, isLoading } = useSearchWorker(searchValue);
  const { mutate: manualAttendanceMutation, isPending: isCreatingSubmitting } =
    useManualAttendance();
  const { mutate: updateWorker, isPending: isEditingSubmitting } =
    useWorkerUpdate();

  const [query, setQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editInitialValues, setEditInitialValues] = useState<Worker | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const confirmationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryClient = useQueryClient();

  const { title } = useMeetingTitle();
  const [titleLine1, titleLine2] = title.split("\n");

  useEffect(() => {
    return () => {
      if (confirmationTimer.current) clearTimeout(confirmationTimer.current);
    };
  }, []);

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value.startsWith("0") ? value.replace(/^0/, "") : value);
  };

  const handleCreate = () => setIsCreating(true);
  const resetCreate = () => setIsCreating(false);
  const resetEdit = () => {
    setIsEditing(false);
    setEditInitialValues(null);
  };

  const showConfirmation = (person: WorkerFormValues) => {
    setConfirmation({
      name: `${person.first_name || ""} ${person.last_name || ""}`.trim(),
      team: person.team,
      department: person.department,
      role: person.role,
      timestamp: new Date(),
    });
    setQuery("");
    debouncedSearch("");
    if (confirmationTimer.current) clearTimeout(confirmationTimer.current);
    confirmationTimer.current = setTimeout(() => setConfirmation(null), CONFIRMATION_TIMEOUT_MS);
  };

  const dismissConfirmation = () => {
    if (confirmationTimer.current) clearTimeout(confirmationTimer.current);
    setConfirmation(null);
  };

  const handleSave = (values: WorkerFormValues) => {
    const payload: Worker = {
      ...values,
      fullname: `${values.first_name.trim()} ${values.last_name.trim()}`.trim(),
      ispresent: true,
    };
    manualAttendanceMutation(payload, {
      onSuccess() {
        queryClient.invalidateQueries();
        setIsCreating(false);
        showConfirmation(values);
      },
      onError() {
        toast.error("Could not save attendance. Try again.");
      },
    });
  };

  const handleUpdate = (values: WorkerFormValues) => {
    const payload: Worker = {
      ...(editInitialValues || {}),
      ...values,
      fullname: `${values.first_name.trim()} ${values.last_name.trim()}`.trim(),
      ispresent: true,
    };
    updateWorker(payload, {
      onSuccess() {
        queryClient.invalidateQueries();
        setIsEditing(false);
        setEditInitialValues(null);
        showConfirmation(values);
      },
      onError() {
        toast.error("Could not mark attendance. Try again.");
      },
    });
  };

  const handleEdit = (person: Worker) => {
    setEditInitialValues(person);
    setIsEditing(true);
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

  return (
    <div className="min-h-screen flex flex-col md:items-center" style={{ background: "var(--parchment)" }}>
      <div className="w-full max-w-xl px-3 sm:px-4">

        {/* Header */}
        <header className="text-center pt-6 sm:pt-10 pb-4 sm:pb-6">
          <div className="flex justify-center mb-4 sm:mb-6">
            <img
              src="/logo.jpg"
              alt="Harvesters International Christian Center Logo"
              className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
              style={{ borderRadius: 16, mixBlendMode: "multiply" }}
            />
          </div>
          <div className="gold-rule mb-4" />
          <h1 className="font-display text-2xl sm:text-3xl font-bold leading-snug px-2" style={{ color: "var(--navy)" }}>
            {titleLine1}
          </h1>
          {titleLine2 && (
            <p className="mt-1 text-xs sm:text-sm font-medium tracking-widest uppercase" style={{ color: "var(--gold)" }}>
              {titleLine2}
            </p>
          )}
          <div className="gold-rule mt-4" />
        </header>

        {/* Main card */}
        <div className="card p-4 sm:p-6 mb-24">
          {confirmation ? (
            <div
              role="status"
              aria-live="polite"
              className="fade-up flex flex-col items-center text-center py-6"
            >
              <div className="confirmation-badge">
                <CheckBadgeIcon className="h-9 w-9" style={{ color: "var(--green)" }} />
              </div>
              <p className="mt-2 text-xs font-semibold tracking-widest uppercase mt-4" style={{ color: "var(--gold)" }}>
                Attendance Marked
              </p>
              <h2 className="font-display text-2xl font-bold mt-1" style={{ color: "var(--navy)" }}>
                {confirmation.name}
              </h2>
              <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
                {confirmation.team}{confirmation.department && ` · ${confirmation.department}`}
              </p>
              {confirmation.role && (
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  {confirmation.role}
                </p>
              )}
              <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                {formatTime(confirmation.timestamp)}
              </p>
              <div className="gold-rule mt-6 mb-6 w-full" />
              <button onClick={dismissConfirmation} className="btn-submit w-full max-w-xs">
                Mark Next Person
              </button>
            </div>
          ) : (
            <>
              {!isEditing && !isCreating && (
                <div className="relative mb-4">
                  <input
                    type="search"
                    inputMode="search"
                    aria-label="Search by name or phone number"
                    placeholder="Search by name or phone number"
                    className="search-input"
                    value={query}
                    onChange={handleSearch}
                  />
                </div>
              )}

              {!isCreating && !isEditing && searchValue && filteredPeople && filteredPeople.length > 0 ? (
                <div className="fade-up">
                  <ul className="space-y-2">
                    {filteredPeople.map((person, index) => (
                      <li key={index} className="worker-card">
                        <div className="worker-info flex flex-col gap-0.5">
                          <span className="font-semibold text-sm" style={{ color: "var(--navy)" }}>
                            {person.first_name} {person.last_name}
                          </span>
                          {person.role && (
                            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                              {person.role}
                            </span>
                          )}
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                            {person.team}{person.department && ` · ${person.department}`}
                          </span>
                        </div>
                        {person.ispresent ? (
                          <button disabled aria-disabled="true" className="btn-present">
                            <CheckBadgeIcon className="size-4" />
                            Present
                          </button>
                        ) : (
                          <button onClick={() => handleEdit(person)} className="btn-open">
                            Open
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 text-center">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                      <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>or</span>
                      <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                    </div>
                    <button onClick={handleCreate} className="btn-primary w-full">
                      Manually Add Attendance
                    </button>
                  </div>
                </div>
              ) : (
                !isCreating && !isEditing && (
                  <div className="text-center py-4">
                    {isLoading && searchValue ? (
                      <p className="text-sm" style={{ color: "var(--text-muted)" }}>Searching…</p>
                    ) : !isLoading && searchValue ? (
                      <div className="fade-up">
                        <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>No results found</p>
                        <button onClick={handleCreate} className="btn-primary w-full">
                          Manually Add Attendance
                        </button>
                      </div>
                    ) : null}
                  </div>
                )
              )}

              {isCreating && (
                <div className="fade-up">
                  <p className="form-label text-center mb-4" style={{ color: "var(--gold)", fontSize: 11 }}>
                    Manual Entry
                  </p>
                  <h2 className="font-display text-xl font-bold text-center mb-5" style={{ color: "var(--navy)" }}>
                    Add Attendance
                  </h2>
                  <WorkerForm
                    mode="create"
                    initialValues={null}
                    isSubmitting={isCreatingSubmitting}
                    submitLabel="Save Attendance"
                    onSubmit={handleSave}
                    onCancel={resetCreate}
                  />
                </div>
              )}

              {isEditing && (
                <div className="fade-up">
                  <p className="form-label text-center mb-4" style={{ color: "var(--gold)", fontSize: 11 }}>
                    Confirm Details
                  </p>
                  <h2 className="font-display text-xl font-bold text-center mb-5" style={{ color: "var(--navy)" }}>
                    Mark Attendance
                  </h2>
                  <WorkerForm
                    mode="edit"
                    initialValues={editInitialValues}
                    isSubmitting={isEditingSubmitting}
                    submitLabel="Mark Present"
                    onSubmit={handleUpdate}
                    onCancel={resetEdit}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Attendance;
