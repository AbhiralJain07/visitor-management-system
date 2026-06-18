import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, RotateCcw, Check, Sparkles, UserCheck2, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (base64Image: string) => void;
  onSkipScan: () => void;
  isLoading?: boolean;
  scanStatus?: 'idle' | 'scanning' | 'match_found' | 'no_match' | 'error';
  errorMessage?: string | null;
  identifiedName?: string | null;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  onCapture,
  onSkipScan,
  isLoading = false,
  scanStatus = 'idle',
  errorMessage = null,
  identifiedName = null,
}) => {
  const webcamRef = useRef<Webcam>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setCapturedImage(imageSrc);
    }
  }, [webcamRef]);

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  };

  const handleRetry = () => {
    setCapturedImage(null);
  };

  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: 'user', // Selfie camera for reception desk Kiosk
  };

  return (
    <div className="flex flex-col items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-xl space-y-4 max-w-xl mx-auto w-full transition-all duration-300">
      <div className="text-center w-full">
        <h2 className="text-lg font-bold text-slate-800 flex items-center justify-center gap-2">
          <Sparkles className="text-blue-600 animate-pulse shrink-0" size={18} />
          Digital Face Recognizer
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">Place visitor face inside the guide overlay to scan credentials.</p>
      </div>

      {/* Camera Preview Box */}
      <div className="relative w-full aspect-[4/3] bg-slate-950 rounded-2xl overflow-hidden shadow-inner border border-slate-800">
        {capturedImage ? (
          <img
            src={capturedImage}
            alt="Visitor snapshot"
            className="w-full h-full object-cover transform scale-x-[-1]"
          />
        ) : (
          <>
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              className="w-full h-full object-cover transform scale-x-[-1]"
            />
            {/* Guide overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="w-56 h-72 border-2 border-dashed border-blue-500/50 rounded-[40%] flex items-center justify-center animate-pulse">
                <div className="w-48 h-64 border border-blue-400/25 rounded-[40%]"></div>
              </div>
              {/* Corner brackets */}
              <div className="absolute top-8 left-8 w-6 h-6 border-t-2 border-l-2 border-blue-500"></div>
              <div className="absolute top-8 right-8 w-6 h-6 border-t-2 border-r-2 border-blue-500"></div>
              <div className="absolute bottom-8 left-8 w-6 h-6 border-b-2 border-l-2 border-blue-500"></div>
              <div className="absolute bottom-8 right-8 w-6 h-6 border-b-2 border-r-2 border-blue-500"></div>
            </div>
          </>
        )}

        {/* Loading / Scanning state */}
        {isLoading && (
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center text-white space-y-3 z-20">
            <RefreshCw className="h-10 w-10 text-blue-500 animate-spin" />
            <div className="text-center">
              <span className="text-sm font-semibold tracking-wider block">Analyzing Biometric ID...</span>
              <span className="text-[11px] text-slate-400">Comparing details with local cache database</span>
            </div>
          </div>
        )}

        {/* Scan Status Banners inside preview */}
        {!isLoading && scanStatus === 'match_found' && identifiedName && (
          <div className="absolute bottom-4 left-4 right-4 bg-emerald-500/90 backdrop-blur-sm text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center justify-between shadow-lg animate-fadeIn z-20">
            <div className="flex items-center space-x-2">
              <ShieldCheck size={16} />
              <span>Identity Verified: {identifiedName}</span>
            </div>
            <span className="bg-white/20 px-2 py-0.5 rounded text-[10px]">100% Match</span>
          </div>
        )}

        {!isLoading && scanStatus === 'no_match' && (
          <div className="absolute bottom-4 left-4 right-4 bg-amber-500/90 backdrop-blur-sm text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center space-x-2 shadow-lg animate-fadeIn z-20">
            <AlertTriangle size={16} />
            <span>Face Not Recognized. Registering as new visitor.</span>
          </div>
        )}

        {!isLoading && scanStatus === 'error' && errorMessage && (
          <div className="absolute bottom-4 left-4 right-4 bg-red-500/95 backdrop-blur-sm text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center space-x-2 shadow-lg animate-fadeIn z-20">
            <AlertTriangle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Action Controls */}
      <div className="flex flex-col sm:flex-row gap-3 w-full pt-1">
        {capturedImage ? (
          <>
            <button
              onClick={handleRetry}
              disabled={isLoading}
              className="flex-1 min-h-[50px] bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl flex items-center justify-center gap-2 border border-slate-200 transition-all active:scale-[0.98]"
            >
              <RotateCcw size={18} />
              Retake Photo
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className="flex-1 min-h-[50px] bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98]"
            >
              <Check size={18} />
              Scan Face ID
            </button>
          </>
        ) : (
          <>
            <button
              onClick={capture}
              className="flex-1 min-h-[50px] bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98]"
            >
              <Camera size={18} />
              Capture Image
            </button>
            <button
              onClick={onSkipScan}
              className="flex-1 min-h-[50px] bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl flex items-center justify-center gap-2 border border-slate-200 transition-all active:scale-[0.98]"
            >
              <UserCheck2 size={18} />
              Bypass Scan
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default CameraCapture;
