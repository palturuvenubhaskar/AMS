import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, CameraOff, CheckCircle2, AlertCircle, RefreshCw, X, Upload, Sparkles, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { loadFaceApiModels, detectSingleFace } from '../services/faceService';

export default function FaceEnrollmentModal({ isOpen, onClose, onEnrolled, preselectedStudentId, classStudents = [] }) {
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

  // Sync preselected student
  useEffect(() => {
    if (preselectedStudentId) setSelectedStudentId(preselectedStudentId);
  }, [preselectedStudentId]);

  // Load models when modal opens
  useEffect(() => {
    if (isOpen) {
      setModelsLoading(true);
      loadFaceApiModels()
        .then(() => setModelsLoading(false))
        .catch(err => {
          console.error(err);
          setModelsLoading(false);
          toast.error('Failed to load face detection models.');
        });
    } else {
      stopCamera();
      setCapturedImage(null);
      setCapturedDescriptor(null);
      setFaceDetected(false);
    }
  }, [isOpen]);

  const stopCamera = useCallback(() => {
    if (detectionTimerRef.current) {
      clearInterval(detectionTimerRef.current);
      detectionTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
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
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
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
      console.error('Camera error:', err);
      setCameraError(err.message || 'Unable to access camera.');
      toast.error('Camera access denied or unavailable.');
    }
  };

  // Run face check every 300ms on video
  const startLiveDetection = () => {
    if (detectionTimerRef.current) clearInterval(detectionTimerRef.current);
    detectionTimerRef.current = setInterval(async () => {
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;
      try {
        const detection = await detectSingleFace(videoRef.current);
        setFaceDetected(!!detection);
      } catch (e) {
        // ignore background detection errors
      }
    }, 350);
  };

  // Capture frame from video and extract descriptor
  const handleCapture = async () => {
    if (!videoRef.current) return;
    setDetecting(true);

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      // Mirror image horizontally for natural selfie view
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

      // Detect face on captured image
      const detection = await detectSingleFace(canvas);

      if (!detection) {
        toast.error('No clear face detected! Please look directly into the camera and ensure good lighting.');
        setDetecting(false);
        return;
      }

      setCapturedImage(dataUrl);
      setCapturedDescriptor(Array.from(detection.descriptor));
      stopCamera();
      toast.success('Face snapshot captured successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to analyze captured frame.');
    } finally {
      setDetecting(false);
    }
  };

  // Handle local file upload
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
            toast.error('No face detected in uploaded photo. Please select a clearer portrait.');
            setDetecting(false);
            return;
          }
          setCapturedImage(dataUrl);
          setCapturedDescriptor(Array.from(detection.descriptor));
          stopCamera();
          toast.success('Face portrait verified successfully!');
        } catch (err) {
          toast.error('Error analyzing image.');
        } finally {
          setDetecting(false);
        }
      };
    };
    reader.readAsDataURL(file);
  };

  const handleSaveEnrollment = async () => {
    if (!selectedStudentId) {
      return toast.error('Please select a student.');
    }
    if (!capturedDescriptor || !capturedImage) {
      return toast.error('Please capture or upload a face portrait first.');
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/face/enroll', {
        studentId: parseInt(selectedStudentId, 10),
        embedding: capturedDescriptor,
        image: capturedImage,
        angleType: 'front',
      });

      toast.success('Student Face registered successfully in FRS!');
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
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to enroll face.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentStudent = classStudents.find(s => s.id == selectedStudentId || s.user_id == selectedStudentId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-white dark:bg-[#12141d] border border-slate-200 dark:border-[#222430] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-[#1e202e]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-purple/10 text-brand-purple flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5 text-brand-purple" />
            </div>
            <div>
              <h3 className="text-slate-900 dark:text-slate-100 font-bold text-lg">FRS Face Enrollment</h3>
              <p className="text-gray-400 text-xs font-medium">Register 128-d AI Face ID descriptor in the database</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1e202e] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Student selection */}
          <div>
            <label className="block text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">
              Select Student to Enroll
            </label>
            {classStudents.length > 0 ? (
              <select
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#0a0b10] border border-slate-200 dark:border-[#222430] text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-brand-purple/20 transition-all cursor-pointer"
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
              >
                <option value="">-- Choose Student from Class --</option>
                {classStudents.map((s) => (
                  <option key={s.id || s.user_id} value={s.id || s.user_id}>
                    {s.roll_no} — {s.full_name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder="Student User ID"
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#0a0b10] border border-slate-200 dark:border-[#222430] text-slate-900 dark:text-slate-100 font-medium"
              />
            )}
            {currentStudent && (
              <div className="mt-2 text-xs text-brand-purple font-semibold flex items-center gap-1.5">
                <UserCheck className="w-4 h-4" /> Enrolling Face ID for: {currentStudent.full_name} ({currentStudent.roll_no})
              </div>
            )}
          </div>

          {/* Camera Viewfinder & Preview */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-video flex items-center justify-center border-2 border-slate-800 shadow-inner">
            {modelsLoading ? (
              <div className="text-center text-gray-400 p-6">
                <div className="w-8 h-8 border-2 border-brand-purple border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm font-medium">Loading AI Neural Face Models...</p>
              </div>
            ) : capturedImage ? (
              <div className="relative w-full h-full">
                <img src={capturedImage} alt="Captured Face" className="w-full h-full object-cover" />
                <div className="absolute top-3 left-3 bg-green-500/90 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-md shadow-lg">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Face Verified (128-d descriptor ready)
                </div>
                <button
                  onClick={() => {
                    setCapturedImage(null);
                    setCapturedDescriptor(null);
                    startCamera();
                  }}
                  className="absolute bottom-3 right-3 bg-black/70 hover:bg-black text-white text-xs font-semibold px-3 py-1.5 rounded-xl backdrop-blur-md transition-all flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Retake
                </button>
              </div>
            ) : cameraActive ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform scale-x-[-1]"
                />

                {/* Face Guide Oval */}
                <div className={`absolute w-44 h-56 rounded-[50%] border-2 transition-all duration-300 pointer-events-none flex items-center justify-center ${
                  faceDetected ? 'border-green-400 shadow-[0_0_20px_rgba(34,197,94,0.4)] scale-105' : 'border-dashed border-white/50 animate-pulse'
                }`}>
                  <span className={`text-[11px] font-bold px-2 py-1 rounded-md backdrop-blur-md shadow ${
                    faceDetected ? 'bg-green-500 text-white' : 'bg-black/60 text-white/80'
                  }`}>
                    {faceDetected ? '✓ Face Locked' : 'Align Face Here'}
                  </span>
                </div>

                <div className="absolute bottom-3 left-3 flex gap-2">
                  <span className="bg-black/60 text-white text-[11px] px-2.5 py-1 rounded-full backdrop-blur-sm">
                    {faceDetected ? '🟢 Ready to capture' : '🟡 Looking for face...'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center p-6 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-800 text-gray-400 flex items-center justify-center mx-auto">
                  <Camera className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm">Camera Offline</h4>
                  <p className="text-gray-400 text-xs max-w-xs mx-auto mt-1">
                    Turn on the webcam to scan a student's face, or upload a portrait photo.
                  </p>
                </div>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={startCamera}
                    className="px-4 py-2 rounded-xl bg-brand-purple text-white text-xs font-bold shadow-lg shadow-brand-purple/30 hover:opacity-90 transition-all flex items-center gap-1.5"
                  >
                    <Camera className="w-4 h-4" /> Start Camera
                  </button>
                  <label className="px-4 py-2 rounded-xl bg-slate-800 text-gray-200 text-xs font-bold hover:bg-slate-700 transition-all cursor-pointer flex items-center gap-1.5">
                    <Upload className="w-4 h-4" /> Upload Photo
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                  </label>
                </div>
                {cameraError && (
                  <p className="text-red-400 text-xs flex items-center justify-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {cameraError}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Action buttons during camera active */}
          {cameraActive && !capturedImage && (
            <div className="flex gap-3">
              <button
                onClick={stopCamera}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-[#1e202e] text-gray-600 dark:text-gray-300 font-bold text-xs hover:bg-slate-200 transition-all flex items-center justify-center gap-1.5"
              >
                <CameraOff className="w-4 h-4" /> Cancel Camera
              </button>
              <button
                onClick={handleCapture}
                disabled={detecting}
                className="flex-[2] py-2.5 rounded-xl bg-brand-purple text-white font-bold text-xs shadow-lg shadow-brand-purple/30 hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {detecting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Analyzing Face...
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" /> Capture Face Snapshot
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 dark:bg-[#0a0b10] border-t border-slate-100 dark:border-[#1e202e] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-white dark:bg-[#12141d] border border-slate-200 dark:border-[#222430] text-gray-600 dark:text-gray-400 font-bold text-sm hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveEnrollment}
            disabled={!capturedDescriptor || !selectedStudentId || isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-sm shadow-lg shadow-green-600/30 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Saving to Database...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" /> Save & Enroll Student
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
