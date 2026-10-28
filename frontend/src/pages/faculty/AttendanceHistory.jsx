import { useState, useEffect } from 'react';
import { History } from 'lucide-react';
import api from '../../services/api';
import {
  Badge,
  Card,
  PageHeader,
  PageLoader,
  Select,
  Table,
  TBody,
  Td,
  Th,
  THead,
  TR,
  TableEmpty,
} from '../../components/ui';

const statusTone = { closed: 'positive', active: 'caution', cancelled: 'negative' };

export default function AttendanceHistory() {
  const [sessions, setSessions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [classFilter, setClassFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/classes').then((r) => setClasses(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = classFilter ? `?classId=${classFilter}` : '';
    api
      .get(`/attendance-sessions${params}`)
      .then(({ data }) => setSessions(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [classFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Teaching"
        title="Attendance history"
        description="Every session recorded for your classes, newest first."
        actions={
          <Select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="w-[220px]"
            aria-label="Filter by class"
          >
            <option value="">All classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}-{c.section}
              </option>
            ))}
          </Select>
        }
      />

      <Card className="overflow-hidden">
        {loading ? (
          <PageLoader label="Loading sessions" />
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[900px]">
              <THead>
                <tr>
                  <Th>Date</Th>
                  <Th>Class</Th>
                  <Th>Subject</Th>
                  <Th>Slot</Th>
                  <Th>Mode</Th>
                  <Th>Faculty</Th>
                  <Th align="center">Present</Th>
                  <Th align="center">Absent</Th>
                  <Th align="right">Status</Th>
                </tr>
              </THead>
              <TBody>
                {sessions.map((s) => (
                  <TR key={s.id}>
                    <Td className="whitespace-nowrap font-semibold text-ink">
                      {new Date(s.date).toLocaleDateString('en', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Td>
                    <Td className="whitespace-nowrap">
                      {s.class_name}-{s.section}
                    </Td>
                    <Td className="font-medium text-ink">{s.subject_name}</Td>
                    <Td className="whitespace-nowrap tnum text-muted">{s.time_slot}</Td>
                    <Td>
                      <Badge tone={s.mode === 'frs' ? 'accent' : 'info'}>
                        {s.mode === 'frs' ? 'Face scan' : 'Manual'}
                      </Badge>
                    </Td>
                    <Td className="whitespace-nowrap">{s.faculty_name}</Td>
                    <Td align="center" className="tnum font-semibold text-positive">
                      {s.present_count}
                    </Td>
                    <Td align="center" className="tnum font-semibold text-negative">
                      {s.absent_count}
                    </Td>
                    <Td align="right">
                      <Badge tone={statusTone[s.status] ?? 'neutral'}>{s.status}</Badge>
                    </Td>
                  </TR>
                ))}
                {sessions.length === 0 ? (
                  <TableEmpty
                    colSpan={9}
                    icon={History}
                    title="No sessions yet"
                    description="Sessions appear here once you start taking attendance."
                  />
                ) : null}
              </TBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
