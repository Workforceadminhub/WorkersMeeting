import { useEffect, useState } from "react";
import Summary from "./Summary";
import supabase from "../services/supabase";
import { teamsSummary } from "../utils/options";

const countWorkers = async (filters: {
  ispresent?: boolean;
  isconfirmed?: boolean;
  department?: string;
}): Promise<number> => {
  let q = supabase.from("workers").select("*", { count: "exact", head: true });
  if (filters.ispresent !== undefined) q = q.eq("ispresent", filters.ispresent);
  if (filters.isconfirmed !== undefined) q = q.eq("isconfirmed", filters.isconfirmed);
  if (filters.department && filters.department !== "All") q = q.eq("department", filters.department);
  const { count } = await q;
  return count || 0;
};

const DashboardPageByDepartment = () => {
  const [totalWorkers, setTotalWorkers] = useState(0);
  const [presentWorkers, setPresentWorkers] = useState(0);
  const [absentWorkers, setAbsentWorkers] = useState(0);
  const [confirmedPresent, setConfirmedPresent] = useState(0);
  const [confirmedAbsent, setConfirmedAbsent] = useState(0);
  const [totalConfirmed, setTotalConfirmed] = useState(0);
  const [teamName, setTeamName] = useState("All");
  const [activeTeam, setActiveTeam] = useState("All");

  useEffect(() => {
    const fetchData = async () => {
      const dept = teamName !== "All" ? teamName : undefined;

      const [total, present, confirmed, confirmedPres] = await Promise.all([
        countWorkers({ department: dept }),
        countWorkers({ ispresent: true, department: dept }),
        countWorkers({ isconfirmed: true, department: dept }),
        countWorkers({ isconfirmed: true, ispresent: true, department: dept }),
      ]);

      setTotalWorkers(total);
      setPresentWorkers(present);
      setAbsentWorkers(total - present);
      setTotalConfirmed(confirmed);
      setConfirmedPresent(confirmedPres);
      setConfirmedAbsent(confirmed - confirmedPres);
    };

    fetchData();
  }, [teamName]);

  return (
    <div>
      <Summary
        absentWorkers={absentWorkers}
        confirmedAbsent={confirmedAbsent}
        confirmedPresent={confirmedPresent}
        totalWorkers={totalWorkers}
        presentWorkers={presentWorkers}
        totalConfirmed={totalConfirmed}
        teams={teamsSummary}
        team={teamName}
        onChange={setActiveTeam}
        type="department"
        onChangeDepartment={setTeamName}
        activeTeam={activeTeam}
      />
    </div>
  );
};

export default DashboardPageByDepartment;
