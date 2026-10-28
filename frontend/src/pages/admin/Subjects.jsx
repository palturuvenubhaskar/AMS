import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { BookOpen, Pencil, Plus, Trash2 } from 'lucide-react';
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

const emptyForm = { departmentId: '', name: '', code: '', credits: 3 };

export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
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
      const r = await api.get('/subjects');
      setSubjects(r.data);
    } catch {
      toast.error('Failed to load subjects');
    }
    setLoading(false);
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editing) await api.put(`/subjects/${editing.id}`, form);
      else await api.post('/subjects', form);
      toast.success(editing ? 'Subject updated' : 'Subject created');
      fetch();
      setModal(false);
      setEditing(null);
      setForm(emptyForm);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not save subject');
    }
  };

  const del = async (id) => {
    if (!confirm('Delete this subject?')) return;
    try {
      await api.delete(`/subjects/${id}`);
      toast.success('Subject deleted');
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not delete subject');
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModal(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm({ departmentId: s.department_id, name: s.name, code: s.code, credits: s.credits });
    setModal(true);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Academics"
        title="Subjects"
        description="Course catalogue, grouped by department."
        actions={
          <Button variant="primary" onClick={openCreate}>
            <Plus size={15} /> New subject
          </Button>
        }
      />

      <TableShell>
        <Table className="min-w-[720px]">
          <THead>
            <tr>
              <Th className="w-24">Dept</Th>
              <Th className="w-32">Code</Th>
              <Th>Subject</Th>
              <Th align="center" className="w-24">
                Credits
              </Th>
              <Th align="right" className="w-28">
                Actions
              </Th>
            </tr>
          </THead>
          <TBody>
            {loading ? (
              <tr>
                <Td colSpan={5} className="py-12 text-center text-xs font-medium text-muted">
                  Loading subjects…
                </Td>
              </tr>
            ) : subjects.length === 0 ? (
              <TableEmpty
                colSpan={5}
                icon={BookOpen}
                title="No subjects yet"
                description="Add the subjects taught this term, then map faculty to them."
                action={
                  <Button size="sm" onClick={openCreate}>
                    <Plus size={14} /> Add subject
                  </Button>
                }
              />
            ) : (
              subjects.map((s) => (
                <TR key={s.id} className="group">
                  <Td>
                    <Badge tone="neutral" className="font-mono tracking-wide">
                      {s.department_code}
                    </Badge>
                  </Td>
                  <Td className="font-mono text-xs font-semibold tracking-wide text-body">{s.code}</Td>
                  <Td className="font-semibold text-ink">{s.name}</Td>
                  <Td align="center">
                    <span className="tnum inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-sunken px-1.5 text-xs font-semibold text-body">
                      {s.credits}
                    </span>
                  </Td>
                  <Td align="right">
                    <div className="flex justify-end gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEdit(s)}
                        title="Edit subject"
                        aria-label={`Edit ${s.name}`}
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => del(s.id)}
                        title="Delete subject"
                        aria-label={`Delete ${s.name}`}
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
        title={editing ? 'Edit subject' : 'New subject'}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form="subject-form">
              {editing ? 'Save changes' : 'Create subject'}
            </Button>
          </>
        }
      >
        <form id="subject-form" onSubmit={save} className="space-y-4">
          <Field label="Department" htmlFor="subject-dept" required>
            <Select
              id="subject-dept"
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

          <div className="grid grid-cols-[1fr_96px] gap-3">
            <Field label="Subject code" htmlFor="subject-code" required>
              <Input
                id="subject-code"
                value={form.code}
                onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                placeholder="CS301"
                className="font-mono uppercase"
                required
              />
            </Field>
            <Field label="Credits" htmlFor="subject-credits" required>
              <Input
                id="subject-credits"
                type="number"
                min="1"
                max="6"
                value={form.credits}
                onChange={(e) => setForm((p) => ({ ...p, credits: parseInt(e.target.value, 10) }))}
                required
              />
            </Field>
          </div>

          <Field label="Subject name" htmlFor="subject-name" required>
            <Input
              id="subject-name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Data Structures and Algorithms"
              required
            />
          </Field>
        </form>
      </Modal>
    </div>
  );
}
