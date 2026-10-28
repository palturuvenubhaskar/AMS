import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { BookOpen, ListChecks, Plus, Trash2, UserRound } from 'lucide-react';
import {
  Badge,
  Button,
  EmptyState,
  Field,
  PageHeader,
  Select,
  Table,
  TableEmpty,
  TableShell,
  TBody,
  Td,
  Th,
  THead,
  TR,
} from '../../components/ui';

export default function SubjectMapping() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');

  const [subjects, setSubjects] = useState([]);
  const [mappedSubjects, setMappedSubjects] = useState([]);
  const [faculties, setFaculties] = useState([]);

  const [loading, setLoading] = useState(false);

  const [formSubjectId, setFormSubjectId] = useState('');
  const [formFacultyId, setFormFacultyId] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!selectedClass) {
      setMappedSubjects([]);
      setSubjects([]);
      return;
    }
    fetchMappedSubjects();
    const cls = classes.find((c) => c.id === parseInt(selectedClass, 10));
    if (cls) {
      api
        .get(`/subjects?departmentId=${cls.department_id}`)
        .then((res) => setSubjects(res.data))
        .catch(() => {});
    }
  }, [selectedClass]);

  const fetchInitialData = async () => {
    try {
      const [clsRes, facRes] = await Promise.all([
        api.get('/classes'),
        api.get('/users?role=faculty'),
      ]);
      setClasses(clsRes.data);
      setFaculties(facRes.data);
    } catch {
      toast.error('Failed to load initial data');
    }
  };

  const fetchMappedSubjects = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/class-subjects/${selectedClass}`);
      setMappedSubjects(data);
    } catch {
      toast.error('Failed to load mapped subjects');
    }
    setLoading(false);
  };

  const handleMapSubject = async (e) => {
    e.preventDefault();
    if (!selectedClass || !formSubjectId) {
      toast.error('Choose a class and a subject first.');
      return;
    }
    try {
      await api.post('/class-subjects', {
        classId: selectedClass,
        subjectId: formSubjectId,
        facultyId: formFacultyId || null,
      });
      toast.success('Subject mapped to class');
      fetchMappedSubjects();
      setFormSubjectId('');
      setFormFacultyId('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to map subject');
    }
  };

  const handleUnmap = async (subjectId) => {
    if (!window.confirm('Remove this subject from the class?')) return;
    try {
      await api.delete(`/class-subjects/${selectedClass}/${subjectId}`);
      toast.success('Subject unmapped');
      fetchMappedSubjects();
    } catch {
      toast.error('Failed to unmap subject');
    }
  };

  const selected = classes.find((c) => c.id === parseInt(selectedClass, 10));

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Academics"
        title="Faculty mapping"
        description="Attach subjects to a class and nominate the faculty who owns each one."
        actions={
          <div className="w-full sm:w-64">
            <Select
              aria-label="Select class"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="">Select a class…</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.section} (Sem {c.semester})
                </option>
              ))}
            </Select>
          </div>
        }
      />

      {!selectedClass ? (
        <div className="rounded-lg border border-line bg-surface shadow-xs">
          <EmptyState
            icon={BookOpen}
            title="Pick a class to begin"
            description="Choose a class above to see which subjects are attached and who teaches them."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[380px_1fr]">
          {/* mapping form */}
          <section className="h-fit rounded-lg border border-line bg-surface shadow-xs">
            <header className="border-b border-line px-5 py-4">
              <h2 className="text-[15px] font-bold text-ink">Add a subject</h2>
              <p className="mt-0.5 text-xs text-muted">
                {selected ? `${selected.name} — ${selected.section}` : 'Selected class'} ·{' '}
                {selected?.department_code}
              </p>
            </header>

            <form onSubmit={handleMapSubject} className="space-y-4 p-5">
              <Field label="Subject" htmlFor="map-subject" required>
                <Select
                  id="map-subject"
                  value={formSubjectId}
                  onChange={(e) => setFormSubjectId(e.target.value)}
                  required
                >
                  <option value="">Select a subject…</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} — {s.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field
                label="Faculty"
                htmlFor="map-faculty"
                hint="Becomes the default teacher for this subject in timetables."
              >
                <Select
                  id="map-faculty"
                  value={formFacultyId}
                  onChange={(e) => setFormFacultyId(e.target.value)}
                >
                  <option value="">Leave unassigned</option>
                  {faculties.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.full_name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Button type="submit" variant="primary" className="w-full">
                <Plus size={14} /> Save mapping
              </Button>
            </form>
          </section>

          {/* mapped list */}
          <TableShell>
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <h2 className="text-[13px] font-bold text-ink">Current assignments</h2>
              <Badge tone="neutral">{mappedSubjects.length} subjects</Badge>
            </div>
            <Table>
              <THead>
                <tr>
                  <Th>Subject</Th>
                  <Th className="w-56">Faculty</Th>
                  <Th align="right" className="w-20">
                    Remove
                  </Th>
                </tr>
              </THead>
              <TBody>
                {loading ? (
                  <tr>
                    <Td colSpan={3} className="py-12 text-center text-xs font-medium text-muted">
                      Loading assignments…
                    </Td>
                  </tr>
                ) : mappedSubjects.length === 0 ? (
                  <TableEmpty
                    colSpan={3}
                    icon={ListChecks}
                    title="No subjects attached"
                    description="Use the form to attach the first subject to this class."
                  />
                ) : (
                  mappedSubjects.map((m) => (
                    <TR key={m.id} className="group">
                      <Td>
                        <p className="font-semibold text-ink">{m.subject_name}</p>
                        <p className="mt-0.5 font-mono text-2xs text-faint">
                          {m.subject_code} · {m.credits} credits
                        </p>
                      </Td>
                      <Td>
                        {m.faculty_name ? (
                          <span className="inline-flex items-center gap-1.5 text-[13px] text-body">
                            <UserRound size={13} className="text-faint" />
                            {m.faculty_name}
                          </span>
                        ) : (
                          <span className="text-xs italic text-faint">Unassigned</span>
                        )}
                      </Td>
                      <Td align="right">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleUnmap(m.subject_id)}
                          title="Remove mapping"
                          aria-label={`Remove ${m.subject_name}`}
                          className="opacity-60 transition-opacity hover:bg-negative-soft hover:text-negative group-hover:opacity-100"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </Td>
                    </TR>
                  ))
                )}
              </TBody>
            </Table>
          </TableShell>
        </div>
      )}
    </div>
  );
}
