import { useEffect, useState } from "react";
import Summary from "./Summary";
import supabase from "../services/supabase";
import { teamsSummary } from "../utils/options";

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
      let query = supabase
        .from("workers")
        .select("*", { count: "exact", head: true });
      if (teamName !== "All") {
        query = query.eq("department", teamName);
      }
      const { count: total } = await query;
      setTotalWorkers(total || 0);

      let presentQuery = supabase
        .from("workers")
        .select("*", { count: "exact", head: true })
        .eq("ispresent", true);
      if (teamName !== "All") {
        presentQuery = presentQuery.eq("department", teamName);
      }
      const { count: present } = await presentQuery;
      setPresentWorkers(present || 0);
      setAbsentWorkers((total || 0) - (present || 0));

      let confirmedQuery = supabase
        .from("workers")
        .select("*", { count: "exact", head: true })
        .eq("isconfirmed", true);
      if (teamName !== "All") {
        confirmedQuery = confirmedQuery.eq("department", teamName);
      }
      const { count: confirmed } = await confirmedQuery;
      setTotalConfirmed(confirmed || 0);

      let confirmedPresQuery = supabase
        .from("workers")
        .select("*", { count: "exact", head: true })
        .eq("isconfirmed", true)
        .eq("ispresent", true);
      if (teamName !== "All") {
        confirmedPresQuery = confirmedPresQuery.eq("department", teamName);
      }
      const { count: confirmedPres } = await confirmedPresQuery;
      setConfirmedPresent(confirmedPres || 0);

      setConfirmedAbsent((confirmed || 0) - (confirmedPres || 0));
    };

    fetchData();
  }, [teamName]);

  const onChange = (val: string) => {
    setActiveTeam(val);
  };
  const onChangeDepartment = (val: string) => {
    setTeamName(val);
  };

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
        onChange={onChange}
        type="department"
        onChangeDepartment={onChangeDepartment}
        activeTeam={activeTeam}
      />
    </div>
  );
};

export default DashboardPageByDepartment;
