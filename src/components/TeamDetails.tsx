import { useEffect, useMemo, useState } from "react";
import { useLeaderDetails, type LeaderDetail } from "../services/leaderDetails";
import { rowMatcher, type ReportRowFilter } from "../utils/report";
import { formatTime, formatWorkerName } from "../utils/formatting";

type TeamChoice = { label: string; filter: ReportRowFilter };

export type ScopeStats = {
  strength: number;
  confirmed: number;
  present: number;
  absent: number;
};

type Scope =
  | { kind: "row"; label: string; filter: ReportRowFilter; context?: string }
  | {
      kind: "directorate";
      label: string;
      filters: ReportRowFilter[];
      teams: TeamChoice[];
    };

type SortKey =
  | "name"
  | "phone"
  | "department"
  | "role"
  | "gender"
  | "confirmed"
  | "present"
  | "markedat";

type SortDir = "asc" | "desc";

const SORT_COLUMNS: Array<{
  key: SortKey;
  label: string;
  align: "left" | "center";
}> = [
  { key: "name", label: "Name", align: "left" },
  { key: "phone", label: "Phone", align: "left" },
  { key: "department", label: "Department", align: "left" },
  { key: "role", label: "Role", align: "left" },
  { key: "gender", label: "Gender", align: "left" },
  { key: "confirmed", label: "Confirmed", align: "center" },
  { key: "present", label: "Present", align: "center" },
  { key: "markedat", label: "Marked at", align: "left" },
];

const getSortValue = (r: LeaderDetail, key: SortKey): string | number => {
  switch (key) {
    case "name":
      return formatWorkerName(r.last_name, r.first_name).toLowerCase();
    case "phone":
      return (r.phone_number || "").toLowerCase();
    case "department":
      return (r.department || "").toLowerCase();
    case "role":
      return (r.role || "").toLowerCase();
    case "gender":
      return (r.gender || "").toLowerCase();
    case "confirmed":
      return r.isconfirmed ? 1 : 0;
    case "present":
      return r.ispresent ? 1 : 0;
    case "markedat":
      return r.updatedat ? new Date(r.updatedat).getTime() : 0;
  }
};

const compare = (a: string | number, b: string | number): number => {
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b));
};

const SortArrow = ({
  active,
  dir,
}: {
  active: boolean;
  dir: SortDir;
}) => {
  if (!active) {
    return (
      <span aria-hidden="true" className="ml-1 text-gray-400">
        ⇅
      </span>
    );
  }
  return (
    <span aria-hidden="true" className="ml-1 text-gray-800">
      {dir === "asc" ? "▲" : "▼"}
    </span>
  );
};

const TeamDetails = ({
  scope,
  stats,
  onClose,
}: {
  scope: Scope;
  /**
   * Aggregate numbers from the admin report (strength/present/absent/
   * confirmed). When provided, the chip counts at the top mirror the
   * report screen instead of recounting the raw DB rows. Falls back
   * to local counts if omitted.
   */
  stats?: ScopeStats;
  onClose: () => void;
}) => {
  const filters = scope.kind === "row" ? [scope.filter] : scope.filters;
  const { data, isLoading, isError, error } = useLeaderDetails(filters);

  const isDirectorate = scope.kind === "directorate";
  const teamChoices = isDirectorate ? scope.teams : [];

  const [teamLabel, setTeamLabel] = useState<string>("");
  const [department, setDepartment] = useState<string>("");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const activeTeamFilter = useMemo(() => {
    if (!teamLabel) return null;
    const match = teamChoices.find((t) => t.label === teamLabel);
    return match ? rowMatcher(match.filter) : null;
  }, [teamLabel, teamChoices]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const teamNarrowed = useMemo(() => {
    if (!data) return [] as LeaderDetail[];
    if (!activeTeamFilter) return data;
    return data.filter(activeTeamFilter);
  }, [data, activeTeamFilter]);

  const departmentOptions = useMemo(() => {
    if (!teamNarrowed) return [] as string[];
    const set = new Set<string>();
    for (const r of teamNarrowed) {
      if (r.department) set.add(r.department);
    }
    return Array.from(set).sort();
  }, [teamNarrowed]);

  // If the currently-picked department disappears after a team change,
  // reset it so we don't silently filter everything out.
  useEffect(() => {
    if (department && !departmentOptions.includes(department)) {
      setDepartment("");
    }
  }, [department, departmentOptions]);

  const filtered = useMemo(() => {
    const rows = teamNarrowed.filter((r) => {
      // Only show workers who are marked present.
      if (r.ispresent !== true) return false;
      if (department && r.department !== department) return false;
      if (search) {
        const needle = search.toLowerCase();
        const hay = `${r.first_name || ""} ${r.last_name || ""} ${r.phone_number || ""}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
    const dirMultiplier = sortDir === "asc" ? 1 : -1;
    return [...rows].sort(
      (a, b) =>
        compare(getSortValue(a, sortKey), getSortValue(b, sortKey)) *
        dirMultiplier
    );
  }, [teamNarrowed, department, search, sortKey, sortDir]);

  const counts = useMemo(() => {
    if (stats) {
      return {
        total: stats.strength,
        present: stats.present,
        absent: stats.absent,
        confirmed: stats.confirmed,
      };
    }
    if (!data) return { total: 0, present: 0, absent: 0, confirmed: 0 };
    let present = 0;
    let confirmed = 0;
    for (const r of data) {
      if (r.ispresent === true) present++;
      if (r.isconfirmed === true) confirmed++;
    }
    return {
      total: data.length,
      present,
      absent: data.length - present,
      confirmed,
    };
  }, [data, stats]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <button
            onClick={onClose}
            className="text-sm text-blue-600 hover:underline"
          >
            ← Back to report
          </button>
          <h2 className="mt-1 text-xl font-bold text-gray-900">
            {scope.label}
          </h2>
          {scope.kind === "row" && scope.context && (
            <p className="text-sm text-gray-600">{scope.context}</p>
          )}
        </div>

        <div className="flex gap-2 text-xs">
          <div className="rounded bg-amber-100 px-2 py-1 font-semibold">
            Total {counts.total}
          </div>
          <div className="rounded bg-green-100 px-2 py-1 font-semibold">
            Present {counts.present}
          </div>
          <div className="rounded bg-red-100 px-2 py-1 font-semibold">
            Absent {counts.absent}
          </div>
          <div className="rounded bg-blue-100 px-2 py-1 font-semibold">
            Confirmed {counts.confirmed}
          </div>
        </div>
      </div>

      <div
        className={`grid gap-3 mb-4 ${
          isDirectorate ? "md:grid-cols-3" : "md:grid-cols-2"
        }`}
      >
        {isDirectorate && (
          <div>
            <label className="block text-xs text-gray-600 mb-1">Team</label>
            <select
              value={teamLabel}
              onChange={(e) => setTeamLabel(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none"
            >
              <option value="">All teams</option>
              {teamChoices.map((t) => (
                <option key={t.label} value={t.label}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="block text-xs text-gray-600 mb-1">Department</label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none"
          >
            <option value="">All departments</option>
            {departmentOptions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">Search</label>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name or phone"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg shadow ring-1 ring-gray-200 bg-white">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-amber-50">
            <tr>
              {SORT_COLUMNS.map((col) => {
                const isActive = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    aria-sort={
                      isActive
                        ? sortDir === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                    className={`border border-gray-300 px-3 py-2 select-none ${
                      col.align === "center" ? "text-center" : "text-left"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key)}
                      className={`inline-flex items-center ${
                        col.align === "center" ? "justify-center" : ""
                      } w-full font-semibold text-gray-800 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded`}
                    >
                      {col.label}
                      <SortArrow active={isActive} dir={sortDir} />
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={SORT_COLUMNS.length}
                  className="border border-gray-300 px-3 py-4 text-center text-gray-500"
                >
                  Loading…
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td
                  colSpan={SORT_COLUMNS.length}
                  className="border border-gray-300 px-3 py-4 text-center text-red-600"
                >
                  Could not load workers
                  {error instanceof Error ? `: ${error.message}` : ""}
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={SORT_COLUMNS.length}
                  className="border border-gray-300 px-3 py-4 text-center text-gray-500"
                >
                  No workers match the filters
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={String(r.id)} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-3 py-2 font-medium text-gray-900">
                    {r.first_name} {r.last_name}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-gray-700">
                    {r.phone_number || "—"}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-gray-700">
                    {r.department || "—"}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-gray-700">
                    {r.role || "—"}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-gray-700">
                    {r.gender || "—"}
                  </td>
                  <td
                    className={`border border-gray-300 px-3 py-2 text-center ${
                      r.isconfirmed ? "bg-blue-100" : "text-gray-400"
                    }`}
                  >
                    {r.isconfirmed ? "✓" : "—"}
                  </td>
                  <td
                    className={`border border-gray-300 px-3 py-2 text-center ${
                      r.ispresent ? "bg-green-100" : "bg-red-50 text-gray-500"
                    }`}
                  >
                    {r.ispresent ? "✓" : "—"}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-gray-500">
                    {r.ispresent ? formatTime(r.updatedat) : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-gray-500">
        Showing {filtered.length} present workers
        {data && data.length > filtered.length
          ? ` (${data.length - counts.present + (counts.present - filtered.length)} hidden by filters, ${counts.absent} absent not shown)`
          : ""}
        . Tap any column header to sort; tap again to reverse.
      </p>
    </div>
  );
};

export default TeamDetails;
