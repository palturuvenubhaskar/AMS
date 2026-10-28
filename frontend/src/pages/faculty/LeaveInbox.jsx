import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Check, Inbox, X } from 'lucide-react';
import api from '../../services/api';
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  EmptyState,
  Input,
  PageHeader,
  PageLoader,
  Progress,
} from '../../components/ui';
import { cn } from '../../components/ui/cn';

function Field({ label, children }) {
  return (
    <div className="min-w-0">
      <p className="text-2xs font-bold uppercase tracking-[0.1em] text-faint">{label}</p>
      <div className="mt-1 text-[13px] font-semibold text-ink">{children}</div>
    </div>
  );
}

export default function LeaveInbox() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState({});
  const [selected, setSelected] = useState(new Set());
  const [bulkRemarks, setBulkRemarks] = useState('');

  useEffect(() => {
    api
      .get('/leave-requests/pending')
      .then(({ data }) => setLeaves(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fetchPending = async () => {
    try {
      const { data } = await api.get('/leave-requests/pending');
      setLeaves(data);
      setSelected(new Set());
      setRemarks({});
    } catch {
      /* keep the current list on failure */
    }
  };

  const review = async (id, status) => {
    try {
      await api.put(`/leave-requests/${id}`, { status, remarks: remarks[id] || '' });
      toast.success(`Leave ${status}`);
      fetchPending();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Could not update the request');
    }
  };

  const bulkReview = async (status) => {
    if (selected.size === 0) return;
    try {
      await api.put('/leave-requests/bulk-review', {
        leaveIds: Array.from(selected),
        status,
        remarks: bulkRemarks,
      });
      toast.success(`${selected.size} request${selected.size === 1 ? '' : 's'} ${status}`);
      setBulkRemarks('');
      fetchPending();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Bulk review failed');
    }
  };

  const toggleSelect = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const allSelected = leaves.length > 0 && selected.size === leaves.length;

  if (loading) return <PageLoader label="Loading leave requests" />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Requests"
        title="Leave inbox"
        description="Yellow-zone leave requests (40–75% attendance) waiting for a decision."
        actions={
          leaves.length > 0 ? <Badge tone="caution" dot>{leaves.length} pending</Badge> : null
        }
      />

      {leaves.length === 0 ? (
        <Card>
          <EmptyState
            icon={Inbox}
            title="No pending requests"
            description="Every yellow-zone leave request has been reviewed."
          />
        </Card>
      ) : (
        <>
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
              <label className="flex cursor-pointer items-center gap-2.5 text-[13px] font-semibold text-body">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => {
                    setSelected(e.target.checked ? new Set(leaves.map((l) => l.id)) : new Set());
                  }}
                  className="h-4 w-4 rounded border-line-strong text-accent accent-accent"
                />
                Select all
                <span className="font-normal text-muted">
                  {selected.size} of {leaves.length} selected
                </span>
              </label>

              {selected.size > 0 ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    value={bulkRemarks}
                    onChange={(e) => setBulkRemarks(e.target.value)}
                    placeholder="Remarks applied to all…"
                    className="w-56"
                    aria-label="Bulk remarks"
                  />
                  <Button size="sm" variant="primary" onClick={() => bulkReview('approved')}>
                    <Check size={13} /> Approve {selected.size}
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => bulkReview('rejected')}>
                    <X size={13} /> Reject {selected.size}
                  </Button>
                </div>
              ) : null}
            </div>
          </Card>

          <div className="space-y-3">
            {leaves.map((l) => {
              const pct = Number(l.attendance_pct_snapshot) || 0;
              const isSelected = selected.has(l.id);
              return (
                <Card
                  key={l.id}
                  className={cn(
                    'transition-colors duration-150',
                    isSelected ? 'border-accent/40 ring-1 ring-accent/20' : undefined
                  )}
                >
                  <CardBody className="space-y-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(l.id)}
                        aria-label={`Select ${l.student_name}`}
                        className="mt-1 h-4 w-4 shrink-0 rounded border-line-strong text-accent accent-accent"
                      />
                      <Avatar name={l.student_name} size="sm" tone="neutral" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-[14px] font-bold text-ink">
                            {l.student_name}
                          </h3>
                          <span className="font-mono text-2xs text-faint">{l.roll_no}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted">
                          {l.class_name}-{l.section}
                        </p>
                      </div>
                      <Badge tone="caution">Yellow zone · {pct}%</Badge>
                    </div>

                    <div className="grid gap-4 rounded-md border border-line bg-sunken/60 px-4 py-3 sm:grid-cols-2 lg:grid-cols-4">
                      <Field label="From">
                        {new Date(l.from_date).toLocaleDateString('en', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </Field>
                      <Field label="To">
                        {new Date(l.to_date).toLocaleDateString('en', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </Field>
                      <Field label="Reason">{l.reason}</Field>
                      <Field label="Attendance at request">
                        <div className="flex items-center gap-2">
                          <Progress value={pct} tone="caution" className="w-20" />
                          <span className="tnum">{pct}%</span>
                        </div>
                      </Field>
                    </div>

                    {l.description ? (
                      <p className="border-l-2 border-line-strong pl-3 text-[13px] italic text-muted">
                        “{l.description}”
                      </p>
                    ) : null}

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <Input
                        value={remarks[l.id] || ''}
                        onChange={(e) => setRemarks((p) => ({ ...p, [l.id]: e.target.value }))}
                        placeholder="Add remarks (optional)…"
                        className="flex-1"
                        aria-label={`Remarks for ${l.student_name}`}
                      />
                      <div className="flex gap-2">
                        <Button variant="primary" onClick={() => review(l.id, 'approved')}>
                          <Check size={13} /> Approve
                        </Button>
                        <Button variant="danger" onClick={() => review(l.id, 'rejected')}>
                          <X size={13} /> Reject
                        </Button>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
