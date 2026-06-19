/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Scanner — QR scan screen with real camera integration & advanced UX features.
 * Integrates navigator.mediaDevices.getUserMedia and jsQR decoder.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Zap, 
  Image as ImageIcon, 
  Keyboard, 
  ShieldCheck, 
  AlertCircle, 
  Check, 
  ChevronRight,
  Info
} from 'lucide-react';
import StatusBar from './StatusBar';
import jsQR from 'jsqr';
import { generateKHQRString } from '../lib/khqr';

/* ─────────────────────────────────────────────
   Types
   ───────────────────────────────────────────── */
interface ScannerProps {
  onClose: () => void;
  onScan: (data: string) => void;
}


/* ─────────────────────────────────────────────
   Autofocus Indicator
   ───────────────────────────────────────────── */
const AutofocusIndicator = () => {
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      {/* Central target circles */}
      <motion.div 
        className="w-16 h-16 border border-white/25 rounded-full relative flex items-center justify-center"
        animate={{ scale: [0.95, 1.1, 0.95], opacity: [0.25, 0.55, 0.25] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="absolute w-2 h-2 border border-white/40 rounded-full" />
      </motion.div>
      
      {/* Scanning indicators */}
      <motion.div 
        className="absolute w-1.5 h-1.5 bg-[#4ade80] rounded-full shadow-[0_0_8px_#4ade80]"
        style={{ top: '22%', left: '26%' }}
        animate={{ opacity: [0.2, 0.9, 0.2], scale: [0.9, 1.2, 0.9] }}
        transition={{ duration: 1.4, repeat: Infinity, delay: 0.1 }}
      />
      <motion.div 
        className="absolute w-1.5 h-1.5 bg-[#00bcd4] rounded-full shadow-[0_0_8px_#00bcd4]"
        style={{ bottom: '18%', right: '24%' }}
        animate={{ opacity: [0.2, 0.9, 0.2], scale: [0.9, 1.2, 0.9] }}
        transition={{ duration: 1.8, repeat: Infinity, delay: 0.5 }}
      />
    </div>
  );
};

/* ─────────────────────────────────────────────
   Partner badge row
   ───────────────────────────────────────────── */
const PartnerBadges = () => (
  <div className="flex items-center justify-center gap-3 flex-wrap opacity-95">
    {/* BAKONG */}
    <div className="h-6 px-2 bg-[#008c9e]/90 rounded flex items-center justify-center shadow-sm">
      <span className="text-[9px] font-extrabold text-white tracking-wider uppercase">BAKONG</span>
    </div>
    {/* KHQR */}
    <div className="h-6 px-2.5 bg-[#e63946]/95 rounded flex items-center justify-center shadow-sm">
      <span className="text-[9px] font-extrabold text-white tracking-wider uppercase">KHQR</span>
    </div>
    {/* VISA */}
    <div className="h-6 px-2 bg-white rounded flex items-center justify-center shadow-sm">
      <span className="text-[9px] font-black italic text-[#1a1f71] tracking-wider">VISA</span>
    </div>
    {/* Mastercard */}
    <div className="h-6 w-10 bg-white rounded flex items-center justify-center relative overflow-hidden shadow-sm">
      <div className="absolute left-1.5 w-4 h-4 rounded-full bg-[#eb001b] opacity-90" />
      <div className="absolute right-1.5 w-4 h-4 rounded-full bg-[#f79e1b] opacity-90" />
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   Main component
   ───────────────────────────────────────────── */
export default function Scanner({ onClose, onScan }: ScannerProps) {
  const [flashOn, setFlashOn] = useState(false);
  const [scanning, setScanning] = useState(true);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [scanError, setScanError] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Help troubleshooting banner (appears after 5s without scan success)
  const [showHelpBanner, setShowHelpBanner] = useState(false);

  // Manual entry modal
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualCode, setManualCode] = useState('');

  // Refs for video stream
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Play haptic & beep sounds dynamically using Web Audio API */
  const playBeep = (isSuccess = true) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      // Resume if suspended (browser security rules)
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (isSuccess) {
        // High frequency crisp electronic double notification tone
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.015);
        gain.gain.setValueAtTime(0.25, ctx.currentTime + 0.07);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.11);
      } else {
        // Low error buzz
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, ctx.currentTime);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.35, ctx.currentTime + 0.25);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {
      console.warn("AudioContext failed to initialize beep:", e);
    }
  };

  /* Toast alerts */
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => prev === msg ? null : prev);
    }, 2800);
  };

  /* Start getUserMedia camera stream */
  const startCamera = async () => {
    setCameraError(null);
    try {
      // Clear current stream if any
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        // Play the stream
        await videoRef.current.play();
      }

      // Start the decoder loop
      startDecoderLoop();
    } catch (err: any) {
      console.error("Camera capture error: ", err);
      setCameraError(
        "Camera access is required to scan QR codes for transfers. Please grant camera permission in your browser settings."
      );
    }
  };

  /* Real-time frame loop decoder */
  const startDecoderLoop = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const scanFrame = () => {
      if (!scanning || scanSuccess) return;

      if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
        // Fit canvas to video width & height
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        try {
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (code && code.data) {
            handleScanSuccess(code.data);
            return;
          }
        } catch (err) {
          console.error("jsQR error: ", err);
        }
      }

      animationFrameRef.current = requestAnimationFrame(scanFrame);
    };

    animationFrameRef.current = requestAnimationFrame(scanFrame);
  };

  /* Successful Scan */
  const handleScanSuccess = (data: string) => {
    setScanning(false);
    setScanSuccess(true);
    setScanError(false);

    // Play successful haptic & beep
    playBeep(true);
    if (navigator.vibrate) {
      navigator.vibrate(80);
    }

    // Redirect with animation delay
    setTimeout(() => {
      onScan(data);
    }, 600);
  };

  /* Scan failure/error feedback */
  const handleScanFailure = (msg: string) => {
    setScanError(true);
    playBeep(false);
    showToast(msg);
    setTimeout(() => {
      setScanError(false);
    }, 1500);
  };

  /* Toggle LED Torch constraints */
  const toggleFlash = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;

    try {
      const capabilities = track.getCapabilities() as any;
      if (capabilities.torch) {
        const nextState = !flashOn;
        await track.applyConstraints({
          advanced: [{ torch: nextState } as any]
        });
        setFlashOn(nextState);
        showToast(nextState ? "Flash turned on" : "Flash turned off");
      } else {
        showToast("Flash is not supported on this device browser");
      }
    } catch (e) {
      console.error("Failed to control flashlight:", e);
      showToast("Unable to control flash");
    }
  };

  /* Trigger hidden file selector input click */
  const handleGalleryClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  /* Scan from photo library */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    showToast("Loading and decoding QR code from image...");

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          handleScanFailure("Unable to create image decoder.");
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          
          if (code && code.data) {
            handleScanSuccess(code.data);
          } else {
            handleScanFailure("No valid QR code detected in the image.");
          }
        } catch (err) {
          console.error(err);
          handleScanFailure("Image analysis error.");
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  /* Manual Code entry validation */
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) {
      showToast("Please enter a payment code.");
      return;
    }

    if (manualCode.length < 6 || manualCode.length > 20) {
      handleScanFailure("Payment code must be between 6 and 20 digits.");
      return;
    }

    // Generate valid KHQR string format so Payment.tsx parses it successfully
    const generatedQR = generateKHQRString({
      accountNo: manualCode.trim(),
      name: "ABA MERCHANT " + manualCode.substring(0, 4),
      amount: undefined,
      currency: "840", // USD
      merchantName: "Merchant " + manualCode,
      city: "Phnom Penh"
    });

    setShowManualModal(false);
    handleScanSuccess(generatedQR);
  };

  /* Lifecycle mounts */
  useEffect(() => {
    startCamera();

    return () => {
      // Clean up track stream & loops
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  /* Troubleshooter logic banner */
  useEffect(() => {
    let timer: any;
    if (scanning && !scanSuccess && !cameraError) {
      timer = setTimeout(() => {
        setShowHelpBanner(true);
      }, 5000);
    } else {
      setShowHelpBanner(false);
    }
    return () => clearTimeout(timer);
  }, [scanning, scanSuccess, cameraError]);

  /* Color selection based on scan state */
  let neonColor = '#00bcd4'; // default Neon Cyan
  if (scanSuccess) {
    neonColor = '#4ade80'; // Neon Green
  } else if (scanError) {
    neonColor = '#f87171'; // Neon Red
  }

  return (
    <div 
      className="screen bg-black flex flex-col overflow-hidden select-none relative" 
      style={{ fontFamily: 'Manrope, Inter, sans-serif' }}
    >
      {/* ── File input hidden element ── */}
      <input 
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
        aria-hidden="true"
      />

      {/* ── Real Full-screen video element ── */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover z-0"
        playsInline
        muted
        autoPlay
      />

      {/* ── Fullscreen Camera Dark Overlay Mask ── */}
      <div className="absolute inset-0 z-10 flex flex-col pointer-events-none">
        <div className="flex-1 bg-black/60 backdrop-blur-[1px] transition-colors duration-300" />
        
        <div className="flex h-[270px] shrink-0">
          <div className="flex-1 bg-black/60 backdrop-blur-[1px] transition-colors duration-300" />
          
          {/* Scanning cutout square window with gentle outline */}
          <div 
            className="w-[270px] h-[270px] shrink-0 bg-transparent relative pointer-events-auto rounded-3xl transition-all duration-500"
            style={{
              border: `1.5px solid ${neonColor}65`,
              boxShadow: `0 0 20px ${neonColor}15, inset 0 0 15px ${neonColor}10`,
            }}
          >
            {/* Target autofocus indicators */}
            {scanning && <AutofocusIndicator />}

            {/* Neon scanner laser line */}
            {scanning && (
              <motion.div
                className="absolute left-[3%] right-[3%] h-[3px] pointer-events-none"
                style={{
                  background: `linear-gradient(90deg, transparent 0%, ${neonColor} 20%, ${neonColor} 80%, transparent 100%)`,
                  boxShadow: `0 0 16px 4px ${neonColor}`,
                  borderRadius: '9999px',
                }}
                animate={{ top: ['4%', '96%', '4%'] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}

            {/* Success neon flash */}
            <AnimatePresence>
              {scanSuccess && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.4, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 bg-[#4ade80] rounded-2xl pointer-events-none"
                />
              )}
            </AnimatePresence>
          </div>
          
          <div className="flex-1 bg-black/60 backdrop-blur-[1px] transition-colors duration-300" />
        </div>
        
        <div className="flex-1 bg-black/60 backdrop-blur-[1px] transition-colors duration-300" />
      </div>

      {/* ── Flashlight beams overlay on camera background ── */}
      {flashOn && (
        <div className="absolute inset-0 z-5 pointer-events-none bg-radial from-white/10 via-transparent to-transparent opacity-60 mix-blend-screen" />
      )}

      {/* ── Status Bar ── */}
      <div className="relative z-30">
        <StatusBar className="bg-transparent" />
      </div>

      {/* ── Header ── */}
      <header
        className="relative z-30 flex items-center justify-between px-4 pb-3 pt-2"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, transparent 100%)',
        }}
      >
        <div className="w-10" /> {/* Spacer to center the title */}

        {/* Center Title */}
        <h1 className="text-lg font-bold tracking-wider text-white text-center drop-shadow-md">
          QR Transfer
        </h1>

        {/* Exit Button (X) */}
        <motion.button
          id="scanner-close-btn"
          whileTap={{ scale: 0.88 }}
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-black/35 backdrop-blur-md flex items-center justify-center text-white border border-white/10 hover:bg-black/50 transition-all cursor-pointer"
          aria-label="Close QR scanner"
        >
          <X className="w-5 h-5" />
        </motion.button>
      </header>

      {/* ── Main viewport text & warnings ── */}
      <main className="relative z-20 flex-1 flex flex-col items-center justify-between pointer-events-none py-4">
        
        {/* Help Banner at the top */}
        <div className="w-full px-6 text-center mt-2">
          <AnimatePresence>
            {showHelpBanner && (
              <motion.div
                initial={{ opacity: 0, y: -15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="w-full max-w-sm mx-auto bg-black/75 backdrop-blur-md border border-[#00bcd4]/30 rounded-xl px-4 py-2.5 flex items-center gap-3 text-left pointer-events-auto"
              >
                <Info className="w-5 h-5 text-[#00bcd4] shrink-0" />
                <div className="flex-1">
                  <p className="text-[11px] text-gray-300 leading-normal">
                    Having trouble scanning? Try turning on the <strong>Flash</strong> or <strong>Enter payment code</strong> manually below.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Center error instructions if camera fails */}
        {cameraError && (
          <div className="w-full px-8 text-center my-auto pointer-events-auto">
            <div className="bg-black/85 backdrop-blur-lg border border-red-500/30 rounded-2xl p-6 max-w-xs mx-auto shadow-2xl">
              <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
              <p className="text-sm text-gray-200 leading-relaxed font-semibold mb-4">{cameraError}</p>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={startCamera}
                className="px-4 py-2 bg-white/10 border border-white/20 hover:bg-white/15 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Retry Camera
              </motion.button>
            </div>
          </div>
        )}

        {/* Security badge statement above bottom bar */}
        <div className="w-full flex justify-center mb-2 mt-auto">
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-xs border border-white/5 rounded-full py-1.5 px-4 shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-[#4ade80]" />
            <span className="text-[9.5px] text-white/70 tracking-wide font-medium">
              KHQR 256-bit Encrypted • ABA Bank
            </span>
          </div>
        </div>
      </main>

      {/* ── Bottom action controls ── */}
      <div
        className="relative z-30 flex flex-col items-center pb-8 pt-10 px-6 pointer-events-auto"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.95) 70%, transparent 100%)',
        }}
      >
        {/* Actions grid */}
        <div className="grid grid-cols-3 gap-8 justify-items-center w-full max-w-sm mb-8">
          
          {/* Action 1: Flash */}
          <button
            id="scanner-flash-btn"
            onClick={toggleFlash}
            className="flex flex-col items-center group cursor-pointer"
            aria-label={flashOn ? "Turn off Flash" : "Turn on Flash"}
          >
            <div
              className="w-12 h-12 rounded-full border flex items-center justify-center mb-2 transition-all duration-300"
              style={{
                background: flashOn ? 'rgba(0,188,212,0.25)' : 'rgba(255,255,255,0.06)',
                borderColor: flashOn ? '#00bcd4' : 'rgba(255,255,255,0.15)',
                boxShadow: flashOn ? '0 0 16px rgba(0,188,212,0.3)' : 'none',
              }}
            >
              <Zap className={`w-5 h-5 transition-transform duration-300 ${flashOn ? 'text-[#00bcd4] scale-110' : 'text-white/80'}`} />
            </div>
            <span className={`text-[10px] font-semibold tracking-wide ${flashOn ? 'text-[#00bcd4]' : 'text-white/75'}`}>
              Flash
            </span>
          </button>

          {/* Action 2: Gallery */}
          <button
            id="scanner-gallery-btn"
            onClick={handleGalleryClick}
            className="flex flex-col items-center group cursor-pointer"
            aria-label="Select QR from photo gallery"
          >
            <div className="w-12 h-12 rounded-full border border-white/15 bg-white/6 flex items-center justify-center mb-2 group-hover:bg-white/10 transition-colors">
              <ImageIcon className="w-5 h-5 text-white/80" />
            </div>
            <span className="text-[10px] font-semibold text-white/75 tracking-wide">
              Gallery
            </span>
          </button>

          {/* Action 3: Manual Input */}
          <button
            id="scanner-manual-btn"
            onClick={() => {
              setManualCode('');
              setShowManualModal(true);
            }}
            className="flex flex-col items-center group cursor-pointer"
            aria-label="Enter code manually"
          >
            <div className="w-12 h-12 rounded-full border border-white/15 bg-white/6 flex items-center justify-center mb-2 group-hover:bg-white/10 transition-colors">
              <Keyboard className="w-5 h-5 text-white/80" />
            </div>
            <span className="text-[10px] font-semibold text-white/75 tracking-wide">
              Enter Code
            </span>
          </button>
        </div>

        {/* Partner logos */}
        <PartnerBadges />

        {/* Home gesture bar */}
        <div className="w-1/3 h-1 bg-white/20 rounded-full mt-6" />
      </div>

      {/* ── Manual Code Modal Bottom Sheet ── */}
      <AnimatePresence>
        {showManualModal && (
          <>
            {/* Modal backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowManualModal(false)}
              className="absolute inset-0 bg-black/75 z-40 backdrop-blur-xs cursor-pointer"
            />

            {/* Bottom sheet content */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="absolute bottom-0 left-0 right-0 z-50 bg-[#0d2a35] border-t border-white/10 rounded-t-3xl pb-8 pt-5 px-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold text-white tracking-wide">Enter Payment Code</h3>
                <button
                  onClick={() => setShowManualModal(false)}
                  className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/80 hover:bg-white/10 cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div>
                  <label htmlFor="manual-code-input" className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                    Enter Merchant Account or KHQR ID
                  </label>
                  <div className="relative">
                    <input
                      id="manual-code-input"
                      type="text"
                      pattern="[A-Za-z0-9]+"
                      inputMode="numeric"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value.replace(/[^A-Za-z0-9]/g, ''))}
                      placeholder="e.g. 0199998888"
                      className="w-full bg-black/45 border border-white/15 rounded-xl py-3 px-4 text-white text-base tracking-wide focus:outline-none focus:border-[#00bcd4] transition-colors"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowManualModal(false)}
                    className="flex-1 py-3 bg-white/5 border border-white/10 text-white font-semibold text-sm rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-[#e63946] text-white font-semibold text-sm rounded-xl hover:bg-[#d8313e] shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Confirm
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Toast Overlay Notifications ── */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="absolute bottom-28 left-6 right-6 z-50 flex justify-center pointer-events-none"
          >
            <div className="bg-black/85 backdrop-blur-md border border-white/10 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 max-w-sm">
              <div className="w-2 h-2 rounded-full bg-[#00bcd4] animate-pulse" />
              <span>{toastMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
