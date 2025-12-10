import React from "react";

const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

type Props = {
  view: string;
  currentDate: Date;
  meetings: any[];
  workspaces: any[];
};

function startOfWeek(date: Date) {
  // Monday as first day
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // 0 = Monday
  d.setDate(d.getDate() - day);
  d.setHours(0,0,0,0);
  return d;
}

function startOfMonth(date: Date) {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  d.setHours(0,0,0,0);
  return d;
}

function endOfMonth(date: Date) {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  d.setHours(23,59,59,999);
  return d;
}

const CalendarGrid: React.FC<Props> = ({ view, currentDate, meetings, workspaces }) => {
  // Build matrix of dates depending on view
  let grid: Date[][] = [];

  if (view === "week") {
    const weekStart = startOfWeek(currentDate);
    const row: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      row.push(d);
    }
    grid.push(row);
  } else {
    const startMonth = startOfMonth(currentDate);
    const gridStart = startOfWeek(startMonth);
    const lastOfMonth = endOfMonth(currentDate);

    let cursor = new Date(gridStart);
    while (cursor <= lastOfMonth || grid.length < 6) {
      const week: Date[] = [];
      for (let i = 0; i < 7; i++) {
        week.push(new Date(cursor));
        cursor.setDate(cursor.getDate() + 1);
      }
      grid.push(week);
      // stop if we've passed the end of month and have at least 4 weeks
      if (cursor > lastOfMonth && grid.length >= 4) break;
    }
  }

  const meetingsByDay = new Map<string, any[]>();
  meetings.forEach((m) => {
    try {
      const key = new Date(m.start).toDateString();
      const arr = meetingsByDay.get(key) || [];
      arr.push(m);
      meetingsByDay.set(key, arr);
    } catch (e) {}
  });

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="grid grid-cols-7 gap-2 mb-4 text-sm text-gray-600">
        {days.map((d) => (
          <div key={d} className="text-center py-2 font-medium">{d}</div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {grid.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-3">
            {week.map((day, di) => {
              const key = day.toDateString();
              const ms = meetingsByDay.get(key) || [];
              const isCurrentMonth = day.getMonth() === currentDate.getMonth();
              return (
                <div key={di} className={`min-h-[6rem] rounded-md p-2 border ${isCurrentMonth ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'}`}>
                  <div className="text-xs text-gray-500">{day.getDate()}</div>
                  <div className="flex flex-col gap-2 mt-2">
                    {ms.slice(0,3).map((m:any)=>{
                      const ws = workspaces.find((w:any)=>String(w.id) === String(m.workspaceId)) || { color: '#888' };
                      return (
                        <div key={m.id} style={{ background: ws.color }} className="text-xs text-white rounded-full px-2 py-1 max-w-full truncate shadow-sm cursor-pointer" onClick={() => { window.location.hash = `#/workspace/${ws.id}` }}>
                          {new Date(m.start).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} {m.title}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarGrid;
