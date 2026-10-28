import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileWarning,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import {
  AnimatedNumber,
  Badge,
  Button,
  Card,
  CardHeader,
  Field,
  Input,
  Modal,
  PageHeader,
  PageLoader,
  Progress,
  Select,
  StatCard,
  Table,
  TableEmpty,
  TBody,
  Td,
  Textarea,
  Th,
  THead,
  TR,
} from '../../components/ui';

const ZONES = {
  green: {
    tone: 'positive',
    icon: CheckCircle2,
    title: 'Safe zone',
    text: 'At or above 75% — leave requests are auto-approved.',
  },
  yellow: {
    tone: 'caution',
    icon: AlertTriangle,
    title: 'Warning zone',
    text: 'Between 40% and 74% — leave requests need faculty review.',
  },
  red: {
    tone: 'negative',
    icon: XCircle,
    title: 'Critical zone',
    text: 'Below 40% — leave is auto-rejected. Attendance needs immediate attention.',
  },
};

const statusTone = { present: 'positive', absent: 'negative', on_leave: 'caution' };

const emptyForm = { open: false, record: null, type: 'justification', reason: '', proofUrl: '' };

export default function MyAttendance() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sumRes, recRes] = await Promise.all([
        api.get('/students/me/attendance/summary').catch(() => ({ data: {} })),
        api.get('/students/me/attendance').catch(() => ({ data: [] })),
      ]);
      setSummary(sumRes.data);
      setRecords(recRes.data);
    } catch {
      /* empty states cover this */
    }
    setLoading(false);
  };

  const handleDisputeSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/attendance-records/${form.record.id}/disputes`, {
        type: form.type,
        reason: form.reason,
        proofUrl: form.proofUrl || '',
      });
      toast.success('Appeal submitted');
      setForm(emptyForm);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not submit the appeal');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageLoader label="Loading your attendance" />;

  const pct = Number(summary?.attendance_pct) || 0;
  const sessionCount =
    (Number(summary?.total_present) || 0) +
    (Number(summary?.total_absent) || 0) +
    (Number(summary?.total_on_leave) || 0);
  const hasSessions = sessionCount > 0;
  const zoneKey = summary?.zone || (pct >= 75 ? 'green' : pct >= 40 ? 'yellow' : 'red');
  const zone = hasSessions
    ? ZONES[zoneKey] ?? ZONES.red
    : { tone: 'neutral', icon: Clock, title: 'No sessions yet', text: 'Your zone appears once your first class is marked.' };
  const ZoneIcon = zone.icon;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Academics"
        title="My attendance"
        description={
          <>
            {user?.studentInfo?.class_name}-{user?.studentInfo?.section}
            <span className="mx-2 text-faint">·</span>
            Roll no{' '}
            <span className="font-mono text-body">{user?.studentInfo?.roll_no}</span>
          </>
        }
      />

      <div className="stagger grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Attendance rate"
          value={`${pct}%`}
          icon={TrendingUp}
          tone={zone.tone}
          hint="Target: 75%"
        />
        <StatCard
          label="Classes present"
          value={<AnimatedNumber value={summary?.total_present || 0} />}
          icon={CheckCircle2}
          tone="positive"
          hint="Sessions attended"
        />
        <StatCard
          label="Classes absent"
          value={<AnimatedNumber value={summary?.total_absent || 0} />}
          icon={XCircle}
          tone="negative"
          hint="Sessions missed"
        />
        <StatCard
          label="Approved leaves"
          value={<AnimatedNumber value={summary?.total_on_leave || 0} />}
          icon={Clock}
          tone="caution"
          hint="Excused sessions"
        />
      </div>

      <Card>
        <div className="flex flex-wrap items-start gap-3 p-5">
          <span
            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
              zone.tone === 'positive'
                ? 'bg-positive-soft text-positive'
                : zone.tone === 'caution'
                  ? 'bg-caution-soft text-caution'
                  : zone.tone === 'negative'
                    ? 'bg-negative-soft text-negative'
                    : 'bg-sunken text-muted'
            }`}
          >
            <ZoneIcon size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[13px] font-bold text-ink">{zone.title}</h2>
              {hasSessions ? <Badge tone={zone.tone}>{pct}%</Badge> : null}
            </div>
            <p className="mt-0.5 text-xs text-muted">{zone.text}</p>
            {hasSessions ? (
              <div className="mt-3">
                <Progress value={pct} tone={zone.tone} />
              </div>
            ) : null}
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader
          actions={records.length > 0 ? <Badge tone="outline">{records.length} records</Badge> : null}
        >
          <h2 className="text-[15px] font-bold text-ink">Attendance history</h2>
          <p className="mt-0.5 text-xs text-muted">
            Every session recorded for your class. Appeal an absence within the review window.
          </p>
        </CardHeader>

        <div className="overflow-x-auto">
          <Table className="min-w-[760px]">
            <THead>
              <tr>
                <Th>Date &amp; time</Th>
                <Th>Subject</Th>
                <Th>Faculty</Th>
                <Th align="center">Mode</Th>
                <Th align="right">Status</Th>
              </tr>
            </THead>
            <TBody>
              {records.map((r) => (
                <TR key={r.id}>
                  <Td className="whitespace-nowrap">
                    <p className="font-semibold text-ink">
                      {new Date(r.date).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="tnum mt-0.5 inline-flex items-center gap-1 text-xs text-faint">
                      <Clock size={11} /> {r.time_slot}
                    </p>
                  </Td>
                  <Td className="font-medium text-ink">{r.subject_name}</Td>
                  <Td>{r.faculty_name}</Td>
                  <Td align="center">
                    <Badge tone={r.mode === 'frs' ? 'accent' : 'info'}>
                      {r.mode === 'frs' ? 'Face scan' : 'Manual'}
                    </Badge>
                  </Td>
                  <Td align="right">
                    <div className="flex items-center justify-end gap-2">
                      <Badge tone={statusTone[r.status] ?? 'neutral'}>
                        {r.status === 'on_leave' ? 'On leave' : r.status}
                      </Badge>
                      {r.status === 'absent' ? (
                        <Button
                          size="xs"
                          variant="secondary"
                          onClick={() =>
                            setForm({
                              open: true,
                              record: r,
                              type: 'justification',
                              reason: '',
                              proofUrl: '',
                            })
                          }
                        >
                          Appeal
                        </Button>
                      ) : null}
                    </div>
                  </Td>
                </TR>
              ))}
              {records.length === 0 ? (
                <TableEmpty
                  colSpan={5}
                  icon={CalendarDays}
                  title="No attendance yet"
                  description="Records show up here after your first marked session."
                />
              ) : null}
            </TBody>
          </Table>
        </div>
      </Card>

      <Modal
        open={form.open}
        onClose={() => setForm(emptyForm)}
        title="Appeal an absence"
        description={
          form.record
            ? `${new Date(form.record.date).toLocaleDateString()} · ${form.record.subject_name}`
            : undefined
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setForm(emptyForm)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleDisputeSubmit} disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit appeal'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleDisputeSubmit} className="space-y-4">
          <Field label="Appeal type" htmlFor="appeal-type" hint="Justify keeps the leave count; dispute asks for the absence to be removed.">
            <Select
              id="appeal-type"
              value={form.type}
              onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
            >
              <option value="justification">Justify — convert to leave</option>
              <option value="dispute">Dispute — mark as present</option>
            </Select>
          </Field>

          <Field label="Reason" htmlFor="appeal-reason" required>
            <Textarea
              id="appeal-reason"
              required
              rows={3}
              placeholder="Explain what happened…"
              value={form.reason}
              onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}
            />
          </Field>

          <Field label="Proof URL" htmlFor="appeal-proof" hint="Optional — link to a medical note or similar.">
            <Input
              id="appeal-proof"
              type="url"
              placeholder="https://…"
              value={form.proofUrl}
              onChange={(e) => setForm((prev) => ({ ...prev, proofUrl: e.target.value }))}
            />
          </Field>

          <p className="flex items-start gap-2 text-xs text-faint">
            <FileWarning size={13} className="mt-0.5 shrink-0" />
            Repeated false appeals may be reviewed by your department.
          </p>
        </form>
      </Modal>
    </div>
  );
}
