import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Check, ShieldAlert, X } from 'lucide-react';
import api from '../../services/api';
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Modal,
  PageHeader,
  PageLoader,
  Table,
  TableEmpty,
  TBody,
  Td,
  Textarea,
  Th,
  THead,
  TR,
} from '../../components/ui';

export default function DisputesInbox() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(null); // { dispute, status }
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get('/attendance-disputes/pending')
      .then((res) => setDisputes(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fetchDisputes = () =>
    api
      .get('/attendance-disputes/pending')
      .then((res) => setDisputes(res.data))
      .catch(() => {});

  const openDecision = (dispute, status) => {
    setPending({ dispute, status });
    setRemarks('');
  };

  const confirmDecision = async () => {
    if (!pending) return;
    setSaving(true);
    try {
      await api.put(`/attendance-disputes/${pending.dispute.id}/resolve`, {
        status: pending.status,
        remarks,
      });
      toast.success(`Marked as ${pending.status}`);
      setPending(null);
      fetchDisputes();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to resolve dispute.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader label="Loading disputes" />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Requests"
        title="Disputes inbox"
        description="Student appeals against a marked absence. Approving converts the day to present."
        actions={
          disputes.length > 0 ? (
            <Badge tone="caution" dot>
              {disputes.length} pending
            </Badge>
          ) : null
        }
      />

      <Card className="overflow-hidden">
        {disputes.length === 0 ? (
          <EmptyState
            icon={ShieldAlert}
            title="Inbox clear"
            description="No attendance disputes are waiting for your review."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[960px]">
              <THead>
                <tr>
                  <Th>Session</Th>
                  <Th>Student</Th>
                  <Th>Subject</Th>
                  <Th>Type</Th>
                  <Th>Reason</Th>
                  <Th align="right">Decision</Th>
                </tr>
              </THead>
              <TBody>
                {disputes.map((d) => (
                  <TR key={d.id}>
                    <Td className="whitespace-nowrap">
                      <p className="font-semibold text-ink">
                        {new Date(d.date).toLocaleDateString('en', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </p>
                      <p className="tnum mt-0.5 text-xs text-faint">{d.time_slot}</p>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={d.student_name} size="sm" tone="neutral" />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-ink">{d.student_name}</p>
                          <p className="font-mono text-2xs text-faint">{d.roll_no}</p>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <p className="font-medium text-ink">{d.subject_name}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        {d.class_name}-{d.section}
                      </p>
                    </Td>
                    <Td>
                      <Badge tone={d.type === 'dispute' ? 'negative' : 'info'}>
                        {d.type === 'dispute' ? 'Dispute' : 'Justification'}
                      </Badge>
                    </Td>
                    <Td className="max-w-[260px]">
                      <p className="line-clamp-2 text-muted" title={d.reason}>
                        {d.reason}
                      </p>
                      {d.proof_url ? (
                        <a
                          href={d.proof_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-block text-xs font-semibold text-accent hover:underline underline-offset-4"
                        >
                          View proof
                        </a>
                      ) : null}
                    </Td>
                    <Td align="right">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="xs" variant="secondary" onClick={() => openDecision(d, 'approved')}>
                          <Check size={12} /> Approve
                        </Button>
                        <Button size="xs" variant="danger" onClick={() => openDecision(d, 'rejected')}>
                          <X size={12} /> Reject
                        </Button>
                      </div>
                    </Td>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        )}
      </Card>

      <Modal
        open={!!pending}
        onClose={() => setPending(null)}
        title={pending?.status === 'approved' ? 'Approve dispute' : 'Reject dispute'}
        description={
          pending
            ? `${pending.dispute.student_name} · ${pending.dispute.subject_name} · ${new Date(
                pending.dispute.date
              ).toLocaleDateString()}`
            : undefined
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setPending(null)}>
              Cancel
            </Button>
            <Button
              variant={pending?.status === 'approved' ? 'primary' : 'danger-solid'}
              onClick={confirmDecision}
              disabled={saving}
            >
              {saving ? 'Saving…' : pending?.status === 'approved' ? 'Approve' : 'Reject'}
            </Button>
          </>
        }
      >
        <label htmlFor="dispute-remarks" className="mb-1.5 block text-xs font-semibold text-body">
          Remarks <span className="font-normal text-faint">(optional)</span>
        </label>
        <Textarea
          id="dispute-remarks"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Explain the decision for the student…"
          rows={4}
        />
      </Modal>
    </div>
  );
}
