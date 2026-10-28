import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { set, get, del, keys } from 'idb-keyval';
import FRSScanner from '../../components/FRSScanner';
import FaceEnrollmentModal from '../../components/FaceEnrollmentModal';
import { Camera, Check, CheckCircle2, UserCheck } from 'lucide-react';
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Field,
  Input,
  PageHeader,
  Segmented,
  Select,
} from '../../components/ui';
import { cn } from '../../components/ui/cn';

const STEPS = ['Class', 'Subject & slot', 'Mark', 'Done'];

const TIME_SLOTS = [
  ['09:00-10:10', '09:00 – 10:10 (P1)'],
  ['10:25-11:30', '10:25 – 11:30 (P2)'],
  ['11:30-12:30', '11:30 – 12:30 (P3)'],
  ['13:15-14:15', '13:15 – 14:15 (P4)'],
  ['14:15-15:15', '14:15 – 15:15 (P5)'],
  ['15:15-16:00', '15:15 – 16:00 (P6)'],
];

function Stepper({ step }) {
  return (
    <ol className="no-scrollbar flex items-center gap-2 overflow-x-auto">
      {STEPS.map((label, i) => {
        const done = step > i + 1;
        const current = step === i + 1;
        return (
          <li key={label} className="flex shrink-0 items-center gap-2">
            <span
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-full text-2xs font-bold',
                done && 'bg-accent text-accent-ink',
                current && 'bg-ink text-canvas',
                !done && !current && 'bg-sunken text-faint ring-1 ring-inset ring-line'
              )}
            >
              {done ? <Check size={12} strokeWidth={3} /> : i + 1}
            </span>
            <span
              className={cn(
                'text-xs font-semibold',
                current ? 'text-ink' : done ? 'text-body' : 'text-faint'
              )}
            >
              {label}
            </span>
            {i < STEPS.length - 1 ? <span className="h-px w-6 bg-line sm:w-10" /> : null}
          </li>
        );
      })}
    </ol>
  );
}

export default function TakeAttendance() {
  const [step, setStep] = useState(1);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState('');
  const [mode, setMode] = useState('manual');
  const [records, setRecords] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [enrollStudentModal, setEnrollStudentModal] = useState(null);
  const [faceStatuses, setFaceStatuses] = useState({});

  useEffect(() => {
    api.get('/classes').then((r) => setClasses(r.data)).catch(() => {});
  }, []);

  const loadFaceStatus = useCallback(() => {
    if (!selectedClass) return;
    api
      .get(`/classes/${selectedClass}/face-status`)
      .then((r) => {
        const map = {};
        (r.data.students || []).forEach((s) => {
          map[s.studentId] = s;
        });
        setFaceStatuses(map);
      })
      .catch(() => {});
  }, [selectedClass]);

  useEffect(() => {
    if (!selectedClass) return;
    api.get(`/classes/${selectedClass}/subjects`).then((r) => setSubjects(r.data)).catch(() => {});
    api
      .get(`/classes/${selectedClass}/students`)
      .then((r) => {
        setStudents(r.data);
        const init = {};
        r.data.forEach((s) => {
          init[s.id] = 'present';
        });
        setRecords(init);
      })
      .catch(() => {});
    loadFaceStatus();
  }, [selectedClass, loadFaceStatus]);

  useEffect(() => {
    const syncOfflineData = async () => {
      if (!navigator.onLine) return;
      const ks = await keys();
      for (const k of ks) {
        if (typeof k === 'string' && k.startsWith('sync_attendance_')) {
          try {
            const payload = await get(k);
            const session = await api.post('/attendance-sessions', {
              classId: payload.classId,
              subjectId: payload.subjectId,
              date: payload.date,
              timeSlot: payload.timeSlot,
              mode: payload.mode,
            });
            await api.post(`/attendance-sessions/${session.data.id}/records`, {
              records: payload.records,
            });
            await del(k);
            toast.success(`Synced offline attendance for ${payload.date} ${payload.timeSlot}`);
          } catch {
            /* leave the entry queued and retry on the next online event */
          }
        }
      }
    };

    window.addEventListener('online', syncOfflineData);
    syncOfflineData();
    return () => window.removeEventListener('online', syncOfflineData);
  }, []);

  const markAll = (status) => {
    const updated = {};
    students.forEach((s) => {
      updated[s.id] = status;
    });
    setRecords(updated);
  };

  const submit = async () => {
    if (!selectedClass || !selectedSubject || !date || !timeSlot) {
      return toast.error('Please fill all fields');
    }
    setSubmitting(true);
    try {
      if (!navigator.onLine) throw new Error('OFFLINE');

      const session = await api.post('/attendance-sessions', {
        classId: parseInt(selectedClass, 10),
        subjectId: parseInt(selectedSubject, 10),
        date,
        timeSlot,
        mode,
      });

      const recordsArray = Object.entries(records).map(([studentId, status]) => ({
        studentId: parseInt(studentId, 10),
        status,
      }));

      await api.post(`/attendance-sessions/${session.data.id}/records`, { records: recordsArray });

      setResult({
        present: recordsArray.filter((r) => r.status === 'present').length,
        absent: recordsArray.filter((r) => r.status === 'absent').length,
        total: recordsArray.length,
        offline: false,
      });
      setStep(4);
      toast.success('Attendance recorded');
    } catch (err) {
      if (err.message === 'OFFLINE' || !navigator.onLine || err.code === 'ERR_NETWORK') {
        const recordsArray = Object.entries(records).map(([studentId, status]) => ({
          studentId: parseInt(studentId, 10),
          status,
        }));
        await set(`sync_attendance_${Date.now()}`, {
          classId: parseInt(selectedClass, 10),
          subjectId: parseInt(selectedSubject, 10),
          date,
          timeSlot,
          mode,
          records: recordsArray,
          timestamp: Date.now(),
        });
        toast.success('Saved offline — it will sync when you reconnect.', { duration: 5000 });
        setResult({
          present: recordsArray.filter((r) => r.status === 'present').length,
          absent: recordsArray.filter((r) => r.status === 'absent').length,
          total: recordsArray.length,
          offline: true,
        });
        setStep(4);
      } else {
        toast.error(err.response?.data?.error || 'Failed to submit attendance');
      }
    }
    setSubmitting(false);
  };

  const selectedClassName = classes.find((c) => c.id == selectedClass); // eslint-disable-line eqeqeq
  const selectedSubjectName = subjects.find((s) => s.id == selectedSubject); // eslint-disable-line eqeqeq
  const presentCount = Object.values(records).filter((r) => r === 'present').length;
  const absentCount = Object.values(records).filter((r) => r === 'absent').length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Teaching"
        title="Take attendance"
        description="Pick a class, choose the slot, then mark or scan the roster."
      />

      <div className="mx-auto w-full max-w-2xl">
        <Stepper step={step} />
      </div>

      {step === 1 ? (
        <Card className="mx-auto w-full max-w-2xl">
          <CardHeader>
            <h2 className="text-[15px] font-bold text-ink">Which class?</h2>
            <p className="mt-0.5 text-xs text-muted">
              Only the classes assigned to you are listed.
            </p>
          </CardHeader>
          <CardBody className="space-y-5">
            <Field label="Class" htmlFor="att-class">
              <Select
                id="att-class"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="">Select a class…</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.department_code} {c.name}-{c.section} (Sem {c.semester}) — {c.student_count}{' '}
                    students
                  </option>
                ))}
              </Select>
            </Field>
            <div className="flex justify-end">
              <Button variant="primary" disabled={!selectedClass} onClick={() => setStep(2)}>
                Continue
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : null}

      {step === 2 ? (
        <Card className="mx-auto w-full max-w-2xl">
          <CardHeader>
            <h2 className="text-[15px] font-bold text-ink">Subject, date and slot</h2>
            <p className="mt-0.5 text-xs text-muted">
              {selectedClassName
                ? `${selectedClassName.name}-${selectedClassName.section}`
                : 'Selected class'}
            </p>
          </CardHeader>
          <CardBody className="space-y-5">
            <Field label="Subject" htmlFor="att-subject">
              <Select
                id="att-subject"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                <option value="">Select a subject…</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </Select>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Date" htmlFor="att-date">
                <Input
                  id="att-date"
                  type="date"
                  value={date}
                  onChange={(e) => {
                    const day = new Date(e.target.value).getDay();
                    if (day === 0) return toast.error('Sundays are holidays — pick another day.');
                    setDate(e.target.value);
                  }}
                />
              </Field>
              <Field label="Time slot" htmlFor="att-slot">
                <Select
                  id="att-slot"
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                >
                  <option value="">Select a slot…</option>
                  {TIME_SLOTS.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-semibold text-body">How are you marking?</p>
              <Segmented
                value={mode}
                onChange={setMode}
                options={[
                  { value: 'manual', label: 'Manual' },
                  { value: 'frs', label: 'Face scan' },
                ]}
              />
              <p className="mt-2 text-xs text-faint">
                Face scan fills the roster as students are recognised; you can still correct any
                row afterwards.
              </p>
            </div>

            <div className="flex justify-between gap-2">
              <Button variant="secondary" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                variant="primary"
                disabled={!selectedSubject || !timeSlot}
                onClick={() => setStep(3)}
              >
                Continue
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : null}

      {step === 3 ? (
        <div className="space-y-4">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div className="min-w-0">
                <h2 className="text-[15px] font-bold text-ink">
                  {selectedClassName ? `${selectedClassName.name}-${selectedClassName.section}` : ''}
                  {selectedSubjectName ? ` · ${selectedSubjectName.name}` : ''}
                </h2>
                <p className="tnum mt-0.5 text-xs text-muted">
                  {new Date(date).toLocaleDateString('en', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}{' '}
                  · {timeSlot} · {students.length} students
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="positive">{presentCount} present</Badge>
                <Badge tone="negative">{absentCount} absent</Badge>
                <Button size="sm" variant="secondary" onClick={() => markAll('present')}>
                  All present
                </Button>
                <Button size="sm" variant="secondary" onClick={() => markAll('absent')}>
                  All absent
                </Button>
              </div>
            </div>
          </Card>

          {mode === 'frs' ? (
            <FRSScanner
              classId={selectedClass}
              students={students}
              records={records}
              onUpdateRecord={(id, status) => setRecords((prev) => ({ ...prev, [id]: status }))}
            />
          ) : null}

          <Card className="overflow-hidden">
            <ul className="divide-y divide-line">
              {students.map((s, i) => (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="tnum w-5 shrink-0 text-2xs text-faint">{i + 1}</span>
                    <Avatar name={s.full_name} size="sm" tone="neutral" />
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-ink">{s.full_name}</p>
                      <p className="font-mono text-2xs text-faint">{s.roll_no}</p>
                    </div>
                    {faceStatuses[s.id]?.isEnrolled ? (
                      <span className="hidden items-center gap-1 text-2xs font-semibold text-positive sm:inline-flex">
                        <UserCheck size={11} /> Face ID
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEnrollStudentModal(s)}
                        className="hidden items-center gap-1 text-2xs font-semibold text-accent hover:underline underline-offset-2 sm:inline-flex"
                      >
                        <Camera size={11} /> Enrol face
                      </button>
                    )}
                  </div>

                  <Segmented
                    size="sm"
                    value={records[s.id] || 'present'}
                    onChange={(value) => setRecords((p) => ({ ...p, [s.id]: value }))}
                    options={[
                      { value: 'present', label: 'Present' },
                      { value: 'absent', label: 'Absent' },
                    ]}
                  />
                </li>
              ))}
            </ul>
          </Card>

          <div className="flex flex-wrap justify-between gap-2">
            <Button variant="secondary" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button variant="primary" onClick={submit} disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit attendance'}
            </Button>
          </div>
        </div>
      ) : null}

      {step === 4 && result ? (
        <Card className="mx-auto w-full max-w-lg">
          <CardBody className="flex flex-col items-center py-10 text-center">
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-positive-soft text-positive">
              <CheckCircle2 size={22} />
            </span>
            <h2 className="text-lg font-bold text-ink">
              {result.offline ? 'Saved offline' : 'Attendance submitted'}
            </h2>
            <p className="mt-1 text-[13px] text-muted">
              {selectedSubjectName?.name} · {date} · {timeSlot}
            </p>
            {result.offline ? (
              <p className="mt-2 max-w-sm text-xs text-caution">
                This session is queued on this device and will upload automatically when you are
                back online.
              </p>
            ) : null}

            <div className="mt-8 grid w-full grid-cols-3 divide-x divide-line rounded-md border border-line">
              {[
                ['Present', result.present, 'text-positive'],
                ['Absent', result.absent, 'text-negative'],
                ['Total', result.total, 'text-ink'],
              ].map(([label, value, tone]) => (
                <div key={label} className="px-4 py-4">
                  <p className={cn('tnum text-[22px] font-bold leading-none', tone)}>{value}</p>
                  <p className="mt-1.5 text-2xs font-bold uppercase tracking-[0.1em] text-faint">
                    {label}
                  </p>
                </div>
              ))}
            </div>

            <Button
              variant="primary"
              className="mt-8 w-full"
              onClick={() => {
                setStep(1);
                setResult(null);
                setSelectedClass('');
                setSelectedSubject('');
                setRecords({});
              }}
            >
              Take another register
            </Button>
          </CardBody>
        </Card>
      ) : null}

      <FaceEnrollmentModal
        isOpen={!!enrollStudentModal}
        onClose={() => setEnrollStudentModal(null)}
        preselectedStudentId={enrollStudentModal?.id}
        classStudents={students}
        onEnrolled={() => loadFaceStatus()}
      />
    </div>
  );
}
