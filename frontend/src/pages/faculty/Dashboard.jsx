import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  FileText,
  Search,
  TrendingUp,
  Users,
  UserRound,
  XCircle,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { formatTime } from '../../utils/format';
import AttendanceMatrix from './AttendanceMatrix';
import {
  AnimatedNumber,
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  PageHeader,
  PageLoader,
  Progress,
  Select,
  StatCard,
  Table,
  TBody,
  Td,
  Th,
  THead,
  TR,
  TableEmpty,
  Modal,
} from '../../components/ui';

const ZONES = [
  { key: 'green', label: 'On track', hint: '75% and above', tone: 'positive' },
  { key: 'yellow', label: 'Warning', hint: '60 – 74%', tone: 'caution' },
  { key: 'red', label: 'Critical', hint: 'Below 60%', tone: 'negative' },
];

function TrendTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const date = new Date(label);
  return (
    <div className="rounded-md border border-line bg-surface px-3 py-2 shadow-md">
      <p className="text-2xs font-bold uppercase tracking-[0.08em] text-faint">
        {date.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
      </p>
      <p className="tnum mt-0.5 text-sm font-bold text-ink">
        {payload[0].value}% <span className="text-xs font-medium text-muted">present</span>
      </p>
    </div>
  );
}

function AlertRow({ alert }) {
  const critical = alert.type === 'critical';
  return (
    <div className="flex items-start gap-3 rounded-md border border-line bg-surface px-3 py-2.5">
      <span
        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
          critical ? 'bg-negative-soft text-negative' : 'bg-caution-soft text-caution'
        }`}
      >
        {critical ? <AlertTriangle size={14} /> : <FileText size={14} />}
      </span>
      <div className="min-w-0">
        <p className="truncate text-[13px] font-semibold text-ink">{alert.title}</p>
        <p className="mt-0.5 text-xs text-muted">{alert.message}</p>
      </div>
    </div>
  );
}

export default function FacultyDashboard() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [zones, setZones] = useState({ green: 0, yellow: 0, red: 0 });
  const [students, setStudents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAlerts, setShowAlerts] = useState(false);

  useEffect(() => {
    api
      .get('/classes')
      .then(({ data }) => {
        setClasses(data);
        if (data.length > 0) setSelectedClass(data[0].id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    setLoading(true);

    Promise.all([
      api.get(`/dashboard/classes/${selectedClass}/summary`).catch(() => ({ data: {} })),
      api.get(`/dashboard/classes/${selectedClass}/trends?days=7`).catch(() => ({ data: [] })),
      api
        .get(`/dashboard/classes/${selectedClass}/zones`)
        .catch(() => ({ data: { green: 0, yellow: 0, red: 0 } })),
      api
        .get(`/dashboard/classes/${selectedClass}/students?limit=200`)
        .catch(() => ({ data: { students: [] } })),
      api.get('/dashboard/alerts').catch(() => ({ data: [] })),
      api.get(`/timetables/weekly/${selectedClass}`).catch(() => ({ data: {} })),
    ])
      .then(([sumRes, trendRes, zoneRes, studRes, alertRes, schedRes]) => {
        setSummary(sumRes.data || null);
        setTrends(Array.isArray(trendRes.data) ? trendRes.data : []);
        setZones(zoneRes.data || { green: 0, yellow: 0, red: 0 });

        const fetchedStudents = studRes.data?.students || [];
        setStudents(fetchedStudents);

        const atRisk = fetchedStudents
          .filter((s) => s.zone === 'red' || s.zone === 'yellow')
          .map((s) => ({
            type: s.zone === 'red' ? 'critical' : 'warning',
            title: s.student_name?.toUpperCase() || 'Unknown student',
            message: `${s.roll_no} is at ${s.attendance_pct}% attendance`,
          }));

        setAlerts([...atRisk, ...(alertRes.data || [])]);

        // The weekly endpoint returns { "0": { day, slots }, ... } keyed by day number.
        const today = new Date().getDay();
        const todayKey = Object.keys(schedRes.data || {}).find(
          (key) => Number(key) === today
        );
        setSchedule(schedRes.data?.[todayKey]?.slots || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedClass, user?.id]);

  const filteredStudents = students.filter(
    (s) =>
      !search ||
      s.student_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.roll_no?.toLowerCase().includes(search.toLowerCase())
  );

  const totalStudents = summary?.totalStudents || 0;
  const zoneTotal = (zones.green || 0) + (zones.yellow || 0) + (zones.red || 0);

  const cards = summary
    ? [
        {
          label: 'Students',
          value: <AnimatedNumber value={totalStudents} />,
          icon: Users,
          tone: 'accent',
          hint: 'Enrolled in this class',
        },
        {
          label: 'Present today',
          value: <AnimatedNumber value={summary.todayPresent || 0} />,
          icon: CheckCircle2,
          tone: 'positive',
          hint: `${summary.todayLeave || 0} on approved leave`,
        },
        {
          label: 'Absent today',
          value: <AnimatedNumber value={summary.todayAbsent || 0} />,
          icon: XCircle,
          tone: 'negative',
          hint: 'Not marked present',
        },
        {
          label: 'Average attendance',
          value: `${summary.avgAttendancePct ?? 0}%`,
          icon: TrendingUp,
          tone: 'info',
          hint: 'Across the term',
        },
      ]
    : [];

  if (loading && !selectedClass) return <PageLoader label="Loading class dashboard" />;

  const selected = classes.find((c) => String(c.id) === String(selectedClass));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Faculty"
        title="Class dashboard"
        description="Attendance health for the class you are looking after right now."
        actions={
          <div className="flex flex-col gap-1">
            <span className="text-2xs font-bold uppercase tracking-[0.1em] text-faint">Class</span>
            <Select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="min-w-[240px]"
              aria-label="Selected class"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.department_code ? `${c.department_code} ` : ''}
                  {c.name}-{c.section} (Sem {c.semester})
                </option>
              ))}
            </Select>
          </div>
        }
      />

      {cards.length > 0 ? (
        <div className="stagger grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {cards.map((card) => (
            <StatCard
              key={card.label}
              label={card.label}
              value={card.value}
              icon={card.icon}
              tone={card.tone}
              hint={card.hint}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardBody>
            <p className="text-[13px] text-muted">
              No summary is available for {selected ? `${selected.name}-${selected.section}` : 'this class'} yet.
            </p>
          </CardBody>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            actions={<Badge tone="outline">Last 7 days</Badge>}
          >
            <h2 className="text-[15px] font-bold text-ink">Attendance trend</h2>
            <p className="mt-0.5 text-xs text-muted">
              Share of students present in each marked session.
            </p>
          </CardHeader>

          {trends.length > 0 ? (
            <div className="h-[260px] px-3 pb-3 pt-5 text-faint">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trends} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid
                    vertical={false}
                    strokeDasharray="3 4"
                    className="stroke-line"
                  />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    dy={8}
                    tick={{ fill: 'currentColor', fontSize: 11 }}
                    tickFormatter={(d) =>
                      new Date(d).toLocaleDateString('en', { weekday: 'short' })
                    }
                  />
                  <YAxis
                    domain={[0, 100]}
                    width={34}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: 'currentColor', fontSize: 11 }}
                  />
                  <Tooltip
                    content={<TrendTooltip />}
                    cursor={{ fill: 'rgba(148, 163, 184, 0.14)' }}
                  />
                  <Bar dataKey="attendance_rate" maxBarSize={40} radius={[6, 6, 0, 0]}>
                    {trends.map((entry, index) => (
                      <Cell
                        key={`bar-${index}`}
                        className={
                          index === trends.length - 1 ? 'fill-accent' : 'fill-line-strong'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex min-h-[260px] flex-col items-center justify-center px-6 py-10 text-center">
              <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-sunken text-faint">
                <TrendingUp size={18} />
              </span>
              <p className="text-[13px] font-semibold text-ink">No sessions in the last week</p>
              <p className="mt-1 max-w-xs text-xs text-muted">
                The trend appears once this class has a few marked sessions.
              </p>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader actions={<Badge tone="outline">{schedule.length}</Badge>}>
            <h2 className="text-[15px] font-bold text-ink">Today&apos;s schedule</h2>
            <p className="mt-0.5 text-xs text-muted">
              {new Date().toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </CardHeader>

          {schedule.length > 0 ? (
            <ul className="divide-y divide-line">
              {schedule.map((slot, i) => (
                <li key={`${slot.subject_code}-${i}`} className="flex items-start gap-3 px-5 py-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent-soft font-mono text-2xs font-bold text-accent">
                    {slot.subject_code?.slice(0, 2).toUpperCase() || '—'}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-ink">
                      {slot.subject_name || slot.subject_code}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                      {slot.room ? ` · Room ${slot.room}` : ''}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <CardBody>
              <div className="flex flex-col items-center py-8 text-center">
                <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-sunken text-faint">
                  <CalendarDays size={18} />
                </span>
                <p className="text-[13px] font-semibold text-ink">Nothing scheduled</p>
                <p className="mt-1 text-xs text-muted">You have no classes today.</p>
              </div>
            </CardBody>
          )}

          <div className="border-t border-line px-5 py-3">
            <Link
              to="/faculty/timetable"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline underline-offset-4"
            >
              Open full schedule <ArrowRight size={13} />
            </Link>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <h2 className="text-[15px] font-bold text-ink">Attendance status</h2>
            <p className="mt-0.5 text-xs text-muted">Students grouped by risk zone.</p>
          </CardHeader>
          <CardBody className="space-y-4">
            {ZONES.map((zone) => {
              const value = zones[zone.key] || 0;
              const share = zoneTotal > 0 ? (value / zoneTotal) * 100 : 0;
              return (
                <div key={zone.key}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          zone.tone === 'positive'
                            ? 'bg-positive'
                            : zone.tone === 'caution'
                              ? 'bg-caution'
                              : 'bg-negative'
                        }`}
                      />
                      <span className="text-[13px] font-semibold text-ink">{zone.label}</span>
                      <span className="text-2xs text-faint">{zone.hint}</span>
                    </div>
                    <span className="tnum text-[13px] font-bold text-ink">{value}</span>
                  </div>
                  <Progress value={share} tone={zone.tone} />
                </div>
              );
            })}
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            actions={
              alerts.length > 0 ? (
                <Button size="xs" variant="ghost" onClick={() => setShowAlerts(true)}>
                  View all
                </Button>
              ) : (
                <Badge tone="positive" dot>
                  Clear
                </Badge>
              )
            }
          >
            <h2 className="text-[15px] font-bold text-ink">Action required</h2>
            <p className="mt-0.5 text-xs text-muted">
              Students below the threshold and pending tasks.
            </p>
          </CardHeader>

          <CardBody>
            {alerts.length > 0 ? (
              <div className="space-y-2">
                {alerts.slice(0, 3).map((a, i) => (
                  <AlertRow key={`${a.title}-${i}`} alert={a} />
                ))}
                {alerts.length > 3 ? (
                  <button
                    type="button"
                    onClick={() => setShowAlerts(true)}
                    className="w-full rounded-md py-2 text-xs font-semibold text-muted transition-colors hover:bg-sunken hover:text-ink"
                  >
                    {alerts.length - 3} more item{alerts.length - 3 === 1 ? '' : 's'}
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="flex flex-col items-center py-8 text-center">
                <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-positive-soft text-positive">
                  <CheckCircle2 size={18} />
                </span>
                <p className="text-[13px] font-semibold text-ink">Nothing needs attention</p>
                <p className="mt-1 text-xs text-muted">Every student in this class is on track.</p>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <AttendanceMatrix
        externalClassId={selectedClass}
        onExternalClassChange={setSelectedClass}
      />

      <Card className="overflow-hidden">
        <CardHeader
          actions={
            <div className="relative w-full sm:w-64">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or roll no"
                aria-label="Search students"
                className="h-9 w-full rounded-md border border-line bg-surface pl-8 pr-3 text-[13px] text-ink shadow-xs transition-colors placeholder:text-faint hover:border-line-strong focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/12"
              />
            </div>
          }
        >
          <h2 className="text-[15px] font-bold text-ink">Student list</h2>
          <p className="mt-0.5 text-xs text-muted">
            {filteredStudents.length} of {students.length} students
          </p>
        </CardHeader>

        <div className="overflow-x-auto">
          <Table className="min-w-[760px]">
            <THead>
              <tr>
                <Th>Student</Th>
                <Th>Roll no</Th>
                <Th align="center">Present</Th>
                <Th align="center">Absent</Th>
                <Th className="w-44">Attendance</Th>
                <Th align="right">Status</Th>
              </tr>
            </THead>
            <TBody>
              {filteredStudents.map((s) => {
                const pct = Number(s.attendance_pct) || 0;
                const tone =
                  s.zone === 'green' ? 'positive' : s.zone === 'yellow' ? 'caution' : 'negative';
                return (
                  <TR key={s.student_id}>
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={s.student_name} size="sm" tone="neutral" />
                        <span className="font-semibold text-ink">{s.student_name}</span>
                      </div>
                    </Td>
                    <Td className="whitespace-nowrap font-mono text-xs text-muted">{s.roll_no}</Td>
                    <Td align="center" className="tnum font-semibold text-positive">
                      {s.total_present}
                    </Td>
                    <Td align="center" className="tnum font-semibold text-negative">
                      {s.total_absent}
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <Progress value={pct} tone={tone} className="w-24" />
                        <span className="tnum text-xs font-bold text-ink">{pct}%</span>
                      </div>
                    </Td>
                    <Td align="right">
                      <Badge tone={tone}>
                        {s.zone === 'green' ? 'On track' : s.zone === 'yellow' ? 'Warning' : 'Critical'}
                      </Badge>
                    </Td>
                  </TR>
                );
              })}
              {filteredStudents.length === 0 ? (
                <TableEmpty
                  colSpan={6}
                  icon={search ? Search : UserRound}
                  title={search ? 'No matching students' : 'No students in this class'}
                  description={
                    search
                      ? 'Try a different name or roll number.'
                      : 'Add students to this class from the user directory.'
                  }
                />
              ) : null}
            </TBody>
          </Table>
        </div>
      </Card>

      <Modal
        open={showAlerts}
        onClose={() => setShowAlerts(false)}
        title="Action required"
        description={`${alerts.length} item${alerts.length === 1 ? '' : 's'} need attention in this class.`}
        size="lg"
        footer={
          <Button variant="secondary" onClick={() => setShowAlerts(false)}>
            Close
          </Button>
        }
      >
        <div className="space-y-2">
          {alerts.map((a, i) => (
            <AlertRow key={`modal-${a.title}-${i}`} alert={a} />
          ))}
        </div>
      </Modal>
    </div>
  );
}
