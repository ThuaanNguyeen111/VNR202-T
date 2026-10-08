import { useState, useCallback } from "react";

export function useConfetti() {
  const [particles, setParticles] = useState([]);

  const triggerConfetti = useCallback((count = 50) => {
    const colors = ["#CC0500", "#F2B705", "#161616", "#FFFDF7", "#8E0300", "#F2B705"];

    const newParticles = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 100,
      y: -10,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 4,
      speedX: (Math.random() - 0.5) * 4,
      speedY: Math.random() * 3 + 2,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      opacity: 1,
      shape: Math.random() > 0.5 ? "circle" : "rect",
    }));

    setParticles(newParticles);

    setTimeout(() => setParticles([]), 3000);
  }, []);

  return { particles, triggerConfetti };
}

export function useSoundEffects() {
  const playSound = useCallback((type) => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      if (type === "correct") {
        oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime);
        oscillator.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.4);
      } else if (type === "wrong") {
        oscillator.frequency.setValueAtTime(300, audioCtx.currentTime);
        oscillator.frequency.setValueAtTime(200, audioCtx.currentTime + 0.15);
        oscillator.type = "sawtooth";
        gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.3);
      } else if (type === "click") {
        oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
        oscillator.type = "sine";
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.05);
      } else if (type === "victory") {
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, i) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.15);
          gain.gain.setValueAtTime(0.3, audioCtx.currentTime + i * 0.15);
          gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + i * 0.15 + 0.3);
          osc.start(audioCtx.currentTime + i * 0.15);
          osc.stop(audioCtx.currentTime + i * 0.15 + 0.3);
        });
      }
    } catch {
      // Audio context not available
    }
  }, []);

  return { playSound };
}
