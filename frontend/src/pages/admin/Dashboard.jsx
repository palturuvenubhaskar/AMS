import { useState, useEffect } from 'react';
import {
  BookOpen,
  Building2,
  GraduationCap,
  UserRound,
  Users,
} from 'lucide-react';
import api from '../../services/api';
import AttendanceMatrix from '../faculty/AttendanceMatrix';
import AnimatedNumber from '../../components/ui/AnimatedNumber';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import { PageLoader } from '../../components/ui';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    departments: 0,
    classes: 0,
    subjects: 0,
    faculty: 0,
    students: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/departments'),
      api.get('/classes'),
      api.get('/subjects'),
      api.get('/users?role=faculty'),
      api.get('/users?role=student'),
    ])
      .then(([d, c, s, f, st]) => {
        setStats({
          departments: d.data.length,
          classes: c.data.length,
          subjects: s.data.length,
          faculty: f.data.length,
          students: st.data.length,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader label="Loading system metrics" />;

  const cards = [
    {
      label: 'Departments',
      value: stats.departments,
      icon: Building2,
      tone: 'accent',
      hint: 'Academic units',
    },
    {
      label: 'Classes',
      value: stats.classes,
      icon: GraduationCap,
      tone: 'info',
      hint: 'Sections running',
    },
    {
      label: 'Subjects',
      value: stats.subjects,
      icon: BookOpen,
      tone: 'positive',
      hint: 'In the catalogue',
    },
    {
      label: 'Faculty',
      value: stats.faculty,
      icon: Users,
      tone: 'caution',
      hint: 'Teaching accounts',
    },
    {
      label: 'Students',
      value: stats.students,
      icon: UserRound,
      tone: 'neutral',
      hint: 'Enrolled this year',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Overview"
        title="System overview"
        description="Live counts across the institution, with the current attendance register below."
      />

      <div className="stagger grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        {cards.map((card) => (
          <StatCard
            key={card.label}
            label={card.label}
            hint={card.hint}
            icon={card.icon}
            tone={card.tone}
            value={<AnimatedNumber value={card.value} />}
          />
        ))}
      </div>

      <AttendanceMatrix />
    </div>
  );
}
