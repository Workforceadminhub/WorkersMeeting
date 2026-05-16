import { useEffect, useState } from "react";
import Summary from "./Summary";
import { countWorkers } from "../services/stats";
import { teamsSummary } from "../utils/options";

const DashboardPageByDepartment = () => {
  const [totalWorkers, setTotalWorkers] = useState(0);
  const [presentWorkers, setPresentWorkers] = useState(0);
  const [absentWorkers, setAbsentWorkers] = useState(0);
  const [teamName, setTeamName] = useState("All");
  const [activeTeam, setActiveTeam] = useState("All");

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      const dept = teamName !== "All" ? teamName : undefined;
      const [total, present] = await Promise.all([
        countWorkers({ department: dept }),
        countWorkers({ ispresent: true, department: dept }),
      ]);
      setTotalWorkers(total);
      setPresentWorkers(present);
      setAbsentWorkers(total - present);
    };

    void fetchData();
  }, [teamName]);

  return (
    <div>
      <Summary
        totalWorkers={totalWorkers}
        presentWorkers={presentWorkers}
        absentWorkers={absentWorkers}
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
