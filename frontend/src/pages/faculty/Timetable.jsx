import { useState, useEffect } from 'react';
import { CalendarDays, FlaskConical, MapPin, Presentation } from 'lucide-react';
import api from '../../services/api';
import {
  Badge,
  Card,
  EmptyState,
  PageHeader,
  PageLoader,
  Select,
} from '../../components/ui';
import { cn } from '../../components/ui/cn';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NUMBERS = [1, 2, 3, 4, 5, 6];
const TIME_SLOTS = [
  '09:00-10:10',
  '10:25-11:30',
  '11:30-12:30',
  '13:15-14:15',
  '14:15-15:15',
  '15:15-16:00',
];

export default function Timetable({ readOnly = false, classId = null }) {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(classId || '');
  const [timetable, setTimetable] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (classId) return;
    api
      .get('/classes')
      .then((r) => {
        setClasses(r.data);
        if (r.data.length && !selectedClass) setSelectedClass(r.data[0].id);
      })
      .catch(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  useEffect(() => {
    if (!selectedClass) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api
      .get(`/timetables/weekly/${selectedClass}`)
      .then(({ data }) => setTimetable(data || {}))
      .catch(() => setTimetable({}))
      .finally(() => setLoading(false));
  }, [selectedClass]);

  const slotAt = (day, timeSlot) => {
    const dayData = timetable[day];
    if (!dayData?.slots) return null;
    const [start] = timeSlot.split('-');
    return dayData.slots.find((s) => s.start_time?.substring(0, 5) === start) || null;
  };

  const hasAnySlot = Object.values(timetable).some((day) => day?.slots?.length);
  const today = new Date().getDay();
  const selected = classes.find((c) => String(c.id) === String(selectedClass));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={readOnly ? 'Academics' : 'Teaching'}
        title="Weekly schedule"
        description={
          readOnly
            ? 'Your class timetable for the current term.'
            : 'Published timetable for the selected class.'
        }
        actions={
          !readOnly && classes.length > 0 ? (
            <Select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-[240px]"
              aria-label="Selected class"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}-{c.section} (Sem {c.semester})
                </option>
              ))}
            </Select>
          ) : (
            <Badge tone="outline">{selected ? `${selected.name}-${selected.section}` : 'Timetable'}</Badge>
          )
        }
      />

      <Card className="overflow-hidden">
        {loading ? (
          <PageLoader label="Loading timetable" />
        ) : !hasAnySlot ? (
          <EmptyState
            icon={CalendarDays}
            title="No timetable published"
            description={
              readOnly
                ? 'Your class timetable has not been published yet. Check back soon.'
                : 'An administrator can build the weekly grid from the timetable setup page.'
            }
          />
        ) : (
          <div className="overflow-x-auto p-4">
            <div className="min-w-[860px]">
              {/* Header row */}
              <div className="grid grid-cols-[76px_repeat(6,1fr)] border-b border-line">
                <div className="sticky left-0 z-10 bg-surface px-2 py-2.5 text-2xs font-bold uppercase tracking-[0.08em] text-faint">
                  Time
                </div>
                {DAY_NUMBERS.map((d, i) => (
                  <div
                    key={d}
                    className={cn(
                      'px-3 py-2.5 text-center text-2xs font-bold uppercase tracking-[0.08em]',
                      d === today ? 'text-accent' : 'text-muted'
                    )}
                  >
                    {DAY_LABELS[i]}
                    {d === today ? (
                      <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-accent align-middle" />
                    ) : null}
                  </div>
                ))}
              </div>

              {TIME_SLOTS.map((ts) => {
                const [start, end] = ts.split('-');
                return (
                  <div
                    key={ts}
                    className="grid grid-cols-[76px_repeat(6,1fr)] border-b border-line last:border-b-0"
                  >
                    <div className="sticky left-0 z-10 border-r border-line bg-surface px-2 py-3">
                      <p className="tnum text-2xs font-bold text-ink">{start}</p>
                      <p className="tnum text-2xs text-faint">{end}</p>
                    </div>

                    {DAY_NUMBERS.map((d) => {
                      const slot = slotAt(d, ts);
                      const isLab = slot?.type?.toLowerCase() === 'lab';
                      return (
                        <div
                          key={`${d}-${ts}`}
                          className={cn(
                            'border-r border-line p-1.5 last:border-r-0',
                            d === today && 'bg-accent/[0.03]'
                          )}
                        >
                          {slot ? (
                            <div
                              className={cn(
                                'flex h-full min-h-[76px] flex-col justify-between rounded-md border border-line ' +
                                  'bg-surface p-2.5 shadow-xs transition-colors hover:border-line-strong'
                              )}
                            >
                              <div>
                                <p className="line-clamp-2 text-xs font-semibold leading-tight text-ink">
                                  {slot.subject_name || slot.subject_code}
                                </p>
                                <p className="mt-1 truncate font-mono text-2xs text-faint">
                                  {slot.subject_code}
                                </p>
                              </div>
                              <div className="mt-2 flex items-center justify-between gap-1 text-2xs text-muted">
                                <span className="inline-flex items-center gap-1">
                                  {isLab ? <FlaskConical size={10} /> : <Presentation size={10} />}
                                  {slot.type || 'Lecture'}
                                </span>
                                {slot.room ? (
                                  <span className="inline-flex items-center gap-1">
                                    <MapPin size={10} />
                                    {slot.room}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          ) : (
                            <div className="min-h-[76px] rounded-md bg-sunken/40" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
