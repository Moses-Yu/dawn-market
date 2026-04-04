/** Calculate the most recent completed week (Mon-Sun) */
export function getLastWeekRange(): { start: string; end: string } {
  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" })
  );
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ...
  const lastSunday = new Date(now);
  lastSunday.setDate(now.getDate() - dayOfWeek);
  const lastMonday = new Date(lastSunday);
  lastMonday.setDate(lastSunday.getDate() - 6);

  return {
    start: toDateString(lastMonday),
    end: toDateString(lastSunday),
  };
}

/** Calculate the previous complete month */
export function getLastMonthRange(): { start: string; end: string } {
  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" })
  );
  const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const month = now.getMonth() === 0 ? 12 : now.getMonth();
  const lastDay = new Date(year, month, 0).getDate();

  return {
    start: `${year}-${String(month).padStart(2, "0")}-01`,
    end: `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`,
  };
}

function toDateString(d: Date): string {
  return d.toISOString().split("T")[0];
}
