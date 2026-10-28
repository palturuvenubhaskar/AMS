import { useState, useEffect } from 'react';
import { Camera, Check, GraduationCap, Users } from 'lucide-react';
import api from '../../services/api';
import FaceEnrollmentModal from '../../components/FaceEnrollmentModal';
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
  Progress,
  Table,
  TableEmpty,
  TBody,
  Td,
  Th,
  THead,
  TR,
} from '../../components/ui';
import { cn } from '../../components/ui/cn';

const zoneTone = { green: 'positive', yellow: 'caution', red: 'negative' };

export default function FacultyClasses() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [faceStatuses, setFaceStatuses] = useState({});
  const [enrollingStudent, setEnrollingStudent] = useState(null);

  useEffect(() => {
    api.get('/classes').then((r) => setClasses(r.data)).catch(() => {});
  }, []);

  const loadFaceStatus = async (classId) => {
    try {
      const res = await api.get(`/classes/${classId}/face-status`);
      const map = {};
      (res.data.students || []).forEach((s) => {
        map[s.studentId] = s;
      });
      setFaceStatuses(map);
    } catch {
      /* status is decorative — the roster still works without it */
    }
  };

  const viewStudents = async (classId) => {
    setSelectedClass(classId);
    try {
      const { data } = await api.get(`/classes/${classId}/students`);
      setStudents(data);
    } catch {
      setStudents([]);
    }
    loadFaceStatus(classId);
  };

  const enrolled = Object.values(faceStatuses).filter((s) => s.isEnrolled).length;
  const selected = classes.find((c) => c.id === selectedClass);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Teaching"
        title="My classes"
        description="Open a class to see its roster, attendance standing and face-ID coverage."
      />

      <div className="stagger grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {classes.map((c) => {
          const active = selectedClass === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => viewStudents(c.id)}
              className={cn(
                'rounded-lg border bg-surface p-4 text-left shadow-xs transition-colors duration-150',
                active
                  ? 'border-accent ring-1 ring-accent/30'
                  : 'border-line hover:border-line-strong'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-2xs font-bold uppercase tracking-[0.1em] text-faint">
                    {c.department_code || 'Class'}
                  </p>
                  <h3 className="mt-1 truncate text-[15px] font-bold text-ink">
                    {c.name}-{c.section}
                  </h3>
                  <p className="mt-0.5 text-xs text-muted">
                    Semester {c.semester} · {c.academic_year}
                  </p>
                </div>
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
                    active ? 'bg-accent text-accent-ink' : 'bg-sunken text-faint'
                  )}
                >
                  <GraduationCap size={16} />
                </span>
              </div>
              <p className="mt-4 flex items-baseline gap-1.5">
                <span className="tnum text-[22px] font-bold leading-none text-ink">
                  {c.student_count ?? 0}
                </span>
                <span className="text-xs font-medium text-muted">students</span>
              </p>
            </button>
          );
        })}
        {classes.length === 0 ? (
          <Card className="sm:col-span-2 xl:col-span-3">
            <EmptyState
              icon={GraduationCap}
              title="No classes assigned"
              description="An administrator needs to assign you to a class before students appear here."
            />
          </Card>
        ) : null}
      </div>

      {selectedClass ? (
        <Card className="overflow-hidden">
          <CardHeader
            actions={
              students.length > 0 ? (
                <Badge tone={enrolled === students.length ? 'positive' : 'caution'} dot>
                  {enrolled}/{students.length} face IDs
                </Badge>
              ) : null
            }
          >
            <h2 className="text-[15px] font-bold text-ink">
              {selected ? `${selected.name}-${selected.section}` : 'Class'} roster
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              Enrol a student&apos;s face once; door scanners reuse it for every session.
            </p>
          </CardHeader>

          <div className="overflow-x-auto">
            <Table className="min-w-[860px]">
              <THead>
                <tr>
                  <Th className="w-12">#</Th>
                  <Th>Student</Th>
                  <Th>Roll no</Th>
                  <Th>Face ID</Th>
                  <Th align="center">Present</Th>
                  <Th align="center">Absent</Th>
                  <Th className="w-40">Attendance</Th>
                  <Th align="right">Zone</Th>
                </tr>
              </THead>
              <TBody>
                {students.map((s, i) => {
                  const status = faceStatuses[s.id];
                  const pct = Number(s.attendance_pct) || 0;
                  return (
                    <TR key={s.id}>
                      <Td className="tnum text-xs text-faint">{i + 1}</Td>
                      <Td>
                        <div className="flex items-center gap-2.5">
                          <Avatar name={s.full_name} size="sm" tone="neutral" />
                          <span className="font-semibold text-ink">{s.full_name}</span>
                        </div>
                      </Td>
                      <Td className="whitespace-nowrap font-mono text-xs text-muted">{s.roll_no}</Td>
                      <Td>
                        {status?.isEnrolled ? (
                          <Badge tone="positive">
                            <Check size={11} /> Enrolled
                          </Badge>
                        ) : (
                          <Button
                            size="xs"
                            variant="secondary"
                            onClick={() => setEnrollingStudent(s)}
                          >
                            <Camera size={12} /> Enrol face
                          </Button>
                        )}
                      </Td>
                      <Td align="center" className="tnum font-semibold text-positive">
                        {s.total_present}
                      </Td>
                      <Td align="center" className="tnum font-semibold text-negative">
                        {s.total_absent}
                      </Td>
                      <Td>
                        <div className="flex items-center gap-2.5">
                          <Progress
                            value={pct}
                            tone={zoneTone[s.zone] ?? 'neutral'}
                            className="w-20"
                          />
                          <span className="tnum text-xs font-bold text-ink">{pct}%</span>
                        </div>
                      </Td>
                      <Td align="right">
                        <Badge tone={zoneTone[s.zone] ?? 'neutral'}>
                          {s.zone === 'green' ? 'On track' : s.zone === 'yellow' ? 'Warning' : 'Critical'}
                        </Badge>
                      </Td>
                    </TR>
                  );
                })}
                {students.length === 0 ? (
                  <TableEmpty
                    colSpan={8}
                    icon={Users}
                    title="No students enrolled"
                    description="Students assigned to this class will be listed here."
                  />
                ) : null}
              </TBody>
            </Table>
          </div>
        </Card>
      ) : null}

      <FaceEnrollmentModal
        isOpen={!!enrollingStudent}
        onClose={() => setEnrollingStudent(null)}
        preselectedStudentId={enrollingStudent?.id}
        classStudents={students}
        onEnrolled={() => {
          if (selectedClass) {
            loadFaceStatus(selectedClass);
            viewStudents(selectedClass);
          }
        }}
      />
    </div>
  );
}
