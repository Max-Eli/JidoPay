"use client";

import { animate, useInView, useMotionValue, useTransform, motion } from "framer-motion";
import { useEffect, useRef } from "react";

interface CounterProps {
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
}

export function Counter({
  value,
  suffix = "",
  prefix = "",
  decimals = 0,
  duration = 1.8,
  className,
}: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) =>
    `${prefix}${latest.toFixed(decimals)}${suffix}`
  );

  useEffect(() => {
    if (!inView) return;
    const controls = animate(count, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
    });
    return controls.stop;
  }, [inView, value, duration, count]);

  return <motion.span ref={ref} className={className}>{rounded}</motion.span>;
}
