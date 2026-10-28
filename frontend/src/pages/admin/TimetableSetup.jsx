import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Clock,
  MapPin,
  Plus,
  Save,
  Settings,
  UserRound,
  Users,
} from 'lucide-react';
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
} from '../../components/ui';
import { cn } from '../../components/ui/cn';

const DAYS = [1, 2, 3, 4, 5, 6];
const DAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function TimetableSetup() {
  const [view, setView] = useState('classes');

  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);

  const [mappedSubjects, setMappedSubjects] = useState([]);
  const [faculties, setFaculties] = useState([]);

  const [periods, setPeriods] = useState([]);
  const [grid, setGrid] = useState({});

  const [setupModal, setSetupModal] = useState(false);
  const [cellModal, setCellModal] = useState(null);

  const [setupCount, setSetupCount] = useState(6);
  const [setupPeriods, setSetupPeriods] = useState([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [clsRes, facRes] = await Promise.all([
        api.get('/classes'),
        api.get('/users?role=faculty'),
      ]);
      setClasses(clsRes.data);
      setFaculties(facRes.data);
    } catch {
      toast.error('Failed to load initial data');
    }
  };

  const handleClassClick = async (cls) => {
    setSelectedClass(cls);
    setView('timetable');

    try {
      const subRes = await api.get(`/class-subjects/${cls.id}`);
      setMappedSubjects(subRes.data);

      const ttRes = await api.get(`/timetables?classId=${cls.id}`);
      const entries = ttRes.data;

      if (entries.length === 0) {
        setPeriods([]);
        setGrid({});
      } else {
        const uniquePeriods = [];
        entries.forEach((e) => {
          const st = e.start_time.substring(0, 5);
          const et = e.end_time.substring(0, 5);
          if (!uniquePeriods.find((p) => p.startTime === st && p.endTime === et)) {
            uniquePeriods.push({ startTime: st, endTime: et });
          }
        });
        uniquePeriods.sort((a, b) => a.startTime.localeCompare(b.startTime));
        setPeriods(uniquePeriods);

        const initialGrid = {};
        DAYS.forEach((day) => {
          initialGrid[day] = {};
          uniquePeriods.forEach((_, idx) => {
            initialGrid[day][idx] = { subjectId: '', facultyId: '', room: '' };
          });
        });

        entries.forEach((e) => {
          const st = e.start_time.substring(0, 5);
          const pIdx = uniquePeriods.findIndex((p) => p.startTime === st);
          if (pIdx !== -1 && DAYS.includes(e.day_of_week)) {
            initialGrid[e.day_of_week][pIdx] = {
              subjectId: e.subject_id,
              facultyId: e.faculty_id || '',
              room: e.room || '',
            };
          }
        });

        setGrid(initialGrid);
      }
    } catch {
      toast.error('Failed to load class timetable');
    }
  };

  const openSetupModal = () => {
    setSetupCount(periods.length || 6);
    if (periods.length > 0) {
      setSetupPeriods([...periods]);
    } else {
      setSetupPeriods(Array(6).fill({ startTime: '09:00', endTime: '10:00' }));
    }
    setSetupModal(true);
  };

  const handleSetupCountChange = (count) => {
    const val = parseInt(count, 10) || 1;
    setSetupCount(val);
    setSetupPeriods(
      Array(val)
        .fill()
        .map((_, i) => ({
          startTime: setupPeriods[i]?.startTime || '09:00',
          endTime: setupPeriods[i]?.endTime || '10:00',
        }))
    );
  };

  const updateSetupPeriod = (idx, field, val) => {
    const newP = [...setupPeriods];
    newP[idx] = { ...newP[idx], [field]: val };
    setSetupPeriods(newP);
  };

  const applySetup = () => {
    for (const p of setupPeriods) {
      if (!p.startTime || !p.endTime) {
        toast.error('Every period needs a start and end time.');
        return;
      }
    }

    const sorted = [...setupPeriods].sort((a, b) => a.startTime.localeCompare(b.startTime));
    setPeriods(sorted);

    const newGrid = {};
    DAYS.forEach((day) => {
      newGrid[day] = {};
      sorted.forEach((_, idx) => {
        newGrid[day][idx] = { subjectId: '', facultyId: '', room: '' };
      });
    });
    setGrid(newGrid);
    setSetupModal(false);
    toast.success('Periods configured. You can build the grid now.');
  };

  const openCellModal = (day, periodIdx) => {
    setCellModal({
      day,
      periodIdx,
      data: { ...(grid[day]?.[periodIdx] || { subjectId: '', facultyId: '', room: '' }) },
    });
  };

  const handleSubjectSelectInModal = (subjectId) => {
    const defaultMapping = mappedSubjects.find((s) => s.subject_id === parseInt(subjectId, 10));
    setCellModal((prev) => ({
      ...prev,
      data: { ...prev.data, subjectId, facultyId: defaultMapping?.faculty_id || '' },
    }));
  };

  const saveCellData = (e) => {
    e.preventDefault();
    const { day, periodIdx, data } = cellModal;
    setGrid((prev) => ({ ...prev, [day]: { ...prev[day], [periodIdx]: data } }));
    setCellModal(null);
  };

  const saveTimetable = async () => {
    const slots = [];
    DAYS.forEach((day) => {
      periods.forEach((p, idx) => {
        const cellData = grid[day]?.[idx];
        if (cellData && cellData.subjectId) {
          slots.push({
            subjectId: cellData.subjectId,
            facultyId: cellData.facultyId || null,
            room: cellData.room || null,
            dayOfWeek: day,
            startTime: p.startTime,
            endTime: p.endTime,
          });
        }
      });
    });

    try {
      const toastId = toast.loading('Saving timetable…');
      await api.post('/timetables', { classId: selectedClass.id, slots });
      toast.success('Timetable saved', { id: toastId });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save timetable');
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={view === 'classes' ? 'Academics' : 'Timetable'}
        title={view === 'classes' ? 'Timetable' : `${selectedClass?.name} — ${selectedClass?.section}`}
        description={
          view === 'classes'
            ? 'Pick a class to build or adjust its weekly schedule.'
            : `Semester ${selectedClass?.semester} · ${periods.length} periods configured`
        }
        actions={
          view === 'classes' ? null : (
            <>
              <Button variant="ghost" onClick={() => setView('classes')}>
                <ArrowLeft size={14} /> All classes
              </Button>
              <Button variant="secondary" onClick={openSetupModal}>
                <Settings size={14} /> Periods
              </Button>
              <Button variant="primary" onClick={saveTimetable} disabled={periods.length === 0}>
                <Save size={14} /> Save
              </Button>
            </>
          )
        }
      />

      {view === 'classes' ? (
        classes.length === 0 ? (
          <div className="rounded-lg border border-line bg-surface shadow-xs">
            <EmptyState
              icon={CalendarDays}
              title="No classes to schedule"
              description="Create a class first, then return here to build its timetable."
            />
          </div>
        ) : (
          <div className="stagger grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {classes.map((cls) => (
              <button
                key={cls.id}
                type="button"
                onClick={() => handleClassClick(cls)}
                className="group rounded-lg border border-line bg-surface p-4 text-left shadow-xs transition-all duration-150 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-md"
              >
                <div className="mb-4 flex items-start justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-sunken text-muted transition-colors group-hover:bg-accent-soft group-hover:text-accent">
                    <Users size={16} />
                  </span>
                  <Badge tone="outline">Sem {cls.semester}</Badge>
                </div>
                <p className="text-[15px] font-bold text-ink">{cls.name}</p>
                <p className="mt-0.5 text-xs text-muted">
                  Section {cls.section} · {cls.department_code}
                </p>
              </button>
            ))}
          </div>
        )
      ) : (
        <section className="overflow-hidden rounded-lg border border-line bg-surface shadow-xs">
          {periods.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No periods configured"
              description="Define how many periods the day has and their times, then start filling in the grid."
              action={
                <Button variant="primary" size="sm" onClick={openSetupModal}>
                  <Settings size={14} /> Setup periods
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 w-[92px] border-b border-r border-line bg-sunken px-3 py-2.5 text-left text-2xs font-bold uppercase tracking-[0.08em] text-muted">
                      Day
                    </th>
                    {periods.map((p, idx) => (
                      <th
                        key={idx}
                        className="border-b border-r border-line bg-sunken px-3 py-2 text-center last:border-r-0"
                      >
                        <span className="block text-2xs font-bold uppercase tracking-[0.08em] text-faint">
                          P{idx + 1}
                        </span>
                        <span className="tnum block text-2xs font-medium text-muted">
                          {p.startTime}–{p.endTime}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DAYS.map((day) => (
                    <tr key={day}>
                      <td className="sticky left-0 z-10 border-b border-r border-line bg-surface px-3 py-2 text-xs font-semibold text-ink">
                        {DAY_NAMES[day].slice(0, 3)}
                      </td>
                      {periods.map((_, idx) => {
                        const cell = grid[day]?.[idx] || {};
                        const subject = mappedSubjects.find(
                          (s) => s.subject_id === parseInt(cell.subjectId, 10)
                        );
                        const faculty = faculties.find(
                          (f) => f.id === parseInt(cell.facultyId, 10)
                        );

                        return (
                          <td
                            key={idx}
                            className="h-[74px] border-b border-r border-line p-1.5 align-top last:border-r-0"
                          >
                            <button
                              type="button"
                              onClick={() => openCellModal(day, idx)}
                              className={cn(
                                'flex h-full w-full flex-col justify-center gap-0.5 rounded-md px-2 py-1.5 text-left transition-colors',
                                cell.subjectId
                                  ? 'bg-accent-soft hover:bg-accent-soft/70'
                                  : 'border border-dashed border-line text-faint hover:border-accent/40 hover:bg-accent-soft/40 hover:text-accent'
                              )}
                            >
                              {cell.subjectId ? (
                                <>
                                  <span className="truncate text-2xs font-bold text-accent">
                                    {subject?.subject_code || 'Subject'}
                                  </span>
                                  <span className="flex items-center gap-1 truncate text-2xs text-muted">
                                    <UserRound size={9} />
                                    {faculty?.full_name?.split(' ')[0] || 'Unassigned'}
                                  </span>
                                  {cell.room ? (
                                    <span className="flex items-center gap-1 truncate text-2xs text-faint">
                                      <MapPin size={9} /> {cell.room}
                                    </span>
                                  ) : null}
                                </>
                              ) : (
                                <Plus size={14} className="mx-auto" />
                              )}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ── period setup ── */}
      <Modal
        open={setupModal}
        onClose={() => setSetupModal(false)}
        title="Setup periods"
        description="Changing the number of periods resets the grid for this class."
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setSetupModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={applySetup}>
              Apply periods
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Number of periods per day" htmlFor="period-count" className="max-w-[140px]">
            <Input
              id="period-count"
              type="number"
              min="1"
              max="10"
              value={setupCount}
              onChange={(e) => handleSetupCountChange(e.target.value)}
              className="text-center font-semibold"
            />
          </Field>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3">
            {setupPeriods.map((p, idx) => (
              <div key={idx} className="rounded-md border border-line bg-sunken/60 p-3">
                <p className="mb-2 text-2xs font-bold uppercase tracking-[0.1em] text-faint">
                  Period {idx + 1}
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    aria-label={`Period ${idx + 1} start`}
                    value={p.startTime || ''}
                    onChange={(e) => updateSetupPeriod(idx, 'startTime', e.target.value)}
                    className="h-8 px-2 text-xs"
                  />
                  <span className="text-faint">–</span>
                  <Input
                    type="time"
                    aria-label={`Period ${idx + 1} end`}
                    value={p.endTime || ''}
                    onChange={(e) => updateSetupPeriod(idx, 'endTime', e.target.value)}
                    className="h-8 px-2 text-xs"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* ── cell editor ── */}
      <Modal
        open={Boolean(cellModal)}
        onClose={() => setCellModal(null)}
        title={
          cellModal ? `${DAY_NAMES[cellModal.day]} · Period ${cellModal.periodIdx + 1}` : 'Slot'
        }
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCellModal(null)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="cell-form"
              variant={cellModal?.data.subjectId ? 'primary' : 'danger'}
            >
              {cellModal?.data.subjectId ? 'Save slot' : 'Clear slot'}
            </Button>
          </>
        }
      >
        {cellModal ? (
          <form id="cell-form" onSubmit={saveCellData} className="space-y-4">
            <Field label="Subject" htmlFor="cell-subject" required>
              <Select
                id="cell-subject"
                value={cellModal.data.subjectId}
                onChange={(e) => handleSubjectSelectInModal(e.target.value)}
              >
                <option value="">Free period</option>
                {mappedSubjects.map((s) => (
                  <option key={s.subject_id} value={s.subject_id}>
                    {s.subject_code} — {s.subject_name}
                  </option>
                ))}
              </Select>
            </Field>

            {cellModal.data.subjectId ? (
              <div className="animate-fade-in space-y-4">
                <Field label="Faculty" htmlFor="cell-faculty">
                  <Select
                    id="cell-faculty"
                    value={cellModal.data.facultyId}
                    onChange={(e) =>
                      setCellModal((p) => ({ ...p, data: { ...p.data, facultyId: e.target.value } }))
                    }
                  >
                    <option value="">Select faculty…</option>
                    {faculties.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.full_name}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Room" htmlFor="cell-room">
                  <Input
                    id="cell-room"
                    value={cellModal.data.room}
                    onChange={(e) =>
                      setCellModal((p) => ({ ...p, data: { ...p.data, room: e.target.value } }))
                    }
                    placeholder="101A"
                  />
                </Field>
              </div>
            ) : (
              <p className="flex items-center gap-2 rounded-md bg-sunken px-3 py-2.5 text-xs text-muted">
                <BookOpen size={13} /> Leaving this empty marks the slot as a free period.
              </p>
            )}
          </form>
        ) : null}
      </Modal>
    </div>
  );
}
