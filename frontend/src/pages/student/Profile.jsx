import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Camera, ScanFace, ShieldCheck, Trash2 } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import FaceEnrollmentModal from '../../components/FaceEnrollmentModal';
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Modal,
  PageHeader,
  PageLoader,
  Spinner,
} from '../../components/ui';

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [faceData, setFaceData] = useState(null);
  const [loadingFace, setLoadingFace] = useState(true);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [removing, setRemoving] = useState(false);

  const fetchFaceStatus = () => {
    if (!user?.id) return;
    setLoadingFace(true);
    api
      .get(`/students/${user.id}/face`)
      .then((r) => setFaceData(r.data))
      .catch(() => {})
      .finally(() => setLoadingFace(false));
  };

  useEffect(() => {
    api.get('/students/me').then((r) => setProfile(r.data)).catch(() => {});
    fetchFaceStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleDeleteFace = async () => {
    setRemoving(true);
    try {
      await api.delete(`/students/${user.id}/face`);
      toast.success('Face ID removed');
      setConfirmRemove(false);
      fetchFaceStatus();
    } catch {
      toast.error('Could not remove the face ID');
    } finally {
      setRemoving(false);
    }
  };

  if (!profile) return <PageLoader label="Loading profile" />;

  const details = [
    ['Email', profile.email],
    ['Phone', profile.phone || 'Not set'],
    ['Department', `${profile.department_name} (${profile.department_code})`],
    ['Class', `${profile.class_name}-${profile.section}`],
    ['Semester', profile.semester],
    ['Academic year', profile.academic_year],
    ['Enrolment no', profile.enrollment_no],
    ['Joined', new Date(profile.created_at).toLocaleDateString()],
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Account"
        title="My profile"
        description="Your enrolment details and the face ID used by classroom cameras."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardBody className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar name={profile.full_name} size="xl" tone="ink" />
              <div className="min-w-0">
                <h2 className="truncate text-lg font-bold text-ink">{profile.full_name}</h2>
                <p className="mt-0.5 font-mono text-xs text-muted">{profile.roll_no}</p>
              </div>
            </div>

            <dl className="grid grid-cols-1 gap-x-6 gap-y-5 border-t border-line pt-5 sm:grid-cols-2">
              {details.map(([label, value]) => (
                <div key={label} className="min-w-0">
                  <dt className="text-2xs font-bold uppercase tracking-[0.1em] text-faint">
                    {label}
                  </dt>
                  <dd className="mt-1 truncate text-[13px] font-semibold text-ink">{value || '—'}</dd>
                </div>
              ))}
            </dl>
          </CardBody>
        </Card>

        <Card className="flex flex-col">
          <CardHeader
            actions={
              loadingFace ? null : faceData?.enrolled ? (
                <Badge tone="positive" dot>
                  Enrolled
                </Badge>
              ) : (
                <Badge tone="caution" dot>
                  Pending
                </Badge>
              )
            }
          >
            <h2 className="inline-flex items-center gap-1.5 text-[15px] font-bold text-ink">
              <ScanFace size={15} className="text-accent" /> FRS face ID
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              Used by classroom cameras to mark you present.
            </p>
          </CardHeader>

          <CardBody className="flex-1 space-y-4">
            {loadingFace ? (
              <div className="flex flex-col items-center gap-2 py-8">
                <Spinner />
                <p className="text-xs text-muted">Checking enrolment…</p>
              </div>
            ) : faceData?.enrolled ? (
              <>
                <div className="relative aspect-square overflow-hidden rounded-md border border-line bg-neutral-950">
                  {faceData.face?.imagePath ? (
                    <img
                      src={faceData.face.imagePath}
                      alt="Enrolled portrait"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-neutral-400">
                      <ShieldCheck size={36} />
                    </div>
                  )}
                  <span className="absolute bottom-2 left-2 rounded-full bg-black/65 px-2 py-0.5 text-2xs font-semibold text-emerald-300">
                    128-d active
                  </span>
                </div>
                <p className="text-xs text-muted">
                  Registered{' '}
                  {faceData.face?.createdAt
                    ? new Date(faceData.face.createdAt).toLocaleDateString()
                    : 'recently'}
                </p>
              </>
            ) : (
              <div className="rounded-md border border-caution/20 bg-caution-soft px-3 py-3">
                <p className="text-[13px] font-bold text-caution">No face registered</p>
                <p className="mt-0.5 text-xs text-body">
                  Cameras cannot mark you present automatically until you enrol.
                </p>
              </div>
            )}

            <div className="space-y-2 pt-2">
              <Button
                variant="primary"
                className="w-full"
                onClick={() => setIsEnrollModalOpen(true)}
              >
                <Camera size={13} />
                {faceData?.enrolled ? 'Re-enrol face' : 'Register face'}
              </Button>
              {faceData?.enrolled ? (
                <Button variant="danger" className="w-full" onClick={() => setConfirmRemove(true)}>
                  <Trash2 size={13} /> Remove face ID
                </Button>
              ) : null}
            </div>
          </CardBody>
        </Card>
      </div>

      <FaceEnrollmentModal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        preselectedStudentId={user?.id}
        onEnrolled={() => fetchFaceStatus()}
      />

      <Modal
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        title="Remove face ID?"
        description="Classroom cameras will stop recognising you until you enrol again."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmRemove(false)}>
              Keep it
            </Button>
            <Button variant="danger-solid" onClick={handleDeleteFace} disabled={removing}>
              {removing ? 'Removing…' : 'Remove'}
            </Button>
          </>
        }
      >
        <p className="text-[13px] text-body">
          Your stored descriptor is deleted. You can register a new face at any time.
        </p>
      </Modal>
    </div>
  );
}
