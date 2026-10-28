import { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { CheckCircle2, Search, Shield, Upload, UserPlus, Users as UsersIcon, XCircle } from 'lucide-react';
import {
  Avatar,
  Badge,
  Button,
  Field,
  Input,
  Modal,
  PageHeader,
  Segmented,
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

const emptyForm = {
  fullName: '',
  email: '',
  role: 'faculty',
  phone: '',
  classId: '',
  rollNo: '',
};

const roleTone = { admin: 'accent', faculty: 'info', student: 'positive' };

export default function Users() {
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [importModal, setImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importClass, setImportClass] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [classes, setClasses] = useState([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetchUsers();
    api.get('/classes').then((r) => setClasses(r.data)).catch(() => {});
  }, [roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = roleFilter ? `?role=${roleFilter}` : '';
      const { data } = await api.get(`/users${params}`);
      setUsers(data);
    } catch {
      toast.error('Failed to load users');
    }
    setLoading(false);
  };

  const visibleUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [u.full_name, u.email, u.phone, u.role].filter(Boolean).some((v) =>
        String(v).toLowerCase().includes(q)
      )
    );
  }, [users, query]);

  const saveUser = async (e) => {
    e.preventDefault();
    try {
      let res;
      if (form.role === 'student') {
        if (!form.classId || !form.rollNo) {
          toast.error('Class and roll number are required for students.');
          return;
        }
        res = await api.post('/students', form);
      } else {
        res = await api.post('/users', form);
      }
      toast.success(`Account created. Temporary password: ${res.data.tempPassword}`);
      fetchUsers();
      setModal(false);
      setForm(emptyForm);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create user');
    }
  };

  const handleBulkImport = async (e) => {
    e.preventDefault();
    if (!importFile || !importClass) {
      toast.error('Choose a class and a CSV file first.');
      return;
    }
    const formData = new FormData();
    formData.append('file', importFile);
    formData.append('classId', importClass);

    setLoading(true);
    try {
      const res = await api.post('/students/bulk-import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(`Import finished — ${res.data.success} added, ${res.data.failed} failed.`);
      fetchUsers();
      setImportModal(false);
      setImportFile(null);
      setImportClass('');
    } catch {
      toast.error('Bulk import failed.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="People"
        title="User directory"
        description={`${users.length} account${users.length === 1 ? '' : 's'} across the institution.`}
        actions={
          <>
            <Button variant="secondary" onClick={() => setImportModal(true)}>
              <Upload size={15} /> Import CSV
            </Button>
            <Button variant="primary" onClick={() => setModal(true)}>
              <UserPlus size={15} /> Add user
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          value={roleFilter}
          onChange={setRoleFilter}
          options={[
            { value: '', label: 'Everyone' },
            { value: 'admin', label: 'Admins' },
            { value: 'faculty', label: 'Faculty' },
            { value: 'student', label: 'Students' },
          ]}
        />

        <div className="relative w-full sm:w-64">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email or role…"
            className="pl-8"
            aria-label="Search users"
          />
        </div>
      </div>

      <TableShell>
        <Table className="min-w-[840px]">
          <THead>
            <tr>
              <Th>Person</Th>
              <Th>Contact</Th>
              <Th className="w-32">Role</Th>
              <Th className="w-32">Status</Th>
              <Th align="right" className="w-32">
                Joined
              </Th>
            </tr>
          </THead>
          <TBody>
            {loading ? (
              <tr>
                <Td colSpan={5} className="py-12 text-center text-xs font-medium text-muted">
                  Loading users…
                </Td>
              </tr>
            ) : visibleUsers.length === 0 ? (
              <TableEmpty
                colSpan={5}
                icon={UsersIcon}
                title={query ? 'No matching accounts' : 'No users yet'}
                description={
                  query
                    ? 'Try a different name, email or role.'
                    : 'Add faculty and students, or import a class roster from CSV.'
                }
              />
            ) : (
              visibleUsers.map((u) => (
                <TR key={u.id}>
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={u.full_name} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-ink">{u.full_name}</p>
                        <p className="font-mono text-2xs text-faint">
                          {u.roll_no ? u.roll_no : `#${u.id}`}
                        </p>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <p className="truncate text-xs text-body">{u.email}</p>
                    <p className="text-2xs text-faint">{u.phone || 'No phone on file'}</p>
                  </Td>
                  <Td>
                    <Badge tone={roleTone[u.role] ?? 'neutral'} className="gap-1 capitalize">
                      {u.role === 'admin' ? <Shield size={10} /> : null}
                      {u.role}
                    </Badge>
                  </Td>
                  <Td>
                    {u.is_active ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-positive">
                        <CheckCircle2 size={13} /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-muted">
                        <XCircle size={13} /> Inactive
                      </span>
                    )}
                  </Td>
                  <Td align="right" className="whitespace-nowrap text-xs text-muted">
                    {new Date(u.created_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Td>
                </TR>
              ))
            )}
          </TBody>
        </Table>
      </TableShell>

      {/* ── create user ── */}
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Add user"
        description="A temporary password is generated and shown once."
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form="user-form">
              Create account
            </Button>
          </>
        }
      >
        <form id="user-form" onSubmit={saveUser} className="space-y-4">
          <Field label="Full name" htmlFor="user-name" required>
            <Input
              id="user-name"
              value={form.fullName}
              onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
              placeholder="Jane Doe"
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Role" htmlFor="user-role" required>
              <Select
                id="user-role"
                value={form.role}
                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                required
              >
                <option value="faculty">Faculty</option>
                <option value="admin">Administrator</option>
                <option value="student">Student</option>
              </Select>
            </Field>
            <Field label="Phone" htmlFor="user-phone" hint="Optional">
              <Input
                id="user-phone"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="+91 98765 43210"
              />
            </Field>
          </div>

          {form.role !== 'student' ? (
            <Field label="Email address" htmlFor="user-email" required>
              <Input
                id="user-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="name@institution.edu"
                required
              />
            </Field>
          ) : (
            <div className="grid animate-fade-in grid-cols-2 gap-3">
              <Field label="Class" htmlFor="user-class" required>
                <Select
                  id="user-class"
                  value={form.classId}
                  onChange={(e) => setForm((p) => ({ ...p, classId: e.target.value }))}
                  required
                >
                  <option value="">Select class…</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.section}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Roll number" htmlFor="user-roll" required>
                <Input
                  id="user-roll"
                  value={form.rollNo}
                  onChange={(e) => setForm((p) => ({ ...p, rollNo: e.target.value }))}
                  placeholder="242G1A05X2"
                  className="font-mono"
                  required
                />
              </Field>
            </div>
          )}
        </form>
      </Modal>

      {/* ── bulk import ── */}
      <Modal
        open={importModal}
        onClose={() => setImportModal(false)}
        title="Import students from CSV"
        description="Upload a roster to create student accounts in bulk."
        footer={
          <>
            <Button variant="ghost" onClick={() => setImportModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form="import-form">
              Start import
            </Button>
          </>
        }
      >
        <form id="import-form" onSubmit={handleBulkImport} className="space-y-4">
          <Field label="Target class" htmlFor="import-class" required>
            <Select
              id="import-class"
              value={importClass}
              onChange={(e) => setImportClass(e.target.value)}
              required
            >
              <option value="">Select class…</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.section}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="CSV file"
            htmlFor="import-file"
            required
            hint="Required headers: name, roll_no. Optional: email, phone."
          >
            <input
              id="import-file"
              type="file"
              accept=".csv"
              onChange={(e) => setImportFile(e.target.files[0])}
              required
              className="w-full rounded-md border border-line bg-surface px-3 py-2 text-xs text-body shadow-xs file:mr-3 file:cursor-pointer file:rounded file:border-0 file:bg-sunken file:px-2.5 file:py-1.5 file:text-2xs file:font-semibold file:text-body hover:file:bg-line/70"
            />
          </Field>
        </form>
      </Modal>
    </div>
  );
}
