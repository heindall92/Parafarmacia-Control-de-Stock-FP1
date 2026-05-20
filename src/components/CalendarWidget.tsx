import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"] as const;

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
] as const;

type DayCell = {
  date: Date;
  inMonth: boolean;
};

function buildMonthGrid(year: number, month: number): DayCell[] {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const gridStart = new Date(year, month, 1 - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return {
      date,
      inMonth: date.getMonth() === month,
    };
  });
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

type CalendarWidgetProps = {
  restockDays?: number[];
};

export function CalendarWidget({ restockDays = [5, 12, 19, 26] }: CalendarWidgetProps) {
  const today = useMemo(() => new Date(), []);
  const [viewDate, setViewDate] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );

  const cells = buildMonthGrid(viewDate.getFullYear(), viewDate.getMonth());

  const prevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  return (
    <div className="calendar-widget morph-widget">
      <div className="calendar-widget-header">
        <div>
          <h3 className="text-sm font-bold text-[var(--text-primary)]">Reposiciones</h3>
          <p className="text-xs text-[var(--text-secondary)]">
            {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
          </p>
        </div>
        <div className="calendar-nav">
          <button
            type="button"
            onClick={prevMonth}
            className="calendar-nav-btn"
            aria-label="Mes anterior"
          >
            <ChevronLeft size={15} strokeWidth={2.25} />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="calendar-nav-btn"
            aria-label="Mes siguiente"
          >
            <ChevronRight size={15} strokeWidth={2.25} />
          </button>
        </div>
      </div>

      <div className="calendar-grid">
        {WEEKDAYS.map((day) => (
          <div key={day} className="calendar-weekday">
            {day}
          </div>
        ))}

        {cells.map(({ date, inMonth }) => {
          if (!inMonth) {
            return <div key={date.toISOString()} className="calendar-cell calendar-cell--empty" />;
          }

          const isToday = isSameDay(date, today);
          const isRestock = restockDays.includes(date.getDate());
          const isPast = date < today && !isToday;

          let dayClass = "calendar-day";
          if (isToday) dayClass += " calendar-day--today";
          else if (isRestock) dayClass += " calendar-day--restock";
          else if (isPast) dayClass += " calendar-day--past";

          return (
            <div key={date.toISOString()} className="calendar-cell">
              <button type="button" className={dayClass} aria-label={`Día ${date.getDate()}`}>
                {isToday ? <Check size={14} strokeWidth={2.5} /> : date.getDate()}
              </button>
              {isRestock && !isToday && (
                <span className="calendar-tag">Revisar</span>
              )}
              {isToday && <span className="calendar-tag calendar-tag--today">Hoy</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
