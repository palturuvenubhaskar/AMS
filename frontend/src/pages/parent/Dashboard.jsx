import { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import api from '../../services/api';
import {
  Avatar,
  Badge,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
  PageLoader,
  Progress,
} from '../../components/ui';

const zoneMeta = {
  green: { tone: 'positive', label: 'Safe zone' },
  yellow: { tone: 'caution', label: 'Warning zone' },
  red: { tone: 'negative', label: 'Critical zone' },
};

export default function ParentDashboard() {
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/parents/ward-summary')
      .then((res) => setWards(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader label="Loading your wards" />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Parent portal"
        title="My wards"
        description="Attendance standing for each child linked to your account."
        actions={wards.length > 0 ? <Badge tone="outline">{wards.length} linked</Badge> : null}
      />

      {wards.length === 0 ? (
        <Card>
          <EmptyState
            icon={Users}
            title="No wards linked"
            description="Ask the college office to link your child's roll number to this account."
          />
        </Card>
      ) : (
        <div className="stagger grid gap-4 sm:grid-cols-2">
          {wards.map((ward, idx) => {
            const attendance = ward.attendance || {};
            const pct = Number(attendance.attendance_pct) || 0;
            const zone = zoneMeta[attendance.zone] ?? { tone: 'neutral', label: 'Unknown' };

            return (
              <Card key={ward.roll_no || idx}>
                <CardHeader actions={<Badge tone={zone.tone} dot>{zone.label}</Badge>}>
                  <div className="flex items-center gap-3">
                    <Avatar name={ward.full_name} size="lg" tone="neutral" />
                    <div className="min-w-0">
                      <h2 className="truncate text-[15px] font-bold text-ink">{ward.full_name}</h2>
                      <p className="mt-0.5 text-xs text-muted">
                        <span className="font-mono">{ward.roll_no}</span>
                        <span className="mx-1.5 text-faint">·</span>
                        {ward.class_name}-{ward.section}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardBody className="space-y-4">
                  <div className="flex items-baseline gap-2">
                    <span className="tnum text-[30px] font-bold leading-none tracking-tight text-ink">
                      {pct}%
                    </span>
                    <span className="text-xs font-medium text-muted">attendance</span>
                  </div>
                  <Progress value={pct} tone={zone.tone} />

                  <dl className="grid grid-cols-3 divide-x divide-line rounded-md border border-line">
                    {[
                      ['Classes', attendance.total_classes || 0, 'text-ink'],
                      ['Present', attendance.present_classes || 0, 'text-positive'],
                      ['Absent', attendance.absent_classes || 0, 'text-negative'],
                    ].map(([label, value, tone]) => (
                      <div key={label} className="px-3 py-2.5 text-center">
                        <dd className={`tnum text-[15px] font-bold leading-none ${tone}`}>{value}</dd>
                        <dt className="mt-1 text-2xs font-bold uppercase tracking-[0.08em] text-faint">
                          {label}
                        </dt>
                      </div>
                    ))}
                  </dl>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
