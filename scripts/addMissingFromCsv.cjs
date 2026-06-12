// Compare a Super Admin workers CSV export against the event table
// and insert anyone missing. Usage:
//   node --env-file=.env scripts/addMissingFromCsv.cjs <csv-path> [--apply]
const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");

const TABLE = "gclc26day1";
const csvPath = process.argv[2];
const apply = process.argv.includes("--apply");

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_KEY
);

const clean = (v) => {
  const s = (v ?? "").trim();
  return !s || s === "N/A" ? null : s;
};
const cleanName = (v) => {
  const s = clean(v);
  return s ? s.replace(/\s+/g, " ") : s;
};
const normPhone = (v) => {
  const digits = (v ?? "").replace(/\D/g, "");
  return digits ? digits.replace(/^0+/, "") : null;
};
const normName = (first, last) =>
  `${(first || "").trim().toLowerCase()}|${(last || "").trim().toLowerCase()}`;

// Minimal RFC 4180 CSV parser (handles quoted fields with commas/newlines).
const parseCsv = (text) => {
  const records = [];
  let field = "";
  let record = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      record.push(field); field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      record.push(field); field = "";
      records.push(record); record = [];
    } else field += ch;
  }
  if (field !== "" || record.length) { record.push(field); records.push(record); }
  const header = records.shift();
  return records
    .filter((r) => r.length > 1 || (r.length === 1 && r[0] !== ""))
    .map((r) => Object.fromEntries(header.map((h, idx) => [h, r[idx] ?? ""])));
};

const readCsv = async (filePath) => parseCsv(fs.readFileSync(filePath, "utf8"));

(async () => {
  const existing = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from(TABLE)
      .select("worker_id, first_name, last_name, phone_number")
      .range(from, from + 999);
    if (error) throw new Error(error.message);
    if (!data.length) break;
    existing.push(...data);
    if (data.length < 1000) break;
  }

  const byId = new Set(existing.map((r) => r.worker_id).filter(Boolean));
  const byPhone = new Set(
    existing.map((r) => normPhone(r.phone_number)).filter(Boolean)
  );
  const byName = new Set(
    existing.map((r) => normName(r.first_name, r.last_name))
  );

  const csvRows = await readCsv(csvPath);
  const missing = [];
  for (const row of csvRows) {
    const id = clean(row["Worker ID"]);
    const phone = normPhone(row["Phone Number"]);
    const name = normName(row["First Name"], row["Last Name"]);
    if (id && byId.has(id)) continue;
    if (phone && byPhone.has(phone)) continue;
    if (byName.has(name)) continue;
    missing.push(row);
  }

  console.log(`table rows: ${existing.length}, csv rows: ${csvRows.length}, missing: ${missing.length}`);
  for (const row of missing) {
    console.log(
      ` - ${row["Worker ID"]} | ${row["First Name"]} ${row["Last Name"]} | ${row["Phone Number"]} | ${row["Team"]} / ${row["Department"]} / ${row["Role"]}`
    );
  }

  if (!apply) {
    console.log("\nDry run only — re-run with --apply to insert.");
    return;
  }

  const inserts = missing.map((row) => {
    const first = cleanName(row["First Name"]);
    const last = cleanName(row["Last Name"]);
    return {
      worker_id: clean(row["Worker ID"]),
      first_name: first,
      last_name: last,
      other_name: cleanName(row["Other Name"]),
      fullname: [first, last].filter(Boolean).join(" ") || null,
      fullnamereverse: [last, first].filter(Boolean).join(" ") || null,
      email: clean(row["Email"]),
      phone_number: clean(row["Phone Number"]),
      team: clean(row["Team"]),
      department: clean(row["Department"]),
      role: clean(row["Role"]),
      employment: clean(row["Employment Status"]),
      marital_status: clean(row["Marital Status"]),
      birthdate: clean(row["Birthdate"]),
      age_range: clean(row["Age Range"]),
      gender: clean(row["Gender"]),
      address: clean(row["Address"]),
      ispresent: false,
      isconfirmed: false,
    };
  });

  for (let i = 0; i < inserts.length; i += 500) {
    const { error } = await supabase.from(TABLE).insert(inserts.slice(i, i + 500));
    if (error) throw new Error(`insert failed at batch ${i}: ${error.message}`);
  }
  const { count } = await supabase
    .from(TABLE)
    .select("*", { count: "exact", head: true });
  console.log(`\nInserted ${inserts.length}. New table count: ${count}`);
})();
