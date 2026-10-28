import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Calendar, ChevronLeft, ChevronRight, Download, TableProperties } from 'lucide-react';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { Select } from '../../components/ui/Field';
import { cn } from '../../components/ui/cn';

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function AttendanceMatrix({ externalClassId, onExternalClassChange }) {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(
    externalClassId ? externalClassId.toString() : ''
  );
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const [matrixData, setMatrixData] = useState(null);
  const [loading, setLoading] = useState(false);

  const [showPicker, setShowPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => new Date().getFullYear());
  const pickerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) setShowPicker(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (externalClassId && externalClassId.toString() !== selectedClass) {
      setSelectedClass(externalClassId.toString());
    }
  }, [externalClassId]);

  useEffect(() => {
    api
      .get('/classes')
      .then((res) => {
        setClasses(res.data);
        if (res.data.length > 0 && !selectedClass && !externalClassId) {
          setSelectedClass(res.data[0].id.toString());
          if (onExternalClassChange) onExternalClassChange(res.data[0].id.toString());
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    setLoading(true);
    api
      .get(`/dashboard/classes/${selectedClass}/matrix`, { params: { month } })
      .then((res) => setMatrixData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedClass, month]);

  const handleExport = async () => {
    if (!selectedClass) return;
    try {
      const response = await api.get(`/dashboard/classes/${selectedClass}/export-matrix`, {
        params: { month },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance_matrix_${selectedClass}_${month}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      toast.error('Failed to export matrix');
    }
  };

  const hasRows = matrixData?.students?.length > 0;
  const selectedLabel = `${monthNames[parseInt(month.split('-')[1], 10) - 1]} ${month.split('-')[0]}`;

  return (
    <section className="rounded-lg border border-line bg-surface shadow-xs">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <h2 className="text-[15px] font-bold text-ink">Monthly attendance</h2>
          <p className="mt-0.5 text-xs text-muted">
            Day-by-day register for the selected class.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleExport}>
          <Download size={14} /> Export
        </Button>
      </header>

      <div className="flex flex-wrap items-end gap-3 border-b border-line bg-sunken/50 px-5 py-3.5">
        {!externalClassId ? (
          <div className="min-w-[220px] flex-1">
            <label
              htmlFor="matrix-class"
              className="mb-1.5 block text-2xs font-bold uppercase tracking-[0.1em] text-faint"
            >
              Class
            </label>
            <Select
              id="matrix-class"
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                if (onExternalClassChange) onExternalClassChange(e.target.value);
              }}
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.section} ({c.academic_year})
                </option>
              ))}
            </Select>
          </div>
        ) : null}

        <div className="relative min-w-[180px]" ref={pickerRef}>
          <span className="mb-1.5 block text-2xs font-bold uppercase tracking-[0.1em] text-faint">
            Month
          </span>
          <button
            type="button"
            onClick={() => {
              setPickerYear(parseInt(month.split('-')[0], 10));
              setShowPicker((v) => !v);
            }}
            className="flex h-9 w-full items-center justify-between gap-2 rounded-md border border-line bg-surface px-3 text-[13px] font-medium text-ink shadow-xs transition-colors hover:border-line-strong"
          >
            {selectedLabel}
            <Calendar size={14} className="text-faint" />
          </button>

          {showPicker ? (
            <div className="absolute left-0 top-[calc(100%+6px)] z-50 w-60 animate-scale-in rounded-lg border border-line bg-surface p-3 shadow-pop">
              <div className="mb-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setPickerYear((y) => y - 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-sunken hover:text-ink"
                  aria-label="Previous year"
                >
                  <ChevronLeft size={15} />
                </button>
                <span className="tnum text-[13px] font-bold text-ink">{pickerYear}</span>
                <button
                  type="button"
                  onClick={() => setPickerYear((y) => y + 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-sunken hover:text-ink"
                  aria-label="Next year"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {monthNames.map((m, i) => {
                  const value = `${pickerYear}-${String(i + 1).padStart(2, '0')}`;
                  const isSelected = month === value;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setMonth(value);
                        setShowPicker(false);
                      }}
                      className={cn(
                        'rounded-md py-1.5 text-xs font-semibold transition-colors',
                        isSelected
                          ? 'bg-accent text-accent-ink'
                          : 'text-muted hover:bg-sunken hover:text-ink'
                      )}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>

        {hasRows ? (
          <p className="ml-auto hidden text-2xs text-faint sm:block">
            {matrixData.students.length} students · {matrixData.dates.length} sessions
          </p>
        ) : null}
      </div>

      {loading ? (
        <p className="px-5 py-12 text-center text-xs font-medium text-muted">Loading register…</p>
      ) : !hasRows ? (
        <EmptyState
          icon={TableProperties}
          title="Nothing recorded for this period"
          description="Attendance appears here as soon as this class has its first marked session."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-max border-collapse text-left">
            <thead>
              <tr className="bg-sunken">
                <th className="sticky left-0 z-10 border-b border-r border-line bg-sunken px-3 py-2.5 text-2xs font-bold uppercase tracking-[0.08em] text-muted">
                  #
                </th>
                <th className="border-b border-r border-line px-3 py-2.5 text-2xs font-bold uppercase tracking-[0.08em] text-muted">
                  Roll no
                </th>
                <th className="border-b border-r border-line px-3 py-2.5 text-2xs font-bold uppercase tracking-[0.08em] text-muted">
                  Name
                </th>
                {matrixData.dates.map((dateStr) => (
                  <th
                    key={dateStr}
                    className="border-b border-r border-line px-2.5 py-2.5 text-center text-2xs font-bold text-muted"
                  >
                    {parseInt(dateStr.split('-')[2], 10)}
                  </th>
                ))}
                <th className="border-b border-line bg-sunken px-3 py-2.5 text-center text-2xs font-bold uppercase tracking-[0.08em] text-muted">
                  %
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {matrixData.students.map((s) => (
                <tr key={s.rollNo} className="transition-colors hover:bg-sunken/60">
                  <td className="sticky left-0 z-10 border-r border-line bg-surface px-3 py-2 text-2xs text-faint">
                    {s.slNo}
                  </td>
                  <td className="whitespace-nowrap border-r border-line px-3 py-2 font-mono text-2xs text-muted">
                    {s.rollNo}
                  </td>
                  <td className="whitespace-nowrap border-r border-line px-3 py-2 text-xs font-semibold text-ink">
                    {s.name}
                  </td>
                  {matrixData.dates.map((dateStr) => {
                    const status = s.attendance[dateStr];
                    return (
                      <td
                        key={dateStr}
                        className={cn(
                          'border-r border-line px-2.5 py-2 text-center text-2xs font-bold',
                          status === 'P' && 'bg-positive-soft text-positive',
                          status === 'A' && 'bg-negative-soft text-negative',
                          !status && 'text-faint'
                        )}
                      >
                        {status || '·'}
                      </td>
                    );
                  })}
                  <td
                    className={cn(
                      'tnum px-3 py-2 text-center text-xs font-bold',
                      matrixData.dates.length === 0 && 'text-faint',
                      matrixData.dates.length > 0 && s.percentage >= 75 && 'bg-positive-soft text-positive',
                      matrixData.dates.length > 0 && s.percentage >= 60 && s.percentage < 75 && 'bg-caution-soft text-caution',
                      matrixData.dates.length > 0 && s.percentage < 60 && 'bg-negative-soft text-negative'
                    )}
                  >
                    {matrixData.dates.length === 0 ? '—' : s.percentage.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
