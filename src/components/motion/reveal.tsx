"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

type Direction = "up" | "down" | "left" | "right" | "none";

interface RevealProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  direction?: Direction;
  distance?: number;
  className?: string;
  as?: "div" | "section" | "span" | "li" | "article";
  once?: boolean;
}

export function Reveal({
  children,
  delay = 0,
  duration = 0.8,
  direction = "up",
  distance = 24,
  className,
  as = "div",
  once = true,
}: RevealProps) {
  const shouldReduceMotion = useReducedMotion();

  const offset = shouldReduceMotion ? {} : directionToOffset(direction, distance);

  const variants: Variants = {
    hidden: { opacity: 0, ...offset },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : duration,
        delay: shouldReduceMotion ? 0 : delay,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  const MotionTag = motion[as];

  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "0px 0px -10% 0px" }}
      variants={variants}
    >
      {children}
    </MotionTag>
  );
}

function directionToOffset(direction: Direction, distance: number) {
  switch (direction) {
    case "up":
      return { y: distance };
    case "down":
      return { y: -distance };
    case "left":
      return { x: distance };
    case "right":
      return { x: -distance };
    default:
      return {};
  }
}
