import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, RotateCcw, Check, Sparkles, UserCheck2, RefreshCw } from 'lucide-react';

interface FaceCameraProps {
  onCapture: (base64Image: string) => void;
  onSkipScan: () => void;
  isLoading?: boolean;
}

export const FaceCamera: React.FC<FaceCameraProps> = ({ onCapture, onSkipScan, isLoading = false }) => {
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
    facingMode: 'user', // Selfie camera
  };

  return (
    <div className="flex flex-col items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-xl space-y-4 max-w-xl mx-auto w-full">
      <div className="text-center">
        <h2 className="text-lg font-bold text-slate-800 flex items-center justify-center gap-2">
          <Sparkles className="text-blue-600 animate-pulse" size={18} />
          Digital Face Scanner
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">Center your face in the guide overlay to register or log in.</p>
      </div>

      {/* Camera/Preview Area */}
      <div className="relative w-full aspect-[4/3] bg-slate-900 rounded-xl overflow-hidden shadow-inner border border-slate-800">
        {capturedImage ? (
          // Frozen Snapshot Preview
          <img src={capturedImage} alt="Captured face preview" className="w-full h-full object-cover transform scale-x-[-1]" />
        ) : (
          // Live Webcam Stream
          <>
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              className="w-full h-full object-cover transform scale-x-[-1]"
            />
            {/* Target Silhouette Overlay Guide */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <svg className="w-64 h-64 text-blue-500/40 animate-pulse" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1">
                {/* Oval Guide outline */}
                <ellipse cx="50" cy="48" rx="20" ry="28" />
                <path d="M42,75 Q50,68 58,75" strokeWidth="0.8" />
                <circle cx="50" cy="48" r="42" strokeDasharray="3 3" strokeWidth="0.5" />
              </svg>
            </div>
          </>
        )}

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center text-white space-y-2 z-20">
            <RefreshCw className="h-8 w-8 text-blue-400 animate-spin" />
            <span className="text-xs font-semibold tracking-wider">Matching face patterns...</span>
          </div>
        )}
      </div>

      {/* Large Touch Actions */}
      <div className="flex flex-col sm:flex-row gap-3 w-full justify-center pt-2">
        {capturedImage ? (
          <>
            <button
              onClick={handleRetry}
              disabled={isLoading}
              className="flex-1 min-h-[50px] bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 border border-slate-200 transition-colors"
            >
              <RotateCcw size={18} />
              Retry Photo
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className="flex-1 min-h-[50px] bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all"
            >
              <Check size={18} />
              Confirm & Search
            </button>
          </>
        ) : (
          <>
            <button
              onClick={capture}
              className="flex-1 min-h-[50px] bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all"
            >
              <Camera size={18} />
              Capture Image
            </button>
            <button
              onClick={onSkipScan}
              className="flex-1 min-h-[50px] bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 border border-slate-200 transition-colors"
            >
              <UserCheck2 size={18} />
              Manual Check-in
            </button>
          </>
        )}
      </div>
    </div>
  );
};
