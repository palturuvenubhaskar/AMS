import { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import api from '../../services/api';
import {
  Badge,
  Card,
  PageHeader,
  Table,
  TableEmpty,
  TBody,
  Td,
  Th,
  THead,
  TR,
} from '../../components/ui';

const zoneTone = { green: 'positive', yellow: 'caution', red: 'negative' };
const statusTone = { approved: 'positive', rejected: 'negative', pending: 'caution' };

const fmt = (value) =>
  new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

export default function LeaveHistory() {
  const [leaves, setLeaves] = useState([]);

  useEffect(() => {
    api.get('/leave-requests/my').then((r) => setLeaves(r.data)).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Leave"
        title="My leave requests"
        description="Every request you have submitted, with the faculty decision and remarks."
        actions={leaves.length > 0 ? <Badge tone="outline">{leaves.length} total</Badge> : null}
      />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-[900px]">
            <THead>
              <tr>
                <Th>From</Th>
                <Th>To</Th>
                <Th>Reason</Th>
                <Th align="center">Zone</Th>
                <Th align="center">Attendance</Th>
                <Th align="center">Status</Th>
                <Th>Decided by</Th>
                <Th>Remarks</Th>
              </tr>
            </THead>
            <TBody>
              {leaves.map((l) => (
                <TR key={l.id}>
                  <Td className="whitespace-nowrap font-semibold text-ink">{fmt(l.from_date)}</Td>
                  <Td className="whitespace-nowrap font-semibold text-ink">{fmt(l.to_date)}</Td>
                  <Td>{l.reason}</Td>
                  <Td align="center">
                    <Badge tone={zoneTone[l.zone] ?? 'neutral'}>{l.zone}</Badge>
                  </Td>
                  <Td align="center" className="tnum font-semibold text-ink">
                    {l.attendance_pct_snapshot}%
                  </Td>
                  <Td align="center">
                    <Badge tone={statusTone[l.status] ?? 'neutral'}>{l.status}</Badge>
                  </Td>
                  <Td className="text-xs text-muted">{l.decision_by || '—'}</Td>
                  <Td className="max-w-[220px] text-xs text-muted">
                    <span className="line-clamp-2" title={l.remarks || undefined}>
                      {l.remarks || '—'}
                    </span>
                  </Td>
                </TR>
              ))}
              {leaves.length === 0 ? (
                <TableEmpty
                  colSpan={8}
                  icon={FileText}
                  title="No requests yet"
                  description="Leave you apply for will appear here with its outcome."
                />
              ) : null}
            </TBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
