const WAT = "Africa/Lagos";

export const formatWorkerName = (
  firstName: string | null | undefined,
  lastName: string | null | undefined
): string => `${firstName || ""} ${lastName || ""}`.trim();

export const formatTime = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-NG", {
      timeZone: WAT,
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return iso;
  }
};

export const formatConfirmationTime = (date: Date): string =>
  date.toLocaleTimeString("en-NG", {
    timeZone: WAT,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

export const formatPercent = (value: number, decimals = 2): string =>
  `${value.toFixed(decimals)}%`;

export const nowISO = (): string => new Date().toISOString();
