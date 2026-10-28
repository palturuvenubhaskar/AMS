import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Field,
  Input,
  PageHeader,
  Progress,
  Select,
  Textarea,
} from '../../components/ui';

const REASONS = ['Medical', 'Family Emergency', 'Personal', 'Event/Competition', 'Travel', 'Other'];

const OUTCOMES = {
  approved: {
    tone: 'positive',
    icon: CheckCircle2,
    title: 'Auto-approved',
    text: 'Your attendance is above 75%, so this leave was approved immediately.',
  },
  rejected: {
    tone: 'negative',
    icon: XCircle,
    title: 'Auto-rejected',
    text: 'Your attendance is below 40%. Leave cannot be granted automatically.',
  },
  pending: {
    tone: 'caution',
    icon: Clock,
    title: 'Waiting for review',
    text: 'Your attendance is between 40% and 75%, so a faculty member will decide.',
  },
};

export default function ApplyLeave() {
  const { user } = useAuth();
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [zonePreview, setZonePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);

  const classId = user?.studentInfo?.class_id;

  useEffect(() => {
    if (classId) {
      api
        .get(`/leave-requests/zone-preview?classId=${classId}`)
        .then((r) => setZonePreview(r.data))
        .catch(() => {});
    }
  }, [classId]);

  const submit = async (e) => {
    e.preventDefault();
    if (!fromDate || !toDate || !reason) return toast.error('Fill in the dates and reason');
    setSubmitting(true);
    try {
      const { data } = await api.post('/leave-requests', {
        classId,
        fromDate,
        toDate,
        reason,
        description,
      });
      setSubmitted(data);
      toast.success('Leave request submitted');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit');
    }
    setSubmitting(false);
  };

  if (submitted) {
    const outcome = OUTCOMES[submitted.status] ?? OUTCOMES.pending;
    const Icon = outcome.icon;
    const pct = Number(submitted.attendance_pct_snapshot) || 0;

    return (
      <div className="mx-auto max-w-lg space-y-6">
        <PageHeader eyebrow="Leave" title="Request submitted" />

        <Card>
          <CardBody className="flex flex-col items-center py-10 text-center">
            <span
              className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full ${
                outcome.tone === 'positive'
                  ? 'bg-positive-soft text-positive'
                  : outcome.tone === 'caution'
                    ? 'bg-caution-soft text-caution'
                    : 'bg-negative-soft text-negative'
              }`}
            >
              <Icon size={22} />
            </span>
            <h2 className="text-lg font-bold text-ink">{outcome.title}</h2>
            <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted">{outcome.text}</p>

            <div className="mt-6 w-full max-w-xs space-y-2">
              <div className="flex items-center justify-between text-xs">
                <Badge tone={outcome.tone}>
                  {submitted.zone === 'green'
                    ? 'Safe zone'
                    : submitted.zone === 'yellow'
                      ? 'Warning zone'
                      : 'Critical zone'}
                </Badge>
                <span className="tnum font-bold text-ink">{pct}%</span>
              </div>
              <Progress
                value={pct}
                tone={
                  outcome.tone === 'positive'
                    ? 'positive'
                    : outcome.tone === 'caution'
                      ? 'caution'
                      : 'negative'
                }
              />
            </div>

            <Button
              variant="primary"
              className="mt-8 w-full"
              onClick={() => {
                setSubmitted(null);
                setFromDate('');
                setToDate('');
                setReason('');
                setDescription('');
              }}
            >
              Submit another request
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Leave"
        title="Apply for leave"
        description="Your attendance zone decides whether the request is auto-approved, auto-rejected or sent to faculty."
      />

      {zonePreview ? (
        <Card>
          <div className="flex flex-wrap items-center gap-3 px-5 py-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[13px] font-bold text-ink">
                  Current attendance {zonePreview.attendancePct}%
                </span>
                <Badge
                  tone={
                    zonePreview.zone === 'green'
                      ? 'positive'
                      : zonePreview.zone === 'yellow'
                        ? 'caution'
                        : 'negative'
                  }
                >
                  {zonePreview.zone === 'green'
                    ? 'Auto-approval'
                    : zonePreview.zone === 'yellow'
                      ? 'Needs review'
                      : 'Auto-rejection'}
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-muted">{zonePreview.message}</p>
            </div>
            <Progress
              value={Number(zonePreview.attendancePct) || 0}
              tone={
                zonePreview.zone === 'green'
                  ? 'positive'
                  : zonePreview.zone === 'yellow'
                    ? 'caution'
                    : 'negative'
              }
              className="w-full sm:w-40"
            />
          </div>
        </Card>
      ) : null}

      <Card className="max-w-2xl">
        <CardHeader>
          <h2 className="text-[15px] font-bold text-ink">Request details</h2>
          <p className="mt-0.5 text-xs text-muted">Dates are inclusive of both ends.</p>
        </CardHeader>
        <CardBody>
          <form onSubmit={submit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="From" htmlFor="leave-from" required>
                <Input
                  id="leave-from"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  required
                />
              </Field>
              <Field label="To" htmlFor="leave-to" required>
                <Input
                  id="leave-to"
                  type="date"
                  value={toDate}
                  min={fromDate || undefined}
                  onChange={(e) => setToDate(e.target.value)}
                  required
                />
              </Field>
            </div>

            <Field label="Reason" htmlFor="leave-reason" required>
              <Select
                id="leave-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              >
                <option value="">Select a reason…</option>
                {REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="Description"
              htmlFor="leave-description"
              hint="Optional — anything faculty should know before deciding."
            >
              <Textarea
                id="leave-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add details…"
              />
            </Field>

            <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit leave request'}
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
