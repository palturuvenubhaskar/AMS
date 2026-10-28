import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { GraduationCap, Pencil, Plus, Trash2, Users } from 'lucide-react';
import {
  Badge,
  Button,
  Field,
  Input,
  Modal,
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

const emptyForm = { departmentId: '', name: '', section: '', semester: '', academicYear: '' };

export default function AdminClasses() {
  const [classes, setClasses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/departments').then((r) => setDepartments(r.data)).catch(() => {});
    fetch();
  }, []);

  const fetch = async () => {
    setLoading(true);
    try {
      const r = await api.get('/classes');
      setClasses(r.data);
    } catch {
      toast.error('Failed to load classes');
    }
    setLoading(false);
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editing) await api.put(`/classes/${editing.id}`, form);
      else await api.post('/classes', form);
      toast.success(editing ? 'Class updated' : 'Class created');
      fetch();
      setModal(false);
      setEditing(null);
      setForm(emptyForm);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not save class');
    }
  };

  const del = async (id) => {
    if (!confirm('Delete this class? Students in it will lose their section.')) return;
    try {
      await api.delete(`/classes/${id}`);
      toast.success('Class deleted');
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not delete class');
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModal(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({
      departmentId: c.department_id,
      name: c.name,
      section: c.section,
      semester: c.semester,
      academicYear: c.academic_year,
    });
    setModal(true);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Academics"
        title="Classes"
        description="Every section that attendance is taken for."
        actions={
          <Button variant="primary" onClick={openCreate}>
            <Plus size={15} /> New class
          </Button>
        }
      />

      <TableShell>
        <Table className="min-w-[860px]">
          <THead>
            <tr>
              <Th className="w-24">Dept</Th>
              <Th>Name</Th>
              <Th className="w-24">Section</Th>
              <Th className="w-24">Semester</Th>
              <Th className="w-32">Year</Th>
              <Th align="center" className="w-24">
                Students
              </Th>
              <Th align="right" className="w-28">
                Actions
              </Th>
            </tr>
          </THead>
          <TBody>
            {loading ? (
              <tr>
                <Td colSpan={7} className="py-12 text-center text-xs font-medium text-muted">
                  Loading classes…
                </Td>
              </tr>
            ) : classes.length === 0 ? (
              <TableEmpty
                colSpan={7}
                icon={GraduationCap}
                title="No classes yet"
                description="A class ties a department, semester and section together."
                action={
                  <Button size="sm" onClick={openCreate}>
                    <Plus size={14} /> Add class
                  </Button>
                }
              />
            ) : (
              classes.map((c) => (
                <TR key={c.id} className="group">
                  <Td>
                    <Badge tone="neutral" className="font-mono tracking-wide">
                      {c.department_code}
                    </Badge>
                  </Td>
                  <Td className="font-semibold text-ink">{c.name}</Td>
                  <Td className="text-muted">Section {c.section}</Td>
                  <Td className="text-muted">Sem {c.semester}</Td>
                  <Td className="tnum text-muted">{c.academic_year}</Td>
                  <Td align="center">
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-sunken px-2 py-0.5 text-xs font-semibold text-body">
                      <Users size={12} className="text-faint" />
                      {c.student_count ?? 0}
                    </span>
                  </Td>
                  <Td align="right">
                    <div className="flex justify-end gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEdit(c)}
                        title="Edit class"
                        aria-label={`Edit ${c.name}`}
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => del(c.id)}
                        title="Delete class"
                        aria-label={`Delete ${c.name}`}
                        className="hover:bg-negative-soft hover:text-negative"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </Td>
                </TR>
              ))
            )}
          </TBody>
        </Table>
      </TableShell>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editing ? 'Edit class' : 'New class'}
        description="Sections are created per department and semester."
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form="class-form">
              {editing ? 'Save changes' : 'Create class'}
            </Button>
          </>
        }
      >
        <form id="class-form" onSubmit={save} className="space-y-4">
          <Field label="Department" htmlFor="class-dept" required>
            <Select
              id="class-dept"
              value={form.departmentId}
              onChange={(e) => setForm((p) => ({ ...p, departmentId: e.target.value }))}
              required
            >
              <option value="">Select a department…</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Class name" htmlFor="class-name" required>
              <Input
                id="class-name"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="CSE"
                required
              />
            </Field>
            <Field label="Section" htmlFor="class-section" required>
              <Input
                id="class-section"
                value={form.section}
                onChange={(e) => setForm((p) => ({ ...p, section: e.target.value.toUpperCase() }))}
                placeholder="A"
                required
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Semester" htmlFor="class-semester" required>
              <Input
                id="class-semester"
                type="number"
                min="1"
                max="10"
                value={form.semester}
                onChange={(e) => setForm((p) => ({ ...p, semester: e.target.value }))}
                placeholder="5"
                required
              />
            </Field>
            <Field label="Academic year" htmlFor="class-year" required>
              <Input
                id="class-year"
                value={form.academicYear}
                onChange={(e) => setForm((p) => ({ ...p, academicYear: e.target.value }))}
                placeholder="2026-27"
                className="font-mono"
                required
              />
            </Field>
          </div>
        </form>
      </Modal>
    </div>
  );
}
