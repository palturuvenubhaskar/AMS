import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import {
  AnimatedNumber,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
  PageLoader,
  Progress,
  StatCard,
} from '../../components/ui';

export default function Projections() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/dashboard/predictions/${user?.id}`)
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <PageLoader label="Running projections" />;

  if (!data) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Academics" title="Attendance projections" />
        <Card>
          <EmptyState
            icon={Target}
            title="Not enough data yet"
            description="Projections need a few marked sessions before they mean anything."
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Academics"
        title="Attendance projections"
        description="Where your attendance lands if the rest of the semester goes well — or badly."
      />

      <div className="stagger grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Classes held"
          value={<AnimatedNumber value={data.totalConducted || 0} />}
          icon={CalendarDays}
          tone="neutral"
          hint="So far this semester"
        />
        <StatCard
          label="Classes remaining"
          value={<AnimatedNumber value={data.remainingClasses || 0} />}
          icon={CalendarDays}
          tone="info"
          hint="Estimated until the end"
        />
        <StatCard
          label="Best case"
          value={`${data.maxPossiblePct}%`}
          icon={TrendingUp}
          tone="positive"
          hint="Attend everything left"
        />
        <StatCard
          label="Worst case"
          value={`${data.minPossiblePct}%`}
          icon={TrendingDown}
          tone="negative"
          hint="Miss everything left"
        />
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-[15px] font-bold text-ink">The 75% target</h2>
          <p className="mt-0.5 text-xs text-muted">
            The minimum attendance most institutions require to sit exams.
          </p>
        </CardHeader>
        <CardBody className="space-y-5">
          <div>
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-[13px] text-body">
                Attend{' '}
                <strong className="tnum text-base font-bold text-ink">
                  {data.requiredFor75}
                </strong>{' '}
                more of the {data.remainingClasses} remaining classes to reach 75%.
              </p>
              <span className="text-2xs font-bold uppercase tracking-[0.08em] text-faint">
                Goal 75%
              </span>
            </div>
            <Progress
              value={
                data.remainingClasses
                  ? Math.min(100, (data.safeToBunk / Math.max(data.remainingClasses, 1)) * 100)
                  : 0
              }
              tone={data.canReach75 ? 'positive' : 'negative'}
            />
          </div>

          {data.canReach75 && data.safeToBunk > 0 ? (
            <div className="flex items-start gap-3 rounded-md border border-positive/20 bg-positive-soft px-4 py-3">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-positive" />
              <div>
                <p className="text-[13px] font-bold text-positive">Safe margin</p>
                <p className="mt-0.5 text-xs text-body">
                  You can miss{' '}
                  <strong className="tnum font-bold">{data.safeToBunk}</strong> classes and still
                  stay at or above 75%.
                </p>
              </div>
            </div>
          ) : null}

          {!data.canReach75 ? (
            <div className="flex items-start gap-3 rounded-md border border-negative/20 bg-negative-soft px-4 py-3">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-negative" />
              <div>
                <p className="text-[13px] font-bold text-negative">75% is out of reach</p>
                <p className="mt-0.5 text-xs text-body">
                  Even attending every remaining class will not get you there. Contact your HOD
                  about condonation.
                </p>
              </div>
            </div>
          ) : null}

          {data.canReach75 && !data.safeToBunk ? (
            <div className="flex items-start gap-3 rounded-md border border-caution/20 bg-caution-soft px-4 py-3">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-caution" />
              <div>
                <p className="text-[13px] font-bold text-caution">No margin left</p>
                <p className="mt-0.5 text-xs text-body">
                  You are exactly on the line — every remaining class counts.
                </p>
              </div>
            </div>
          ) : null}
        </CardBody>
      </Card>
    </div>
  );
}
