import React, { useEffect, useState } from "react";

interface AnimatedPlaneProps {
  multiplier?: number;
  isFlying?: boolean;
  className?: string;
}

export const AnimatedPlane: React.FC<AnimatedPlaneProps> = ({
  multiplier = 1.0,
  isFlying = false,
  className = "",
}) => {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (!isFlying) return;

    const interval = setInterval(() => {
      setRotation((prev) => (prev + 2) % 360);
    }, 50);

    return () => clearInterval(interval);
  }, [isFlying]);

  const altitude = isFlying ? Math.min(multiplier * 20, 300) : 0;

  return (
    <div className={`relative w-full h-96 ${className}`}>
      {/* Sky background with gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 rounded-lg overflow-hidden">
        {/* Animated grid background */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `linear-gradient(0deg, transparent 24%, rgba(0, 255, 136, 0.05) 25%, rgba(0, 255, 136, 0.05) 26%, transparent 27%, transparent 74%, rgba(0, 255, 136, 0.05) 75%, rgba(0, 255, 136, 0.05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(0, 255, 136, 0.05) 25%, rgba(0, 255, 136, 0.05) 26%, transparent 27%, transparent 74%, rgba(0, 255, 136, 0.05) 75%, rgba(0, 255, 136, 0.05) 76%, transparent 77%, transparent)`,
            backgroundSize: "50px 50px",
          }}
        />

        {/* Multiplier display */}
        {isFlying && (
          <div className="absolute top-8 right-8 text-right">
            <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-green-400 drop-shadow-lg">
              {multiplier.toFixed(2)}x
            </div>
            <div className="text-sm text-green-400 mt-2 animate-pulse">
              MULTIPLIER
            </div>
          </div>
        )}

        {/* Plane container */}
        <div
          className="absolute transition-all duration-200"
          style={{
            left: "10%",
            top: `${Math.max(50 - altitude, 10)}%`,
            transform: `rotate(${rotation}deg) scale(1.5)`,
          }}
        >
          {/* Plane SVG */}
          <svg
            width="80"
            height="80"
            viewBox="0 0 100 100"
            className="drop-shadow-2xl filter drop-shadow-[0_0_10px_rgba(0,255,136,0.6)]"
          >
            {/* Fuselage */}
            <ellipse cx="50" cy="50" rx="15" ry="35" fill="#00FF88" opacity="0.9" />

            {/* Cockpit */}
            <circle cx="50" cy="25" r="12" fill="#00FFFF" opacity="0.9" />
            <circle cx="50" cy="25" r="8" fill="#0088FF" opacity="0.6" />

            {/* Wings */}
            <rect x="10" y="45" width="80" height="10" fill="#00FF88" opacity="0.8" />
            <polygon points="10,45 5,50 10,55" fill="#00FF88" opacity="0.6" />
            <polygon points="90,45 95,50 90,55" fill="#00FF88" opacity="0.6" />

            {/* Tail */}
            <polygon points="50,85 45,95 55,95" fill="#00FFFF" opacity="0.9" />
            <polygon points="45,80 40,85 50,85" fill="#00FF88" opacity="0.7" />
            <polygon points="55,80 50,85 60,85" fill="#00FF88" opacity="0.7" />

            {/* Engine glow */}
            <circle cx="50" cy="75" r="8" fill="#FF00FF" opacity="0.7" />
            <circle cx="50" cy="75" r="5" fill="#FFFF00" opacity="0.9" />
          </svg>
        </div>

        {/* Crash indicator */}
        {!isFlying && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl font-bold text-red-500 mb-4 animate-pulse">
                CRASHED
              </div>
              <div className="text-xl text-red-400">Game Over</div>
            </div>
          </div>
        )}

        {/* Altitude markers */}
        <div className="absolute left-4 top-0 h-full flex flex-col justify-between text-xs text-green-400 opacity-50">
          <div>100%</div>
          <div>75%</div>
          <div>50%</div>
          <div>25%</div>
          <div>0%</div>
        </div>
      </div>
    </div>
  );
};

export default AnimatedPlane;
