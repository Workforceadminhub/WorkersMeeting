import Select from "./Dropdown";
import { useNavigate } from "react-router-dom";
import { departmentsWithTeams } from "../utils/options";
import type { SelectOption } from "../types";

type SummaryProps = {
  totalWorkers: number;
  presentWorkers: number;
  absentWorkers: number;
  teams: SelectOption[];
  onChange: (value: string) => void;
  team: string;
  title?: string;
  type?: string;
  onChangeDepartment?: (value: string) => void;
  activeTeam?: string;
};

const StatCard = ({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) => (
  <div
    className="rounded-xl p-4 text-center"
    style={{ background: color }}
  >
    <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--text-secondary)" }}>
      {label}
    </p>
    <p className="text-3xl font-bold font-display" style={{ color: "var(--navy)" }}>
      {value}
    </p>
  </div>
);

const Summary = ({
  totalWorkers,
  presentWorkers,
  absentWorkers,
  teams,
  onChange,
  team,
  title,
  type,
  onChangeDepartment,
  activeTeam,
}: SummaryProps) => {
  const navigate = useNavigate();
  const percentagePresent = totalWorkers
    ? ((presentWorkers / totalWorkers) * 100).toFixed(1)
    : "0.0";

  const getDepartment = (): SelectOption[] => {
    const departments = activeTeam ? departmentsWithTeams[activeTeam] : null;
    return departments
      ? departments.map((department) => ({ label: department, value: department }))
      : [];
  };

  return (
    <div className="min-h-screen px-3 sm:px-4 py-6" style={{ background: "var(--parchment)" }}>
      <div className="w-full max-w-xl mx-auto">

        {/* Nav */}
        <div className="flex items-center justify-between mb-6">
          {type === "department" ? (
            <button
              onClick={() => navigate("/admin/summary")}
              className="btn-ghost"
              style={{ padding: "8px 16px", fontSize: 13 }}
            >
              ← Back
            </button>
          ) : (
            <div />
          )}
          {type !== "department" && (
            <button
              onClick={() => navigate("/admin/department/summary")}
              className="btn-primary"
              style={{ padding: "8px 16px", fontSize: 13 }}
            >
              Department →
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="card p-4 mb-4">
          <Select options={teams} onChange={onChange} className="mb-3" label="Filter by team" />
          {type === "department" && (
            <Select
              options={getDepartment()}
              onChange={onChangeDepartment}
              label="Filter by department"
            />
          )}
        </div>

        {/* Dashboard card */}
        <div className="card p-4 sm:p-6">
          <div className="gold-rule mb-4" />
          <h2 className="font-display text-lg sm:text-xl font-bold text-center mb-1" style={{ color: "var(--navy)" }}>
            Workers Attendance
          </h2>
          <p className="text-center text-xs tracking-widest uppercase mb-5" style={{ color: "var(--gold)" }}>
            {team === "All" ? "All Teams" : team}
          </p>

          <div className="grid grid-cols-2 gap-3">
            <StatCard label={`Total${title ? ` ${title}` : ""}`} value={totalWorkers} color="var(--parchment-dark)" />
            <StatCard label={`Present${title ? ` ${title}` : ""}`} value={presentWorkers} color="#e6f4ed" />
            <StatCard label={`Absent${title ? ` ${title}` : ""}`} value={absentWorkers} color="#fef2f2" />
            <StatCard label="% Present" value={`${percentagePresent}%`} color="#fefce8" />
          </div>
          <div className="gold-rule mt-5" />
        </div>
      </div>
    </div>
  );
};

export default Summary;
