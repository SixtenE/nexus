"use client";

import * as React from "react";

export interface SliderProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  /** Single-value API, but kept compatible with shadcn usage: value={[num]} */
  value: number[];
  onValueChange?: (v: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
}

export const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className = "", value, onValueChange, min = 0, max = 100, step = 1, ...rest }, ref) => {
    const current = Array.isArray(value) && value.length ? value[0] : 0;

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      const v = Number(e.target.value);
      onValueChange?.([v]);
    }

    return (
      <div className={`relative w-full select-none ${className}`}>
        <input
          ref={ref}
          type="range"
          min={min}
          max={max}
          step={step}
          value={current}
          onChange={handleChange}
          className="
            w-full appearance-none bg-transparent
            focus:outline-none
          "
          {...rest}
        />
        {/* Track */}
        <div className="pointer-events-none absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-secondary" />
        {/* Filled range */}
        <div
          className="pointer-events-none absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-primary"
          style={{ left: 0, width: `${((current - min) / (max - min)) * 100}%` }}
        />
        {/* Thumb overlay for styling (the actual thumb is native) */}
        <style jsx>{`
          input[type="range"] {
            height: 1.5rem;
          }
          input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            height: 16px;
            width: 16px;
            border-radius: 9999px;
            border: 1px solid hsl(var(--primary));
            background: hsl(var(--background));
            box-shadow: 0 1px 2px rgba(0,0