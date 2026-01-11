
import React, { Suspense, useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { PinkParticleTreeScene } from './components/PinkParticleTreeScene';
import { Loader } from '@react-three/drei';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

const App: React.FC = () => {
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [wishText, setWishText] = useState('');
  const [activeWishes, setActiveWishes] = useState<number[]>([]);
  const [burstTime, setBurstTime] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);

  // Initialize MediaPipe
  useEffect(() => {
    async function initMediaPipe() {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
      );
      const handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: 1
      });
      handLandmarkerRef.current = handLandmarker;
    }
    initMediaPipe();
  }, []);

  // Handle Camera Stream
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (cameraEnabled && videoRef.current) {
      navigator.mediaDevices.getUserMedia({ video: true }).then((s) => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play();
        }
      });
    } else {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraEnabled]);

  // Detection Loop
  useEffect(() => {
    let animationFrame: number;
    const predict = () => {
      if (cameraEnabled && videoRef.current && handLandmarkerRef.current && videoRef.current.readyState >= 2) {
        const results = handLandmarkerRef.current.detectForVideo(videoRef.current, performance.now());
        if (results.landmarks && results.landmarks.length > 0) {
          const landmarks = results.landmarks[0];
          const tipIds = [8, 12, 16, 20];
          const joints = [6, 10, 14, 18];
          let extendedFingers = 0;
          for (let i = 0; i < tipIds.length; i++) {
            if (landmarks[tipIds[i]].y < landmarks[joints[i]].y) {
              extendedFingers++;
            }
          }
          setIsOpen(extendedFingers >= 3);
        } else {
          setIsOpen(false);
        }
      }
      animationFrame = requestAnimationFrame(predict);
    };
    predict();
    return () => cancelAnimationFrame(animationFrame);
  }, [cameraEnabled]);

  const handleSendWish = () => {
    if (!wishText.trim()) return;
    const id = Date.now();
    setActiveWishes(prev => [...prev, id]);
    setWishText('');
    
    // Cleanup wish after animation
    setTimeout(() => {
      setActiveWishes(prev => prev.filter(w => w !== id));
      setBurstTime(Date.now());
    }, 2000); // Fly duration
  };

  return (
    <div className="w-full h-screen bg-black overflow-hidden relative mono-font">
      {/* Hidden Video for MediaPipe */}
      <video ref={videoRef} className="hidden" playsInline muted />

      {/* Header UI - Top Left */}
      <div className="absolute top-10 left-10 z-10 pointer-events-none flex flex-col items-start">
        <h1 className="ui-title-font text-3xl font-extrabold text-[#FF2D78] tracking-tighter drop-shadow-[0_0_20px_rgba(255,45,120,0.5)] uppercase">
          MERRY<br/>CHRISTMAS
        </h1>
        {cameraEnabled && (
          <div className="mt-4 px-3 py-1 bg-pink-500/20 border border-pink-400/30 rounded-full text-[10px] text-pink-200 uppercase tracking-widest backdrop-blur-sm">
            Gesture: <span className="font-bold">{isOpen ? "OPEN (Unleash)" : "CLOSED"}</span>
          </div>
        )}
      </div>

      {/* Wish UI */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-2 w-full max-w-md px-4">
        <div className="flex-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 flex items-center shadow-2xl">
          <input 
            type="text" 
            value={wishText}
            onChange={(e) => setWishText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendWish()}
            placeholder="Make a wish..." 
            className="bg-transparent border-none outline-none text-white text-[12px] w-full"
          />
        </div>
        <button 
          onClick={handleSendWish}
          className="px-6 py-2 bg-pink-600/40 hover:bg-pink-600/60 border border-pink-400/30 rounded-full text-[12px] text-pink-100 uppercase tracking-widest transition-all backdrop-blur-md shadow-lg"
        >
          Send
        </button>
      </div>

      {/* Camera Toggle - Top Right */}
      <div className="absolute top-10 right-10 z-20 flex items-center space-x-3">
        <span className="text-[10px] text-pink-200/50 uppercase tracking-wider">Enable camera</span>
        <button 
          onClick={() => setCameraEnabled(!cameraEnabled)}
          className={`w-12 h-6 rounded-full transition-colors relative border border-white/10 ${cameraEnabled ? 'bg-pink-600' : 'bg-gray-800'}`}
        >
          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${cameraEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
        </button>
      </div>

      <Suspense fallback={null}>
        <Canvas
          shadows
          camera={{ position: [0, 8, 22], fov: 45 }}
          gl={{ 
            antialias: true, 
            stencil: false, 
            depth: true,
            alpha: false,
            powerPreference: "high-performance"
          }}
          onCreated={({ gl }) => {
            gl.setClearColor('#000000');
          }}
        >
          <PinkParticleTreeScene isOpen={isOpen} activeWishes={activeWishes} burstTime={burstTime} />
        </Canvas>
      </Suspense>
      
      <Loader />
    </div>
  );
};

export default App;
