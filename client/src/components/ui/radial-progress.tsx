import React from "react";
import { cn } from "@/lib/utils";

interface RadialProgressProps extends React.SVGAttributes<SVGElement> {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  showPercentage?: boolean;
  className?: string;
  textClassName?: string;
}

export function RadialProgress({
  value,
  size = 40,
  strokeWidth = 3,
  color = "currentColor",
  backgroundColor = "#E5E7EB",
  showPercentage = true,
  className,
  textClassName,
  ...props
}: RadialProgressProps) {
  const radius = (size / 2) - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  
  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      <svg 
        className="transform -rotate-90"
        width={size}
        height={size}
        {...props}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={backgroundColor}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={color}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      {showPercentage && (
        <span className={cn("absolute inset-0 flex items-center justify-center text-xs font-medium", textClassName)}>
          {value}%
        </span>
      )}
    </div>
  );
}
