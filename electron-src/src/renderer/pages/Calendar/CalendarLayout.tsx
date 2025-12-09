import React, { useEffect, useMemo, useState } from "react";
import Header from "@/renderer/components/Header";
import { Endpoints } from "@/utils/endpoints";
import CalendarGrid from "./components/CalendarGrid";
import WorkspaceList from "./components/WorkspaceList";
import UpcomingMeetings from "./components/UpcomingMeetings";

const CalendarLayout: React.FC = () => {
  const [view, setView] = useState<"month" | "week">("month");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [enabledWorkspaceIds, setEnabledWorkspaceIds] = useState<string[]>([]);
  const [rawMeetings, setRawMeetings] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem("bridge_token");
      try {
        const workspacesUrl = Endpoints.WORKSPACES_USER || "http://localhost:3000/api/workspaces/user";
        const workspaceBase = Endpoints.WORKSPACE || "http://localhost:3000/api/workspace";
        const res = await fetch(workspacesUrl, {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) throw new Error("no-workspaces");
        const json = await res.json();
        const ws = json.workspaces || [];
        // Predefined palette for workspace colors (unique assignment)
        const PALETTE = [
          '#3b82f6',
          '#f97316', 
          '#06b6d4',
          '#ef4444',
          '#14b8a6',
          '#eab308', 
          '#22c55e', 
          '#fb7185',
          '#0ea5e9',
          '#ec4899',
          '#6366f1', 
          '#facc15', 
          '#84cc16',
          '#d946ef', 
          '#8b5cf6', 
        ];


        // deterministic fallback color generator
        const stringToColor = (str: string, hueOffset = 0) => {
          let hash = 0;
          for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
            hash = hash & hash;
          }
          const baseHue = Math.abs(hash) % 360;
          const h = (baseHue + hueOffset) % 360;
          const s = 60 + (Math.abs(hash) % 20);
          const l = 50;
          return `hsl(${h} ${s}% ${l}%)`;
        };

        // normalize ids to string for safety and ensure colors (unique via palette)
        const used = new Set<string>();
        let paletteIndex = 0;
        const normalizeKey = (c: string) => c.toString().trim().toLowerCase();
        const normalized = ws.map((w: any) => {
          const id = String(w.id || w.workspace_id || w.workspaceId);
          let color = w.color || null;
          if (color) {
            // if backend provided a color, prefer it (but avoid duplicates)
            const key = normalizeKey(color);
            if (used.has(key)) {
              color = null; // force picking from palette
            } else {
              used.add(key);
            }
          }

          if (!color) {
            // find next unused palette color
            let attempts = 0;
            while (attempts < PALETTE.length) {
              const candidate = PALETTE[paletteIndex % PALETTE.length];
              paletteIndex += 1;
              attempts += 1;
              const key = normalizeKey(candidate);
              if (!used.has(key)) {
                color = candidate;
                used.add(key);
                break;
              }
            }
            // if palette exhausted or all used, fallback to deterministic color
            if (!color) {
              color = stringToColor(id, paletteIndex * 37);
              used.add(normalizeKey(color));
            }
          }

          return { id, name: w.name, color };
        });
        console.log('[Calendar] fetched workspaces:', normalized.map((x:any)=>({id:x.id,name:x.name,color:x.color})));
        setWorkspaces(normalized);
        setEnabledWorkspaceIds(normalized.map((w: any) => String(w.id)));

        // For each workspace, fetch rooms and collect meetings
        let allMeetings: any[] = [];
        for (const w of normalized) {
          try {
            const r = await fetch(`${workspaceBase}/${w.id}/rooms`, { headers: { Authorization: token ? `Bearer ${token}` : undefined } });
            if (!r.ok) continue;
            const jr = await r.json();
            const rooms = jr.rooms || jr;
            console.log(`[Calendar] workspace ${w.id} fetched rooms count:`, Array.isArray(rooms) ? rooms.length : 0);
            for (const room of rooms) {
              // room.meetings may be stored as JSONB (array) or string -- normalize
              let roomMeetings: any[] = [];
              try {
                if (Array.isArray(room.meetings)) {
                  roomMeetings = room.meetings;
                } else if (typeof room.meetings === 'string' && room.meetings.trim()) {
                  roomMeetings = JSON.parse(room.meetings);
                } else if (room.meetings) {
                  // maybe object
                  roomMeetings = room.meetings;
                }
              } catch (e) {
                console.warn('[Calendar] failed to parse room.meetings for room', room.room_id || room.id, e);
                roomMeetings = [];
              }
              console.log(`[Calendar] workspace ${w.id} room ${room.room_id || room.id} meetings:`, Array.isArray(roomMeetings) ? roomMeetings.length : 0);
              for (const m of (roomMeetings || [])) {
                // attach workspaceId for filtering
                allMeetings.push({ ...m, workspaceId: w.id });
              }
            }
          } catch (e) {
            // ignore per-workspace errors
          }
        }

        console.log('[Calendar] total raw meetings collected:', allMeetings.length);
        setRawMeetings(allMeetings);
        return;
      } catch (err) {
        // On error, clear data (no fake/mock data)
        setWorkspaces([]);
        setEnabledWorkspaceIds([]);
        setRawMeetings([]);
        setMeetings([]);
      }
    })();
  }, []);

  // compute visible range based on view and currentDate
  const computeRange = (view: string, currentDate: Date) => {
    const start = new Date();
    const end = new Date();
    if (view === "week") {
      // start at Monday
      const day = (currentDate.getDay() + 6) % 7;
      start.setTime(new Date(currentDate).setDate(currentDate.getDate() - day));
      start.setHours(0, 0, 0, 0);
      end.setTime(start.getTime());
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else {
      // month: show weeks containing month
      const sm = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const day = (sm.getDay() + 6) % 7;
      const gridStart = new Date(sm);
      gridStart.setDate(sm.getDate() - day);
      gridStart.setHours(0, 0, 0, 0);
      const lm = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      const gridEnd = new Date(lm);
      // advance to end of week
      const endDay = (gridEnd.getDay() + 6) % 7;
      gridEnd.setDate(gridEnd.getDate() + (6 - endDay));
      gridEnd.setHours(23, 59, 59, 999);
      start.setTime(gridStart.getTime());
      end.setTime(gridEnd.getTime());
    }
    return { start, end };
  };

  // expand recurring meetings into occurrences that fall within visible range
  useEffect(() => {
    const { start, end } = computeRange(view, currentDate);

    console.log('[Calendar] expanding recurrences for range', start.toISOString(), '->', end.toISOString(), 'rawMeetings:', rawMeetings.length);
    const expanded: any[] = [];
    for (const m of rawMeetings) {
      try {
        // Handle stored meeting shapes. If meeting has `date` + `time` + `frequency` + `daysOfWeek`, expand accordingly.
        if (m && m.date && m.time) {
          // parse time
          const [hhStr, mmStr] = (m.time || '').split(':');
          const hh = Number(hhStr || 0);
          const mm = Number(mmStr || 0);
          const durationMs = (m.durationMinutes ? Number(m.durationMinutes) * 60 * 1000 : 60 * 60 * 1000);
          const freq = (m.frequency || '').toString().toLowerCase();
          // map weekday strings to JS getDay numbers (Sun=0..Sat=6), support Mon,Tue.. or full names
          const weekdayMap: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
          const daysSet = Array.isArray(m.daysOfWeek) ? m.daysOfWeek.map((d: string) => (weekdayMap[d.slice(0,3).toLowerCase()] ?? -1)).filter((n: number) => n >= 0) : [];
          console.log('[Calendar] expanding stored-shape meeting', { workspaceId: m.workspaceId, date: m.date, time: m.time, frequency: m.frequency, daysOfWeek: m.daysOfWeek });

          if (freq.includes('week') && daysSet.length > 0) {
            // iterate each day in visible range and create occurrences on matching weekdays
            const cursor = new Date(start);
            cursor.setHours(0,0,0,0);
            for (let dt = new Date(cursor); dt <= end; dt.setDate(dt.getDate() + 1)) {
              if (daysSet.includes(dt.getDay())) {
                const s = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), hh, mm, 0, 0);
                const e = new Date(s.getTime() + durationMs);
                // ensure occurrence isn't before the original date (if provided)
                const origDate = new Date(m.date + 'T' + (m.time || '00:00'));
                if (s >= start && e <= end && s >= origDate) {
                  expanded.push({ ...m, start: s.toISOString(), end: e.toISOString(), workspaceId: String(m.workspaceId) });
                }
              }
            }
            continue;
          }

          if (freq.includes('day')) {
            const cursor = new Date(start);
            cursor.setHours(hh, mm, 0, 0);
            for (let dt = new Date(cursor); dt <= end; dt.setDate(dt.getDate() + 1)) {
              const s = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), hh, mm, 0, 0);
              const e = new Date(s.getTime() + durationMs);
              const origDate = new Date(m.date + 'T' + (m.time || '00:00'));
              if (s >= start && e <= end && s >= origDate) {
                expanded.push({ ...m, start: s.toISOString(), end: e.toISOString(), workspaceId: String(m.workspaceId) });
              }
            }
            continue;
          }

          // fallback: if single date only
          try {
            const s = new Date(m.date + 'T' + (m.time || '00:00'));
            const e = new Date(s.getTime() + durationMs);
            if (s <= end && e >= start) expanded.push({ ...m, start: s.toISOString(), end: e.toISOString(), workspaceId: String(m.workspaceId) });
          } catch (e) {
            // ignore
          }
          continue;
        }

        // legacy handling: meetings with explicit start/end or recurring/rrule strings
        const origStart = new Date(m.start);
        if (isNaN(origStart.getTime())) {
          // invalid start; skip
          continue;
        }
        const origEnd = m.end ? new Date(m.end) : new Date(origStart.getTime() + 60 * 60 * 1000);
        const duration = origEnd.getTime() - origStart.getTime();
        const freqRaw = (m.recurring || m.rrule || "").toString().toUpperCase();

        const pushIfInRange = (s: Date) => {
          const e = new Date(s.getTime() + duration);
          if (s <= end && e >= start) {
            expanded.push({ ...m, start: s.toISOString(), end: e.toISOString(), workspaceId: String(m.workspaceId) });
          }
        };

        if (!freqRaw) {
          pushIfInRange(origStart);
        } else if (freqRaw.includes('DAILY')) {
          // iterate from the later of origStart or start
          let cursor = new Date(origStart);
          if (cursor < start) cursor = new Date(start);
          // align time-of-day to origStart
          cursor.setHours(origStart.getHours(), origStart.getMinutes(), origStart.getSeconds(), origStart.getMilliseconds());
          while (cursor <= end) {
            pushIfInRange(new Date(cursor));
            cursor.setDate(cursor.getDate() + 1);
          }
        } else if (freqRaw.includes('WEEK') || freqRaw.includes('WEEKLY')) {
          // weekly on same weekday as origStart
          const targetWeekday = origStart.getDay();
          // find first occurrence >= start
          let cursor = new Date(start);
          // set to target weekday in the week containing start
          const diff = (targetWeekday - cursor.getDay() + 7) % 7;
          cursor.setDate(cursor.getDate() + diff);
          cursor.setHours(origStart.getHours(), origStart.getMinutes(), origStart.getSeconds(), origStart.getMilliseconds());
          while (cursor <= end) {
            pushIfInRange(new Date(cursor));
            cursor.setDate(cursor.getDate() + 7);
          }
        } else if (freqRaw.includes('MONTH') || freqRaw.includes('MONTHLY')) {
          // monthly on same day-of-month
          const dayOfMonth = origStart.getDate();
          let cursor = new Date(start.getFullYear(), start.getMonth(), dayOfMonth, origStart.getHours(), origStart.getMinutes(), origStart.getSeconds(), origStart.getMilliseconds());
          // if cursor before start, advance month
          if (cursor < start) cursor.setMonth(cursor.getMonth() + 1);
          while (cursor <= end) {
            // ensure this month has that day
            if (cursor.getDate() === dayOfMonth) pushIfInRange(new Date(cursor));
            cursor.setMonth(cursor.getMonth() + 1);
          }
        } else {
          // unknown recurrence format: attempt weekly by default
          pushIfInRange(origStart);
        }
      } catch (e) {
        // if any error, skip meeting
      }
    }

    console.log('[Calendar] expanded occurrences:', expanded.length);
    if (expanded.length > 0) console.log('[Calendar] sample expanded', expanded.slice(0,5));
    setMeetings(expanded);
  }, [rawMeetings, view, currentDate]);

  const filteredMeetings = useMemo(() => {
    return meetings.filter((m) => enabledWorkspaceIds.includes(String(m.workspaceId)));
  }, [meetings, enabledWorkspaceIds]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
      <Header />

      <div className="max-w-7xl mx-auto mt-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold">December 2025</h1>
            <p className="text-sm text-gray-600">Your personal meeting calendar</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-2 bg-white border rounded-md"
            >
              Today
            </button>
            <div className="flex items-center gap-2 bg-white border px-3 py-2 rounded-md">
              <button
                onClick={() => {
                  if (view === "month") {
                    const d = new Date(currentDate);
                    d.setMonth(d.getMonth() - 1);
                    setCurrentDate(d);
                  } else {
                    const d = new Date(currentDate);
                    d.setDate(d.getDate() - 7);
                    setCurrentDate(d);
                  }
                }}
                className="text-gray-700"
              >
                ‹
              </button>
              <button
                onClick={() => {
                  if (view === "month") {
                    const d = new Date(currentDate);
                    d.setMonth(d.getMonth() + 1);
                    setCurrentDate(d);
                  } else {
                    const d = new Date(currentDate);
                    d.setDate(d.getDate() + 7);
                    setCurrentDate(d);
                  }
                }}
                className="text-gray-700"
              >
                ›
              </button>
            </div>
            <div className="ml-4 bg-white border px-3 py-2 rounded-full">
              <label className="flex items-center gap-2">
                <span className="text-sm text-gray-700">{view === "month" ? "Monthly" : "Weekly"}</span>
                <select
                  value={view}
                  onChange={(e) => setView(e.target.value as any)}
                  className="bg-transparent border-none text-sm text-gray-700"
                >
                  <option value="month">Monthly</option>
                  <option value="week">Weekly</option>
                </select>
              </label>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-9">
            <CalendarGrid view={view} currentDate={currentDate} meetings={filteredMeetings} workspaces={workspaces} />
          </div>

          <aside className="col-span-3 flex flex-col gap-6">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold mb-2">{currentDate.toLocaleString(undefined, { month: 'long', year: 'numeric' })} <button className="text-sm text-blue-500 float-right" onClick={() => { setEnabledWorkspaceIds([]); }}>Deselect all</button></h3>
              <WorkspaceList
                workspaces={workspaces}
                enabledIds={enabledWorkspaceIds}
                onToggle={(id) => {
                  setEnabledWorkspaceIds((prev) => (prev.includes(String(id)) ? prev.filter((x) => x !== String(id)) : [...prev, String(id)]));
                }}
              />
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold mb-2">Upcoming <span className="text-sm text-gray-500 float-right">{filteredMeetings.length} meetings</span></h3>
              <UpcomingMeetings meetings={filteredMeetings} workspaces={workspaces} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default CalendarLayout;
