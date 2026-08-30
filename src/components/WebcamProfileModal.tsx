import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  Upload,
  RefreshCw,
  Check,
  X,
  Trash2,
  AlertCircle,
  FlipHorizontal,
  User,
  Sparkles,
} from 'lucide-react';

interface WebcamProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPhotoUrl?: string;
  userName: string;
  userRoleLabel?: string;
  onSavePhoto: (photoDataUrl: string | '') => Promise<void> | void;
}

export const WebcamProfileModal: React.FC<WebcamProfileModalProps> = ({
  isOpen,
  onClose,
  currentPhotoUrl,
  userName,
  userRoleLabel = 'Profile Photo',
  onSavePhoto,
}) => {
  const [activeMode, setActiveMode] = useState<'webcam' | 'upload'>('webcam');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isFlashing, setIsFlashing] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop current active media stream
  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  // Start webcam with selected device
  const startCamera = useCallback(
    async (deviceId?: string) => {
      stopStream();
      setCameraError(null);
      setCapturedImage(null);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Webcam access is not supported in this browser environment. Please use file upload.');
        return;
      }

      try {
        const constraints: MediaStreamConstraints = {
          video: {
            deviceId: deviceId ? { exact: deviceId } : undefined,
            facingMode: deviceId ? undefined : 'user',
            width: { ideal: 640 },
            height: { ideal: 640 },
          },
          audio: false,
        };

        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
        setStream(newStream);

        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
          videoRef.current.play().catch(() => {});
        }

        // List video input devices
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevs = allDevices.filter((d) => d.kind === 'videoinput');
        setDevices(videoDevs);
        if (!selectedDeviceId && videoDevs.length > 0) {
          setSelectedDeviceId(videoDevs[0].deviceId);
        }
      } catch (err: unknown) {
        console.error('Camera access error:', err);
        const e = err as { name?: string; message?: string };
        if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
          setCameraError('Camera access was denied. Please allow camera permissions in your browser or switch to file upload.');
        } else if (e.name === 'NotFoundError' || e.name === 'DevicesNotFoundError') {
          setCameraError('No webcam was detected on your device. Please upload a photo from your computer.');
        } else {
          setCameraError('Unable to start webcam. Please verify camera permissions or choose a file.');
        }
      }
    },
    [stopStream, selectedDeviceId]
  );

  // Initialize camera when modal opens in webcam mode
  useEffect(() => {
    if (isOpen && activeMode === 'webcam' && !capturedImage) {
      startCamera(selectedDeviceId || undefined);
    } else if (!isOpen || activeMode !== 'webcam') {
      stopStream();
    }

    return () => {
      stopStream();
    };
  }, [isOpen, activeMode, startCamera, stopStream, capturedImage, selectedDeviceId]);

  // Ensure stream attached when video element mounts
  useEffect(() => {
    if (videoRef.current && stream && !capturedImage) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream, capturedImage]);

  // Process and crop canvas to compact square JPEG
  const processImageToDataUrl = (
    source: HTMLVideoElement | HTMLImageElement,
    sourceWidth: number,
    sourceHeight: number
  ): string => {
    const canvas = document.createElement('canvas');
    const targetDim = 360; // 360x360 square
    canvas.width = targetDim;
    canvas.height = targetDim;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Calculate center square crop
    const minDim = Math.min(sourceWidth, sourceHeight);
    const startX = (sourceWidth - minDim) / 2;
    const startY = (sourceHeight - minDim) / 2;

    // Draw cropped center square
    ctx.drawImage(source, startX, startY, minDim, minDim, 0, 0, targetDim, targetDim);

    return canvas.toDataURL('image/jpeg', 0.85);
  };

  // Capture frame from webcam
  const captureFrame = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    // Trigger visual flash
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 200);

    const dataUrl = processImageToDataUrl(video, video.videoWidth, video.videoHeight);
    setCapturedImage(dataUrl);
    stopStream();
  };

  // Trigger countdown before snap
  const triggerCountdown = () => {
    setCountdown(3);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          captureFrame();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Handle local file upload & resize
  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPG, PNG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const dataUrl = processImageToDataUrl(img, img.naturalWidth, img.naturalHeight);
        setCapturedImage(dataUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Retake or cancel preview
  const handleRetake = () => {
    setCapturedImage(null);
    if (activeMode === 'webcam') {
      startCamera(selectedDeviceId || undefined);
    }
  };

  // Save to database
  const handleSave = async () => {
    if (!capturedImage) return;
    setIsSaving(true);
    try {
      await onSavePhoto(capturedImage);
      handleClose();
    } catch (err) {
      console.error('Error saving profile photo:', err);
      alert('Failed to save profile photo. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Remove photo
  const handleRemovePhoto = async () => {
    if (confirm('Are you sure you want to remove this profile photo?')) {
      setIsSaving(true);
      try {
        await onSavePhoto('');
        handleClose();
      } catch (err) {
        console.error('Error removing profile photo:', err);
        alert('Failed to remove profile photo. Please try again.');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleClose = () => {
    stopStream();
    setCapturedImage(null);
    setCameraError(null);
    setCountdown(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0B2238] text-amber-400 flex items-center justify-center font-bold shadow-md">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base leading-tight">
                Update Profile Photo
              </h3>
              <p className="text-xs text-slate-500">
                {userName} • <span className="font-semibold text-slate-700">{userRoleLabel}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            id="close-photo-modal-btn"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector Tabs (Live Camera vs Upload) */}
        {!capturedImage && (
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setActiveMode('webcam');
                setCameraError(null);
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeMode === 'webcam'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              id="tab-webcam-mode"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Live Webcam</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveMode('upload');
                stopStream();
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeMode === 'upload'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              id="tab-upload-mode"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Photo</span>
            </button>
          </div>
        )}

        {/* Viewport Area */}
        <div className="relative w-full aspect-square max-w-[340px] mx-auto bg-slate-900 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center border-2 border-slate-200">
          {/* Shutter Flash Animation */}
          {isFlashing && (
            <div className="absolute inset-0 bg-white z-30 animate-out fade-out duration-200" />
          )}

          {/* Captured Image Preview */}
          {capturedImage ? (
            <div className="relative w-full h-full">
              <img
                src={capturedImage}
                alt="Captured Snapshot"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 left-3 right-3 bg-slate-950/80 backdrop-blur-xs text-white text-[11px] px-3 py-1.5 rounded-xl text-center border border-white/10">
                Previewing Snapshot
              </div>
            </div>
          ) : activeMode === 'webcam' ? (
            /* Live Webcam Stream */
            cameraError ? (
              <div className="p-6 text-center text-white space-y-3">
                <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
                <p className="text-xs text-slate-200 font-medium leading-relaxed">
                  {cameraError}
                </p>
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => startCamera(selectedDeviceId || undefined)}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Try Again</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMode('upload')}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-medium transition-all cursor-pointer"
                  >
                    Switch to File Upload
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative w-full h-full flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Profile Portrait Guide Overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-56 h-56 rounded-full border-2 border-dashed border-white/60 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
                </div>

                {/* Countdown Display */}
                {countdown !== null && (
                  <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-20">
                    <span className="text-7xl font-black text-amber-400 animate-ping">
                      {countdown}
                    </span>
                  </div>
                )}

                {/* Guidance Pill */}
                <div className="absolute top-3 bg-slate-950/70 backdrop-blur-xs text-white text-[10px] font-medium px-3 py-1 rounded-full border border-white/10 pointer-events-none">
                  Center your face within the circle
                </div>

                {/* Switch Camera if multiple */}
                {devices.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const currentIndex = devices.findIndex((d) => d.deviceId === selectedDeviceId);
                      const nextDevice = devices[(currentIndex + 1) % devices.length];
                      if (nextDevice) {
                        setSelectedDeviceId(nextDevice.deviceId);
                        startCamera(nextDevice.deviceId);
                      }
                    }}
                    className="absolute bottom-3 right-3 p-2 bg-slate-950/70 hover:bg-slate-900 text-white rounded-xl border border-white/20 text-xs transition-all cursor-pointer"
                    title="Switch Camera"
                  >
                    <FlipHorizontal className="w-4 h-4" />
                  </button>
                )}
              </div>
            )
          ) : (
            /* File Upload Mode */
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileUpload(e.dataTransfer.files[0]);
                }
              }}
              className="w-full h-full flex flex-col items-center justify-center p-6 text-center cursor-pointer hover:bg-slate-800 transition-colors space-y-3"
            >
              <div className="w-14 h-14 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">
                  Click to select photo or drag & drop
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  PNG, JPG or WEBP (automatically optimized)
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          {capturedImage ? (
            /* Preview Action Buttons */
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleRetake}
                disabled={isSaving}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                id="retake-photo-btn"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retake Photo</span>
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
                id="save-photo-btn"
              >
                <Check className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save Profile Photo'}</span>
              </button>
            </div>
          ) : activeMode === 'webcam' && !cameraError ? (
            /* Webcam Capture Action Buttons */
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={captureFrame}
                disabled={countdown !== null}
                className="flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                id="capture-now-btn"
              >
                <Camera className="w-4 h-4" />
                <span>SNAP PHOTO NOW</span>
              </button>

              <button
                type="button"
                onClick={triggerCountdown}
                disabled={countdown !== null}
                className="py-3 px-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
                title="3-Second Timer Snap"
                id="timer-snap-btn"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>3s Timer</span>
              </button>
            </div>
          ) : null}

          {/* Current Photo Info & Remove Option */}
          {currentPhotoUrl && (
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src={currentPhotoUrl}
                  alt="Current Avatar"
                  className="w-7 h-7 rounded-full object-cover border border-slate-200"
                />
                <span className="text-[11px] text-slate-500">Current photo active</span>
              </div>

              <button
                type="button"
                onClick={handleRemovePhoto}
                disabled={isSaving}
                className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                id="remove-current-photo-btn"
              >
                <Trash2 className="w-3 h-3" />
                <span>Remove Photo</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
