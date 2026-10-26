import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, CameraOff, RefreshCw, CheckCircle2, AlertTriangle, Users, UserPlus, Play, Pause, Sparkles, Volume2, VolumeX } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { loadFaceApiModels, detectAllFaces, createFaceMatcher } from '../services/faceService';
import FaceEnrollmentModal from './FaceEnrollmentModal';

export default function FRSScanner({ classId, students = [], records = {}, onUpdateRecord, onClose }) {
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

  // Sound beep using Web Audio API
  const playRecognitionSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    } catch (e) {
      // Audio might be blocked before user interaction
    }
  }, [soundEnabled]);

  // Load enrolled faces for class
  const fetchClassFaces = useCallback(async () => {
    if (!classId) return;
    setLoadingFaces(true);
    try {
      const res = await api.get(`/classes/${classId}/faces`);
      const faces = res.data.faces || [];
      setEnrolledFaces(faces);
      matcherRef.current = createFaceMatcher(faces, 0.55);
    } catch (err) {
      console.error('Failed to load class faces:', err);
      toast.error('Could not load enrolled face data.');
    } finally {
      setLoadingFaces(false);
    }
  }, [classId]);

  // Initialize models and faces
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await loadFaceApiModels();
        if (mounted) setLoadingModels(false);
      } catch (err) {
        if (mounted) {
          setLoadingModels(false);
          toast.error('Failed to load AI face detection models.');
        }
      }
    })();

    fetchClassFaces();

    // Query camera devices
    if (navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then(devices => {
        const videoInputs = devices.filter(d => d.kind === 'videoinput');
        setAvailableDevices(videoInputs);
        if (videoInputs.length > 0) setSelectedDeviceId(videoInputs[0].deviceId);
      }).catch(console.error);
    }

    return () => {
      mounted = false;
      stopCamera();
    };
  }, [classId, fetchClassFaces]);

  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setActiveFacesCount(0);
    // Clear canvas
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
    } catch (err) {
      console.error('Camera startup error:', err);
      toast.error('Unable to open camera. Please grant camera permission in your browser.');
    }
  };

  // Main real-time FRS detection & recognition loop
  const runDetectionLoop = () => {
    const detect = async (timestamp) => {
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) {
        animationFrameRef.current = requestAnimationFrame(detect);
        return;
      }

      // Throttle detection to ~120ms intervals for optimum UI responsiveness & low CPU load
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
              let label = 'Unknown Face';
              let isMatch = false;
              let studentInfo = null;
              let confidence = Math.round((1 - (d.detection.score ? 1 - d.detection.score : 0.5)) * 100);

              if (matcher && d.descriptor) {
                const bestMatch = matcher.findBestMatch(d.descriptor);
                if (bestMatch.label !== 'unknown') {
                  const studentId = parseInt(bestMatch.label, 10);
                  studentInfo = students.find(s => s.id === studentId || s.user_id === studentId);
                  if (studentInfo) {
                    isMatch = true;
                    confidence = Math.max(65, Math.round((1 - bestMatch.distance) * 100));
                    label = `${studentInfo.full_name} (${studentInfo.roll_no})`;

                    // Mark present if not already marked
                    if (!recentlyMarkedRef.current.has(studentId)) {
                      recentlyMarkedRef.current.add(studentId);
                      onUpdateRecord(studentId, 'present');
                      playRecognitionSound();
                      setRecognizedFeed(prev => [
                        {
                          id: `${studentId}-${Date.now()}`,
                          name: studentInfo.full_name,
                          rollNo: studentInfo.roll_no,
                          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                          confidence,
                        },
                        ...prev.slice(0, 9),
                      ]);
                      toast.success(`Verified: ${studentInfo.full_name} (${studentInfo.roll_no})`, { id: `frs-${studentId}` });
                    }
                  }
                }
              }

              // Draw custom stylized HUD bounding box on canvas
              ctx.save();
              ctx.lineWidth = 3;
              if (isMatch) {
                ctx.strokeStyle = '#10b981'; // Green-500
                ctx.shadowColor = 'rgba(16, 185, 129, 0.7)';
                ctx.shadowBlur = 12;
              } else {
                ctx.strokeStyle = '#f59e0b'; // Amber-500
                ctx.shadowColor = 'rgba(245, 158, 11, 0.5)';
                ctx.shadowBlur = 8;
              }

              // Draw rounded rect corners
              const radius = 10;
              ctx.beginPath();
              ctx.roundRect(box.x, box.y, box.width, box.height, radius);
              ctx.stroke();

              // Draw top-corner targeting brackets
              const cornerLen = Math.min(20, box.width / 4);
              ctx.lineWidth = 4;
              ctx.beginPath();
              // Top-left
              ctx.moveTo(box.x, box.y + cornerLen);
              ctx.lineTo(box.x, box.y);
              ctx.lineTo(box.x + cornerLen, box.y);
              // Top-right
              ctx.moveTo(box.x + box.width - cornerLen, box.y);
              ctx.lineTo(box.x + box.width, box.y);
              ctx.lineTo(box.x + box.width, box.y + cornerLen);
              // Bottom-left
              ctx.moveTo(box.x, box.y + box.height - cornerLen);
              ctx.lineTo(box.x, box.y + box.height);
              ctx.lineTo(box.x + cornerLen, box.y + box.height);
              // Bottom-right
              ctx.moveTo(box.x + box.width - cornerLen, box.y + box.height);
              ctx.lineTo(box.x + box.width, box.y + box.height);
              ctx.lineTo(box.x + box.width, box.y + box.height - cornerLen);
              ctx.stroke();

              // Draw Header Badge Pill
              const tagText = isMatch ? `✓ ${label} • ${confidence}%` : `⚠️ ${label}`;
              ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
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
        } catch (e) {
          // ignore detection frame drops
        }
      }

      animationFrameRef.current = requestAnimationFrame(detect);
    };

    animationFrameRef.current = requestAnimationFrame(detect);
  };

  const handleDeviceChange = (e) => {
    const devId = e.target.value;
    setSelectedDeviceId(devId);
    if (cameraActive) {
      startCamera(devId);
    }
  };

  const handleEnrolledNewFace = (faceData) => {
    // Add face to local state & re-create matcher
    setEnrolledFaces(prev => {
      const updated = [
        ...prev.filter(f => f.studentId !== faceData.studentId),
        faceData,
      ];
      matcherRef.current = createFaceMatcher(updated, 0.55);
      return updated;
    });
    fetchClassFaces();
  };

  const recognizedCount = Object.values(records).filter(r => r === 'present').length;
  const enrolledCount = enrolledFaces.length;

  return (
    <div className="bg-slate-900 border-2 border-brand-purple/40 rounded-3xl overflow-hidden shadow-2xl text-white mb-8">
      {/* Top Banner & Controls */}
      <div className="p-4 md:p-6 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-brand-purple/20 text-brand-purple flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5 text-brand-purple" />
            </div>
            {cameraActive && isScanning && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-white font-bold text-lg">AI Facial Recognition Attendance</h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-brand-purple/20 text-brand-purple border border-brand-purple/30">
                128-D FRS
              </span>
            </div>
            <p className="text-gray-400 text-xs">
              {enrolledCount} of {students.length} students enrolled with Face ID in database
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2.5">
          {availableDevices.length > 1 && (
            <select
              value={selectedDeviceId}
              onChange={handleDeviceChange}
              className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-medium text-white focus:outline-none"
            >
              {availableDevices.map(d => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Camera ${d.deviceId.slice(0, 5)}`}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => setSoundEnabled(p => !p)}
            title={soundEnabled ? 'Mute Recognition Sound' : 'Enable Recognition Sound'}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-300 transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-green-400" /> : <VolumeX className="w-4 h-4 text-gray-400" />}
          </button>

          <button
            onClick={() => setIsEnrollModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-brand-purple border border-brand-purple/30 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
          >
            <UserPlus className="w-4 h-4" /> Quick Enroll Face
          </button>

          {cameraActive ? (
            <>
              <button
                onClick={() => setIsScanning(p => !p)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isScanning ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-green-600 text-white'
                }`}
              >
                {isScanning ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> Resume</>}
              </button>
              <button
                onClick={stopCamera}
                className="px-4 py-2 rounded-xl bg-red-600/80 hover:bg-red-600 text-white text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <CameraOff className="w-4 h-4" /> Stop Camera
              </button>
            </>
          ) : (
            <button
              onClick={() => startCamera(selectedDeviceId)}
              disabled={loadingModels}
              className="px-5 py-2.5 rounded-xl bg-brand-purple hover:bg-brand-purple/90 text-white text-xs font-bold shadow-lg shadow-brand-purple/30 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Camera className="w-4 h-4" /> Open Camera & Scan
            </button>
          )}
        </div>
      </div>

      {/* Main View Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 min-h-[420px]">
        {/* Camera Feed & Canvas Overlay (2 cols on large screen) */}
        <div className="lg:col-span-2 relative bg-black flex items-center justify-center overflow-hidden min-h-[360px]">
          {loadingModels ? (
            <div className="text-center p-8 space-y-3">
              <div className="w-10 h-10 border-3 border-brand-purple border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-semibold text-gray-300">Loading AI Vision Neural Networks...</p>
              <p className="text-xs text-gray-500">Initializing TinyFaceDetector & 128-d FaceMatcher</p>
            </div>
          ) : cameraActive ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain max-h-[500px]"
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full object-contain max-h-[500px] pointer-events-none"
              />

              {/* Viewport HUD indicators */}
              <div className="absolute top-4 left-4 flex flex-wrap gap-2 pointer-events-none">
                <span className="bg-black/70 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/10 shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  LIVE • {activeFacesCount} face{activeFacesCount === 1 ? '' : 's'} in view
                </span>
                <span className="bg-black/70 backdrop-blur-md text-emerald-400 text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/10 shadow-lg">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {recognizedCount} Present
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center p-8 max-w-md space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-slate-800/80 border border-slate-700 text-brand-purple flex items-center justify-center mx-auto shadow-inner">
                <Camera className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-white font-bold text-lg">Classroom Camera Ready</h4>
                <p className="text-gray-400 text-xs mt-1.5 leading-relaxed">
                  Click below to activate live AI scanning. The camera will detect student faces and verify them against registered database embeddings in real-time.
                </p>
              </div>

              {enrolledCount === 0 && !loadingFaces && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs text-left flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-400 mt-0.5" />
                  <div>
                    <span className="font-bold">No enrolled faces yet in this class!</span>
                    <p className="text-amber-200/80 text-[11px] mt-0.5">
                      Click <strong>"Quick Enroll Face"</strong> to enroll your own face or a student's face so the AI can recognize them.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => startCamera(selectedDeviceId)}
                  className="px-6 py-3 rounded-2xl bg-brand-purple hover:bg-brand-purple/90 text-white font-bold text-sm shadow-xl shadow-brand-purple/30 hover:scale-[1.02] transition-all flex items-center gap-2"
                >
                  <Camera className="w-5 h-5" /> Start FRS Scan Now
                </button>
                <button
                  onClick={() => setIsEnrollModalOpen(true)}
                  className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition-all flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4 text-brand-purple" /> Enroll Face
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Live Recognition Feed & Roster Status (1 col) */}
        <div className="bg-slate-950/60 border-t lg:border-t-0 lg:border-l border-slate-800 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-purple" /> Live Recognition Feed
              </h4>
              <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-md border border-green-500/20">
                {recognizedFeed.length} Verified
              </span>
            </div>

            {/* Scrollable feed */}
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {recognizedFeed.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-xs">
                  <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-2 text-gray-600">
                    ⏱️
                  </div>
                  Faces recognized by the camera will appear here in real-time.
                </div>
              ) : (
                recognizedFeed.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-slate-900/90 border border-emerald-500/30 flex items-center justify-between animate-fade-in shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                        ✓
                      </div>
                      <div>
                        <div className="text-white text-xs font-bold">{item.name}</div>
                        <div className="text-gray-400 text-[11px] font-mono">{item.rollNo}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] font-bold text-emerald-400">{item.confidence}% Match</div>
                      <div className="text-[10px] text-gray-500">{item.time}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Bottom stats summary */}
          <div className="mt-6 pt-4 border-t border-slate-800/80">
            <div className="grid grid-cols-2 gap-3 text-center mb-3">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-lg font-black text-green-400">{recognizedCount}</div>
                <div className="text-[10px] font-semibold text-gray-400 uppercase">Present</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-lg font-black text-brand-purple">{enrolledCount}</div>
                <div className="text-[10px] font-semibold text-gray-400 uppercase">Enrolled IDs</div>
              </div>
            </div>

            {cameraActive && (
              <button
                onClick={stopCamera}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4 text-green-400" /> Apply & Review Attendance
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Face Enrollment Modal */}
      <FaceEnrollmentModal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        onEnrolled={handleEnrolledNewFace}
        classStudents={students}
      />
    </div>
  );
}
