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
  const [editInitialValues, setEditInitialValues] = useState<Worker | null>(
    null
  );
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const confirmationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryClient = useQueryClient();

  const { title } = useMeetingTitle();

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
    confirmationTimer.current = setTimeout(() => {
      setConfirmation(null);
    }, CONFIRMATION_TIMEOUT_MS);
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
    date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });

  return (
    <div className="min-h-screen flex flex-col md:items-center bg-gray-50 p-4">
      <div className="w-full max-w-xl">
        <header className="text-center mb-4 mt-1">
          <img
            src="/logo.jpg"
            alt="Harvesters International Christian Center Logo"
            className="w-32 h-32 mx-auto"
          />
          <h2 className="text-2xl font-bold text-gray-700 mt-4 whitespace-pre-line">
            {title}
          </h2>
        </header>

        <div className="bg-white shadow-lg rounded-xl p-6 mb-24 mt-12">
          {confirmation ? (
            <div
              role="status"
              aria-live="polite"
              className="flex flex-col items-center text-center py-6"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckBadgeIcon className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="mt-4 text-xl font-bold text-gray-900">
                Marked present
              </h2>
              <p className="mt-2 text-lg text-gray-800">{confirmation.name}</p>
              <p className="text-sm text-gray-600">
                {confirmation.team}
                {confirmation.department && ` · ${confirmation.department}`}
              </p>
              {confirmation.role && (
                <p className="text-sm text-gray-500">{confirmation.role}</p>
              )}
              <p className="mt-2 text-xs text-gray-500">
                {formatTime(confirmation.timestamp)}
              </p>
              <button
                onClick={dismissConfirmation}
                className="mt-6 w-full max-w-xs rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                Mark next person
              </button>
            </div>
          ) : (
            <>
              {!isEditing && !isCreating && (
                <input
                  type="search"
                  inputMode="search"
                  aria-label="Search by name or phone number"
                  placeholder="Search by name or phone number"
                  className="w-full mb-4 p-2 h-14 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  value={query}
                  onChange={handleSearch}
                />
              )}

              {!isCreating &&
              !isEditing &&
              searchValue &&
              filteredPeople &&
              filteredPeople.length > 0 ? (
                <div>
                  <ul className="space-y-2">
                    {filteredPeople.map((person, index) => (
                      <li
                        key={index}
                        className="p-4 border border-gray-200 rounded-lg flex justify-between items-center"
                      >
                        <div className="flex flex-col">
                          <span className="text-gray-900">
                            {person.first_name} {person.last_name}
                          </span>
                          {person.role && (
                            <span className="text-gray-600 text-sm">
                              {person.role}
                            </span>
                          )}
                          {person.team ? (
                            <span className="text-gray-500 text-sm">
                              {person.team}
                              {person.department && ` - ${person.department}`}
                            </span>
                          ) : (
                            <span className="text-gray-500 text-sm">
                              {person.team || person.department}
                            </span>
                          )}
                        </div>
                        {person.ispresent ? (
                          <button
                            disabled
                            aria-disabled="true"
                            className="px-2 py-2 text-sm bg-green-500 text-white rounded-lg flex justify-between cursor-not-allowed"
                          >
                            <CheckBadgeIcon className="text-white size-5" />
                            <span className="ml-3">Present</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleEdit(person)}
                            className="px-8 py-2 text-sm bg-blue-500 text-white cursor-pointer rounded-lg flex hover:bg-blue-600 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                          >
                            Open
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                  <div className="items-center text-center">
                    <div className="mt-6 text-gray-700">OR</div>
                    <button
                      onClick={handleCreate}
                      className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    >
                      Manually add attendance
                    </button>
                  </div>
                </div>
              ) : (
                !isCreating &&
                !isEditing && (
                  <div className="text-center my-4">
                    {isLoading && searchValue ? (
                      <p className="text-gray-700">Searching...</p>
                    ) : !isLoading && searchValue ? (
                      <div>
                        <p className="text-gray-700">No results</p>
                        <button
                          onClick={handleCreate}
                          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                        >
                          Manually add attendance
                        </button>
                      </div>
                    ) : null}
                  </div>
                )
              )}

              {isCreating && (
                <div className="mt-4">
                  <h2 className="text-xl font-bold mb-4 text-center text-gray-800">
                    Manually add attendance
                  </h2>
                  <WorkerForm
                    mode="create"
                    initialValues={null}
                    isSubmitting={isCreatingSubmitting}
                    submitLabel="Save"
                    onSubmit={handleSave}
                    onCancel={resetCreate}
                  />
                </div>
              )}

              {isEditing && (
                <div className="mt-1">
                  <h2 className="text-xl font-bold mb-4 text-center text-gray-800">
                    Update worker info
                  </h2>
                  <WorkerForm
                    mode="edit"
                    initialValues={editInitialValues}
                    isSubmitting={isEditingSubmitting}
                    submitLabel="Mark Attendance"
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
