import { useState, useRef, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  Camera,
  CameraOff,
  CheckCircle2,
  Pause,
  Play,
  RefreshCw,
  ScanFace,
  UserPlus,
  Users,
  Volume2,
  VolumeX,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { loadFaceApiModels, detectAllFaces, createFaceMatcher } from '../services/faceService';
import FaceEnrollmentModal from './FaceEnrollmentModal';
import { Badge, Button, Spinner } from './ui';
import { cn } from './ui/cn';

export default function FRSScanner({ classId, students = [], records = {}, onUpdateRecord }) {
  const [loadingModels, setLoadingModels] = useState(true);
  const [enrolledFaces, setEnrolledFaces] = useState([]);
  const [loadingFaces, setLoadingFaces] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [isScanning, setIsScanning] = useState(true);
  const [availableDevices, setAvailableDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [activeFacesCount, setActiveFacesCount] = useState(0);
  const [recognizedFeed, setRecognizedFeed] = useState([]);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const matcherRef = useRef(null);
  const animationFrameRef = useRef(null);
  const isScanningRef = useRef(isScanning);
  const lastDetectionTimeRef = useRef(0);
  const recentlyMarkedRef = useRef(new Set());

  isScanningRef.current = isScanning;

  const playRecognitionSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    } catch {
      /* audio can be blocked before the first interaction */
    }
  }, [soundEnabled]);

  const fetchClassFaces = useCallback(async () => {
    if (!classId) return;
    setLoadingFaces(true);
    try {
      const res = await api.get(`/classes/${classId}/faces`);
      const faces = res.data.faces || [];
      setEnrolledFaces(faces);
      matcherRef.current = createFaceMatcher(faces, 0.55);
    } catch {
      toast.error('Could not load enrolled face data.');
    } finally {
      setLoadingFaces(false);
    }
  }, [classId]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await loadFaceApiModels();
        if (mounted) setLoadingModels(false);
      } catch {
        if (mounted) {
          setLoadingModels(false);
          toast.error('Failed to load face detection models.');
        }
      }
    })();

    fetchClassFaces();

    if (navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices
        .enumerateDevices()
        .then((devices) => {
          const videoInputs = devices.filter((d) => d.kind === 'videoinput');
          setAvailableDevices(videoInputs);
          if (videoInputs.length > 0) setSelectedDeviceId(videoInputs[0].deviceId);
        })
        .catch(() => {});
    }

    return () => {
      mounted = false;
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, fetchClassFaces]);

  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setActiveFacesCount(0);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }, []);

  const startCamera = async (deviceId) => {
    stopCamera();
    try {
      const constraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setCameraActive(true);
          runDetectionLoop();
        };
      }
    } catch {
      toast.error('Could not open the camera. Check the browser permission.');
    }
  };

  const runDetectionLoop = () => {
    const detect = async (timestamp) => {
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) {
        animationFrameRef.current = requestAnimationFrame(detect);
        return;
      }

      if (timestamp - lastDetectionTimeRef.current > 120 && isScanningRef.current) {
        lastDetectionTimeRef.current = timestamp;

        try {
          const video = videoRef.current;
          const canvas = canvasRef.current;

          if (canvas && video.videoWidth > 0 && video.videoHeight > 0) {
            if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
            }

            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const detections = await detectAllFaces(video, 0.45);
            setActiveFacesCount(detections.length);

            const matcher = matcherRef.current;

            for (const d of detections) {
              const { box } = d.detection;
              let label = 'Unknown face';
              let isMatch = false;
              let studentInfo = null;
              let confidence = Math.round((1 - (d.detection.score ? 1 - d.detection.score : 0.5)) * 100);

              if (matcher && d.descriptor) {
                const bestMatch = matcher.findBestMatch(d.descriptor);
                if (bestMatch.label !== 'unknown') {
                  const studentId = parseInt(bestMatch.label, 10);
                  studentInfo = students.find((s) => s.id === studentId || s.user_id === studentId);
                  if (studentInfo) {
                    isMatch = true;
                    confidence = Math.max(65, Math.round((1 - bestMatch.distance) * 100));
                    label = `${studentInfo.full_name} (${studentInfo.roll_no})`;

                    if (!recentlyMarkedRef.current.has(studentId)) {
                      recentlyMarkedRef.current.add(studentId);
                      onUpdateRecord(studentId, 'present');
                      playRecognitionSound();
                      setRecognizedFeed((prev) => [
                        {
                          id: `${studentId}-${Date.now()}`,
                          name: studentInfo.full_name,
                          rollNo: studentInfo.roll_no,
                          time: new Date().toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          }),
                          confidence,
                        },
                        ...prev.slice(0, 9),
                      ]);
                      toast.success(`Verified: ${studentInfo.full_name} (${studentInfo.roll_no})`, {
                        id: `frs-${studentId}`,
                      });
                    }
                  }
                }
              }

              ctx.save();
              ctx.lineWidth = 3;
              if (isMatch) {
                ctx.strokeStyle = '#10b981';
                ctx.shadowColor = 'rgba(16, 185, 129, 0.7)';
                ctx.shadowBlur = 12;
              } else {
                ctx.strokeStyle = '#f59e0b';
                ctx.shadowColor = 'rgba(245, 158, 11, 0.5)';
                ctx.shadowBlur = 8;
              }

              const radius = 10;
              ctx.beginPath();
              ctx.roundRect(box.x, box.y, box.width, box.height, radius);
              ctx.stroke();

              const cornerLen = Math.min(20, box.width / 4);
              ctx.lineWidth = 4;
              ctx.beginPath();
              ctx.moveTo(box.x, box.y + cornerLen);
              ctx.lineTo(box.x, box.y);
              ctx.lineTo(box.x + cornerLen, box.y);
              ctx.moveTo(box.x + box.width - cornerLen, box.y);
              ctx.lineTo(box.x + box.width, box.y);
              ctx.lineTo(box.x + box.width, box.y + cornerLen);
              ctx.moveTo(box.x, box.y + box.height - cornerLen);
              ctx.lineTo(box.x, box.y + box.height);
              ctx.lineTo(box.x + cornerLen, box.y + box.height);
              ctx.moveTo(box.x + box.width - cornerLen, box.y + box.height);
              ctx.lineTo(box.x + box.width, box.y + box.height);
              ctx.lineTo(box.x + box.width, box.y + box.height - cornerLen);
              ctx.stroke();

              const tagText = isMatch ? `${label} · ${confidence}%` : label;
              ctx.font = '600 13px system-ui, -apple-system, sans-serif';
              const textWidth = ctx.measureText(tagText).width;
              const pillHeight = 26;
              const pillWidth = textWidth + 24;
              const pillX = Math.max(10, box.x + (box.width - pillWidth) / 2);
              const pillY = Math.max(10, box.y - 34);

              ctx.fillStyle = isMatch ? 'rgba(16, 185, 129, 0.95)' : 'rgba(245, 158, 11, 0.95)';
              ctx.shadowColor = 'rgba(0,0,0,0.4)';
              ctx.shadowBlur = 6;
              ctx.beginPath();
              ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 13);
              ctx.fill();

              ctx.fillStyle = '#ffffff';
              ctx.shadowBlur = 0;
              ctx.fillText(tagText, pillX + 12, pillY + 17);

              ctx.restore();
            }
          }
        } catch {
          /* skip dropped frames */
        }
      }

      animationFrameRef.current = requestAnimationFrame(detect);
    };

    animationFrameRef.current = requestAnimationFrame(detect);
  };

  const handleDeviceChange = (e) => {
    const devId = e.target.value;
    setSelectedDeviceId(devId);
    if (cameraActive) startCamera(devId);
  };

  const handleEnrolledNewFace = (faceData) => {
    setEnrolledFaces((prev) => {
      const updated = [...prev.filter((f) => f.studentId !== faceData.studentId), faceData];
      matcherRef.current = createFaceMatcher(updated, 0.55);
      return updated;
    });
    fetchClassFaces();
  };

  const recognizedCount = Object.values(records).filter((r) => r === 'present').length;
  const enrolledCount = enrolledFaces.length;

  return (
    <section className="overflow-hidden rounded-lg border border-line bg-surface shadow-xs">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent">
            <ScanFace size={16} />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[15px] font-bold text-ink">Face recognition</h2>
              <Badge tone="outline">128-d</Badge>
            </div>
            <p className="mt-0.5 text-xs text-muted">
              {loadingFaces
                ? 'Loading enrolled faces…'
                : `${enrolledCount} of ${students.length} students have a face ID`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {availableDevices.length > 1 ? (
            <select
              value={selectedDeviceId}
              onChange={handleDeviceChange}
              aria-label="Camera"
              className="h-8 max-w-[180px] rounded-md border border-line bg-surface px-2 text-xs text-body"
            >
              {availableDevices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Camera ${d.deviceId.slice(0, 5)}`}
                </option>
              ))}
            </select>
          ) : null}

          <Button
            size="icon-sm"
            variant="ghost"
            onClick={() => setSoundEnabled((p) => !p)}
            aria-label={soundEnabled ? 'Mute recognition sound' : 'Enable recognition sound'}
          >
            {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </Button>

          <Button size="sm" variant="secondary" onClick={() => setIsEnrollModalOpen(true)}>
            <UserPlus size={13} /> Enrol face
          </Button>

          {cameraActive ? (
            <>
              <Button size="sm" variant="secondary" onClick={() => setIsScanning((p) => !p)}>
                {isScanning ? (
                  <>
                    <Pause size={13} /> Pause
                  </>
                ) : (
                  <>
                    <Play size={13} /> Resume
                  </>
                )}
              </Button>
              <Button size="sm" variant="danger" onClick={stopCamera}>
                <CameraOff size={13} /> Stop
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="primary"
              onClick={() => startCamera(selectedDeviceId)}
              disabled={loadingModels}
            >
              <Camera size={13} /> {loadingModels ? 'Loading models…' : 'Open camera'}
            </Button>
          )}
        </div>
      </header>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Viewport — intentionally dark, it holds a live video feed. */}
        <div className="relative flex min-h-[320px] items-center justify-center overflow-hidden bg-neutral-950">
          {loadingModels ? (
            <div className="flex flex-col items-center gap-3 p-8 text-center">
              <Spinner size="lg" className="border-white/25 border-t-white" />
              <p className="text-[13px] font-semibold text-neutral-200">
                Loading face detection models
              </p>
              <p className="text-2xs text-neutral-500">TinyFaceDetector · 128-d FaceMatcher</p>
            </div>
          ) : cameraActive ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="max-h-[460px] w-full object-contain"
              />
              <canvas
                ref={canvasRef}
                className="pointer-events-none absolute inset-0 h-full w-full object-contain"
              />

              <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-black/65 px-2.5 py-1 text-2xs font-semibold text-white backdrop-blur">
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      isScanning ? 'animate-pulse bg-emerald-400' : 'bg-amber-400'
                    )}
                  />
                  {isScanning ? 'Scanning' : 'Paused'} · {activeFacesCount} in view
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-black/65 px-2.5 py-1 text-2xs font-semibold text-emerald-300 backdrop-blur">
                  <CheckCircle2 size={11} /> {recognizedCount} marked present
                </span>
              </div>
            </>
          ) : (
            <div className="max-w-sm space-y-4 p-8 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-neutral-300">
                <Camera size={22} />
              </span>
              <div>
                <h3 className="text-sm font-bold text-white">Camera ready</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-neutral-400">
                  Start scanning to match faces against the enrolled embeddings and mark students
                  present automatically.
                </p>
              </div>

              {enrolledCount === 0 && !loadingFaces ? (
                <div className="flex items-start gap-2 rounded-md border border-amber-500/25 bg-amber-500/10 p-3 text-left">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-400" />
                  <p className="text-2xs leading-relaxed text-amber-200">
                    No faces enrolled for this class yet. Use <strong>Enrol face</strong> before
                    scanning.
                  </p>
                </div>
              ) : null}

              <div className="flex justify-center gap-2 pt-1">
                <Button size="sm" variant="accent" onClick={() => startCamera(selectedDeviceId)}>
                  <Camera size={13} /> Start scanning
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setIsEnrollModalOpen(true)}
                  className="border-white/15 bg-white/5 text-neutral-200 hover:bg-white/10 hover:text-white"
                >
                  <UserPlus size={13} /> Enrol face
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Recognition feed */}
        <div className="flex flex-col border-t border-line lg:border-l lg:border-t-0">
          <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
            <h3 className="inline-flex items-center gap-1.5 text-2xs font-bold uppercase tracking-[0.08em] text-muted">
              <Users size={12} /> Recognised
            </h3>
            <Badge tone="positive">{recognizedFeed.length}</Badge>
          </div>

          <div className="max-h-[260px] flex-1 space-y-1.5 overflow-y-auto p-3">
            {recognizedFeed.length === 0 ? (
              <div className="flex flex-col items-center px-3 py-10 text-center">
                <span className="mb-2 flex h-8 w-8 items-center justify-center rounded-md bg-sunken text-faint">
                  <ScanFace size={15} />
                </span>
                <p className="text-xs text-muted">Recognised students appear here as they walk in.</p>
              </div>
            ) : (
              recognizedFeed.map((item) => (
                <div
                  key={item.id}
                  className="flex animate-fade-in items-center justify-between gap-2 rounded-md border border-line bg-surface px-2.5 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-ink">{item.name}</p>
                    <p className="font-mono text-2xs text-faint">{item.rollNo}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="tnum text-2xs font-bold text-positive">{item.confidence}%</p>
                    <p className="tnum text-2xs text-faint">{item.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-line px-3 py-3">
            <div className="rounded-md bg-sunken px-3 py-2">
              <p className="tnum text-base font-bold leading-none text-ink">{recognizedCount}</p>
              <p className="mt-1 text-2xs font-semibold uppercase tracking-[0.08em] text-faint">
                Present
              </p>
            </div>
            <div className="rounded-md bg-sunken px-3 py-2">
              <p className="tnum text-base font-bold leading-none text-ink">{enrolledCount}</p>
              <p className="mt-1 text-2xs font-semibold uppercase tracking-[0.08em] text-faint">
                Face IDs
              </p>
            </div>
          </div>

          {cameraActive ? (
            <div className="border-t border-line p-3">
              <Button variant="secondary" className="w-full" size="sm" onClick={stopCamera}>
                <RefreshCw size={13} /> Stop and review roster
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      <FaceEnrollmentModal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        onEnrolled={handleEnrolledNewFace}
        classStudents={students}
      />
    </section>
  );
}
