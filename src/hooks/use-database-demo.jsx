import { normalizeRanges } from "../../public/impact-core.mjs";
import { useCallback, useEffect, useRef, useState } from "react";
const legacyKey = "commonwork-react-demo-1";
export function useDatabaseDemo() {
  const [state, setState] = useState(null),
    [source, setSource] = useState(null),
    [loadError, setLoadError] = useState(""),
    [saveError, setSaveError] = useState(""),
    [saveStatus, setSaveStatus] = useState("loading"),
    [storage, setStorage] = useState("database");
  const revision = useRef(0),
    saved = useRef(""),
    pending = useRef(null),
    saving = useRef(false),
    latest = useRef(null),
    ready = useRef(false);
  const flush = useCallback(async () => {
    if (saving.current || !pending.current) return;
    saving.current = true;
    setSaveStatus("saving");
    setSaveError("");
    try {
      while (pending.current) {
        const snapshot = pending.current;
        pending.current = null;
        const response = await fetch("/api/demo/state", {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ state: snapshot, revision: revision.current }),
        });
        const result = await response.json();
        if (!response.ok)
          throw Error(result.error || "Could not save to the database.");
        revision.current = result.revision;
        saved.current = JSON.stringify(snapshot);
        try {
          sessionStorage.removeItem(legacyKey);
        } catch {}
      }
      setSaveStatus("saved");
    } catch (error) {
      pending.current = latest.current;
      setSaveStatus("error");
      setSaveError(error.message);
    } finally {
      saving.current = false;
    }
  }, []);
  useEffect(() => {
    let current = true;
    Promise.all([fetch("/api/demo"), fetch("/api/demo/state")])
      .then(async (responses) => {
        if (responses.some((r) => !r.ok))
          throw Error("Could not load the database demo.");
        return Promise.all(responses.map((r) => r.json()));
      })
      .then(([data, stored]) => {
        if (!current) return;
        setSource(data);
        setStorage(stored.storage);
        revision.current = stored.revision;
        saved.current = JSON.stringify(stored.state);
        let initial = stored.state;
        if (stored.revision === 0) {
          try {
            const old = JSON.parse(sessionStorage.getItem(legacyKey));
            if (
              old?.version === 1 &&
              Array.isArray(old.records) &&
              Array.isArray(old.published) &&
              Array.isArray(old.organizations) &&
              Array.isArray(old.fields?.fields)
            ) {
              initial = old;
              initial.records = initial.records.map((row) => {
                const sample = data.records.find(
                  (r) =>
                    r.id === row.id &&
                    r.program === row.program &&
                    r.organization === row.organization &&
                    r.start_date === row.start_date,
                );
                return sample?.schedule &&
                  row.origin === "demo" &&
                  !row.schedule
                  ? { ...row, schedule: sample.schedule }
                  : row;
              });
            }
          } catch {}
        }
        initial = {
          ...initial,
          records: initial.records.map(normalizeRanges),
          published: initial.published.map(normalizeRanges),
          ...(initial.deletedOrganizations
            ? {
                deletedOrganizations: initial.deletedOrganizations.map(
                  (saved) => ({
                    ...saved,
                    records: saved.records.map(normalizeRanges),
                    published: saved.published.map(normalizeRanges),
                  }),
                ),
              }
            : {}),
        };
        latest.current = initial;
        ready.current = true;
        setState(initial);
        setSaveStatus("saved");
      })
      .catch((error) => {
        if (current) setLoadError(error.message);
      });
    return () => {
      current = false;
    };
  }, []);
  useEffect(() => {
    if (!ready.current || !state) return;
    latest.current = state;
    if (JSON.stringify(state) === saved.current) return;
    setSaveStatus("saving");
    pending.current = state;
    const timer = setTimeout(() => {
      flush();
    }, 200);
    return () => clearTimeout(timer);
  }, [state, flush]);
  const retry = () => {
    pending.current = latest.current;
    flush();
  };
  return {
    state,
    setState,
    source,
    loadError,
    saveStatus,
    saveError,
    retry,
    storage,
  };
}
