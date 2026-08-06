'use client';

import React, { useEffect, useState, useRef } from 'react';

export default function AnimatedCounter({ value = 0, duration = 750, decimals = 0, prefix = '', suffix = '', style = {}, className = '' }) {
  const targetVal = isNaN(Number(value)) ? 0 : Number(value);
  const [displayVal, setDisplayVal] = useState(targetVal);
  const prevValRef = useRef(targetVal);
  const startTimeRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    const startVal = prevValRef.current;
    const endVal = targetVal;
    if (startVal === endVal) return;

    const animate = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      
      // Smooth ease-out cubic function
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (endVal - startVal) * easeOutCubic;

      setDisplayVal(current);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayVal(endVal);
        prevValRef.current = endVal;
        startTimeRef.current = null;
      }
    };

    startTimeRef.current = null;
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [targetVal, duration]);

  const formattedStr = decimals > 0
    ? displayVal.toFixed(decimals)
    : Math.round(displayVal).toLocaleString('ar-LY');

  return (
    <span className={className} style={{ transition: 'color 0.3s ease', display: 'inline-block', ...style }}>
      {prefix}{formattedStr}{suffix}
    </span>
  );
}
