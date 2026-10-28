import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, CameraOff, Check, RefreshCw, Upload, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { loadFaceApiModels, detectSingleFace } from '../services/faceService';
import { Button, Field, Modal, Select, Spinner } from './ui';
import { cn } from './ui/cn';

export default function FaceEnrollmentModal({
  isOpen,
  onClose,
  onEnrolled,
  preselectedStudentId,
  classStudents = [],
}) {
  const [selectedStudentId, setSelectedStudentId] = useState(preselectedStudentId || '');
  const [cameraActive, setCameraActive] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [detecting, setDetecting] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [capturedDescriptor, setCapturedDescriptor] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectionTimerRef = useRef(null);

  useEffect(() => {
    if (preselectedStudentId) setSelectedStudentId(preselectedStudentId);
  }, [preselectedStudentId]);

  useEffect(() => {
    if (isOpen) {
      setModelsLoading(true);
      loadFaceApiModels()
        .then(() => setModelsLoading(false))
        .catch(() => {
          setModelsLoading(false);
          toast.error('Failed to load face detection models.');
        });
    } else {
      stopCamera();
      setCapturedImage(null);
      setCapturedDescriptor(null);
      setFaceDetected(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const stopCamera = useCallback(() => {
    if (detectionTimerRef.current) {
      clearInterval(detectionTimerRef.current);
      detectionTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const startCamera = async () => {
    stopCamera();
    setCameraError(null);
    setCapturedImage(null);
    setCapturedDescriptor(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setCameraActive(true);
          startLiveDetection();
        };
      }
    } catch (err) {
      setCameraError(err.message || 'Unable to access camera.');
      toast.error('Camera access denied or unavailable.');
    }
  };

  const startLiveDetection = () => {
    if (detectionTimerRef.current) clearInterval(detectionTimerRef.current);
    detectionTimerRef.current = setInterval(async () => {
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;
      try {
        const detection = await detectSingleFace(videoRef.current);
        setFaceDetected(!!detection);
      } catch {
        /* background detection failures are not actionable */
      }
    }, 350);
  };

  const handleCapture = async () => {
    if (!videoRef.current) return;
    setDetecting(true);

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

      const detection = await detectSingleFace(canvas);

      if (!detection) {
        toast.error('No clear face detected. Look straight at the camera in good light.');
        setDetecting(false);
        return;
      }

      setCapturedImage(dataUrl);
      setCapturedDescriptor(Array.from(detection.descriptor));
      stopCamera();
      toast.success('Face snapshot captured');
    } catch {
      toast.error('Could not analyse the captured frame.');
    } finally {
      setDetecting(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const dataUrl = evt.target.result;
      const img = new Image();
      img.src = dataUrl;
      img.onload = async () => {
        setDetecting(true);
        try {
          const detection = await detectSingleFace(img);
          if (!detection) {
            toast.error('No face found in that photo. Try a clearer portrait.');
            setDetecting(false);
            return;
          }
          setCapturedImage(dataUrl);
          setCapturedDescriptor(Array.from(detection.descriptor));
          stopCamera();
          toast.success('Portrait verified');
        } catch {
          toast.error('Could not analyse the image.');
        } finally {
          setDetecting(false);
        }
      };
    };
    reader.readAsDataURL(file);
  };

  const handleSaveEnrollment = async () => {
    if (!selectedStudentId) return toast.error('Select a student first.');
    if (!capturedDescriptor || !capturedImage) {
      return toast.error('Capture or upload a portrait first.');
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/face/enroll', {
        studentId: parseInt(selectedStudentId, 10),
        embedding: capturedDescriptor,
        image: capturedImage,
        angleType: 'front',
      });

      toast.success('Face ID registered');
      if (onEnrolled) {
        onEnrolled({
          studentId: parseInt(selectedStudentId, 10),
          embedding: capturedDescriptor,
          imagePath: res.data.face?.imagePath,
          face: res.data.face,
        });
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to enrol face.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentStudent = classStudents.find(
    (s) => s.id == selectedStudentId || s.user_id == selectedStudentId // eslint-disable-line eqeqeq
  );

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Enrol a face"
      description="Capture one clear portrait per student. The 128-d descriptor is stored, not the photo."
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSaveEnrollment}
            disabled={!capturedDescriptor || !selectedStudentId || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Spinner size="sm" /> Saving…
              </>
            ) : (
              <>
                <Check size={13} /> Save face ID
              </>
            )}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Student" htmlFor="face-student">
          {classStudents.length > 0 ? (
            <Select
              id="face-student"
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
            >
              <option value="">Choose a student…</option>
              {classStudents.map((s) => (
                <option key={s.id || s.user_id} value={s.id || s.user_id}>
                  {s.roll_no} — {s.full_name}
                </option>
              ))}
            </Select>
          ) : (
            <input
              id="face-student"
              type="text"
              placeholder="Student user ID"
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="h-9 w-full rounded-md border border-line bg-surface px-3 text-[13px] text-ink shadow-xs placeholder:text-faint focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/12"
            />
          )}
        </Field>

        {currentStudent ? (
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent">
            <UserCheck size={13} /> {currentStudent.full_name} · {currentStudent.roll_no}
          </p>
        ) : null}

        {/* Viewfinder */}
        <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-md bg-neutral-950">
          {modelsLoading ? (
            <div className="flex flex-col items-center gap-2.5 text-center">
              <Spinner className="border-white/25 border-t-white" />
              <p className="text-xs text-neutral-400">Loading face models…</p>
            </div>
          ) : capturedImage ? (
            <div className="relative h-full w-full">
              <img src={capturedImage} alt="Captured face" className="h-full w-full object-cover" />
              <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-full bg-emerald-600/95 px-2.5 py-1 text-2xs font-bold text-white">
                <Check size={11} /> Verified
              </span>
              <button
                type="button"
                onClick={() => {
                  setCapturedImage(null);
                  setCapturedDescriptor(null);
                  startCamera();
                }}
                className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1.5 rounded-md bg-black/70 px-2.5 py-1.5 text-2xs font-semibold text-white transition-colors hover:bg-black"
              >
                <RefreshCw size={11} /> Retake
              </button>
            </div>
          ) : cameraActive ? (
            <div className="relative flex h-full w-full items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full -scale-x-100 object-cover"
              />

              <div
                className={cn(
                  'pointer-events-none absolute flex h-44 w-36 items-center justify-center rounded-[50%] border-2 transition-all duration-300',
                  faceDetected
                    ? 'scale-105 border-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.35)]'
                    : 'animate-pulse border-dashed border-white/40'
                )}
              >
                <span
                  className={cn(
                    'rounded px-2 py-0.5 text-2xs font-bold',
                    faceDetected ? 'bg-emerald-500 text-white' : 'bg-black/60 text-white/80'
                  )}
                >
                  {faceDetected ? 'Face locked' : 'Align your face'}
                </span>
              </div>

              <span className="absolute bottom-2.5 left-2.5 rounded-full bg-black/60 px-2 py-0.5 text-2xs font-medium text-white backdrop-blur">
                {faceDetected ? 'Ready to capture' : 'Looking for a face…'}
              </span>
            </div>
          ) : (
            <div className="max-w-xs space-y-3 p-6 text-center">
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-neutral-300">
                <Camera size={20} />
              </span>
              <div>
                <p className="text-[13px] font-semibold text-white">Camera offline</p>
                <p className="mt-1 text-xs leading-relaxed text-neutral-400">
                  Use the webcam, or upload a portrait photo from disk.
                </p>
              </div>
              {cameraError ? (
                <p className="text-2xs text-red-400">{cameraError}</p>
              ) : null}
            </div>
          )}
        </div>

        {!capturedImage ? (
          <div className="flex flex-wrap gap-2">
            {cameraActive ? (
              <>
                <Button variant="secondary" onClick={stopCamera} className="flex-1">
                  <CameraOff size={13} /> Cancel camera
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCapture}
                  disabled={detecting}
                  className="flex-[2]"
                >
                  {detecting ? (
                    <>
                      <Spinner size="sm" /> Analysing…
                    </>
                  ) : (
                    <>
                      <Camera size={13} /> Capture snapshot
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="primary"
                  onClick={startCamera}
                  disabled={modelsLoading || !!capturedImage}
                  className="flex-1"
                >
                  <Camera size={13} /> Start camera
                </Button>
                <Button as="label" variant="secondary" className="flex-1 cursor-pointer">
                  <Upload size={13} /> Upload photo
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                </Button>
              </>
            )}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
