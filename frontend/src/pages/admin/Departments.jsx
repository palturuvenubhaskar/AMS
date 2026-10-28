import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Building2, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  Badge,
  Button,
  Field,
  Input,
  Modal,
  PageHeader,
  Table,
  TableEmpty,
  TableShell,
  TBody,
  Td,
  Th,
  THead,
  TR,
} from '../../components/ui';

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', code: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch();
  }, []);

  const fetch = async () => {
    setLoading(true);
    try {
      const r = await api.get('/departments');
      setDepartments(r.data);
    } catch {
      toast.error('Failed to load departments');
    }
    setLoading(false);
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/departments/${editing.id}`, form);
        toast.success('Department updated');
      } else {
        await api.post('/departments', form);
        toast.success('Department created');
      }
      fetch();
      setModal(false);
      setEditing(null);
      setForm({ name: '', code: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not save department');
    }
  };

  const del = async (id) => {
    if (!confirm('Delete this department?')) return;
    try {
      await api.delete(`/departments/${id}`);
      toast.success('Department deleted');
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not delete department');
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', code: '' });
    setModal(true);
  };

  const openEdit = (department) => {
    setEditing(department);
    setForm({ name: department.name, code: department.code });
    setModal(true);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Academics"
        title="Departments"
        description="The organisational units that own classes, subjects and faculty."
        actions={
          <Button variant="primary" onClick={openCreate}>
            <Plus size={15} /> New department
          </Button>
        }
      />

      <TableShell>
        <Table className="min-w-[560px]">
          <THead>
            <tr>
              <Th className="w-16">ID</Th>
              <Th>Name</Th>
              <Th className="w-32">Code</Th>
              <Th align="right" className="w-28">
                Actions
              </Th>
            </tr>
          </THead>
          <TBody>
            {loading ? (
              <tr>
                <Td colSpan={4} className="py-12 text-center text-xs font-medium text-muted">
                  Loading departments…
                </Td>
              </tr>
            ) : departments.length === 0 ? (
              <TableEmpty
                colSpan={4}
                icon={Building2}
                title="No departments yet"
                description="Create your first department to start adding classes and subjects."
                action={
                  <Button size="sm" onClick={openCreate}>
                    <Plus size={14} /> Add department
                  </Button>
                }
              />
            ) : (
              departments.map((d) => (
                <TR key={d.id} className="group">
                  <Td className="font-mono text-2xs text-faint">#{d.id}</Td>
                  <Td className="font-semibold text-ink">{d.name}</Td>
                  <Td>
                    <Badge tone="neutral" className="font-mono tracking-wide">
                      {d.code}
                    </Badge>
                  </Td>
                  <Td align="right">
                    <div className="flex justify-end gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEdit(d)}
                        title="Edit department"
                        aria-label={`Edit ${d.name}`}
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => del(d.id)}
                        title="Delete department"
                        aria-label={`Delete ${d.name}`}
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
        title={editing ? 'Edit department' : 'New department'}
        description="Departments group classes, subjects and faculty together."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form="department-form">
              {editing ? 'Save changes' : 'Create department'}
            </Button>
          </>
        }
      >
        <form id="department-form" onSubmit={save} className="space-y-4">
          <Field label="Department name" htmlFor="dept-name" required>
            <Input
              id="dept-name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Computer Science and Engineering"
              required
            />
          </Field>
          <Field label="Short code" htmlFor="dept-code" hint="Used on timetables and reports." required>
            <Input
              id="dept-code"
              value={form.code}
              onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
              placeholder="CSE"
              className="font-mono uppercase"
              required
            />
          </Field>
        </form>
      </Modal>
    </div>
  );
}
