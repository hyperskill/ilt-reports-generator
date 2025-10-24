/**
 * Centralized color management system for segments, patterns, charts, and UI elements
 * This is the single source of truth for all colors used across the application
 * 
 * COLOR CATEGORIES:
 * - Performance Segments (green/blue/light-green/orange/red)
 * - Easing Patterns (green/orange/purple/blue/light-green/red)
 * - Module Activity (blue for steps, purple for meetings)
 * - Learning Progress (green/orange/red for completion rates, blue/purple for outcomes/tools)
 * 
 * USAGE:
 * - Import color functions: getCompletionRateBadgeColor(), getPerformanceSegmentBadgeColor(), etc.
 * - Import color constants: BADGE_COLORS, SEGMENT_COLORS, LEARNING_PROGRESS_COLORS
 * - Use functions for dynamic color selection based on data
 * - Use constants for fixed UI elements
 */

import React from 'react';

// ============================================================================
// COLOR CONSTANTS
// ============================================================================

export const SEGMENT_COLORS = {
  // Performance Segments - All green shades from dark to light
  LEADER_DARK_GREEN: 'rgba(34, 197, 94, 0.8)',      // Dark green for leaders (Highly efficient/engaged)
  COMMITTED_MEDIUM_GREEN: 'rgba(74, 222, 128, 0.8)', // Medium green for Highly committed
  MODERATE_LIGHT_GREEN: 'rgba(134, 239, 172, 0.8)', // Light green for Moderately engaged
  LOW_RED: 'rgba(239, 68, 68, 0.8)',                // Red for Less engaged
  
  // Legacy names for backward compatibility
  LEADER_GREEN: 'rgba(34, 197, 94, 0.8)',
  MODERATE_BLUE: 'rgba(134, 239, 172, 0.8)',        // Now light green, not blue
  BALANCED_LIGHT_GREEN: 'rgba(134, 239, 172, 0.8)',
  EFFORTFUL_ORANGE: 'rgba(74, 222, 128, 0.8)',      // Now medium green, not orange
  
  // Easing Patterns
  EASE_OUT_GREEN: 'rgba(34, 197, 94, 0.8)',    // Green for early activity (frontloaded)
  EASE_IN_ORANGE: 'rgba(249, 115, 22, 0.8)',   // Orange for late activity (backloaded)
  EASE_IN_OUT_PURPLE: 'rgba(168, 85, 247, 0.8)', // Purple for S-curve
  EASE_BLUE: 'rgba(59, 130, 246, 0.8)',        // Blue for moderate/general activity
  LINEAR_LIGHT_GREEN: 'rgba(134, 239, 172, 0.8)', // Light green for linear/steady
  NO_ACTIVITY_RED: 'rgba(220, 38, 38, 0.8)',   // Red for no activity
  
  // Module Activity
  STEPS_BLUE: 'rgba(59, 130, 246, 0.8)',       // Blue for completed steps
  MEETINGS_PURPLE: 'rgba(168, 85, 247, 0.8)',  // Purple for meetings
  
  // Learning Progress
  PROGRESS_EXCELLENT_GREEN: 'rgba(34, 197, 94, 0.8)',   // Green for excellent progress (≥75%)
  PROGRESS_MODERATE_ORANGE: 'rgba(249, 115, 22, 0.8)', // Orange for moderate progress (50-74%)
  PROGRESS_LOW_RED: 'rgba(239, 68, 68, 0.8)',          // Red for low progress (<50%)
  
  OUTCOMES_BLUE: 'rgba(59, 130, 246, 0.8)',    // Blue theme for learning outcomes
  TOOLS_PURPLE: 'rgba(168, 85, 247, 0.8)',     // Purple for tools & technologies
  
  // Default
  DEFAULT_GRAY: 'rgba(156, 163, 175, 0.8)',    // Default gray for unknown
} as const;

// ============================================================================
// BADGE COLORS (Radix UI color names)
// ============================================================================

export type RadixColor = 'gray' | 'red' | 'orange' | 'yellow' | 'green' | 'grass' | 'lime' | 'mint' | 'cyan' | 'teal' | 'blue' | 'purple' | 'pink';

export const BADGE_COLORS = {
  // Performance Segments - All green shades
  LEADER: 'green' as RadixColor,           // Dark green for Highly efficient/engaged
  COMMITTED: 'grass' as RadixColor,        // Medium green for Highly committed
  MODERATE_ENGAGED: 'lime' as RadixColor,  // Light green for Moderately engaged
  LOW: 'red' as RadixColor,                // Red for Less engaged
  
  // Legacy names
  BALANCED: 'lime' as RadixColor,
  EFFORTFUL: 'grass' as RadixColor,
  
  // Easing Patterns
  EASE_OUT: 'green' as RadixColor,      // Dark green for frontloaded
  EASE_IN: 'orange' as RadixColor,
  EASE_IN_OUT: 'purple' as RadixColor,
  EASE: 'blue' as RadixColor,
  LINEAR: 'lime' as RadixColor,         // Lime (very light green) for linear - more distinct from green
  NO_ACTIVITY: 'red' as RadixColor,
  
  // Learning Progress
  PROGRESS_EXCELLENT: 'green' as RadixColor,    // Green for excellent progress (≥75%)
  PROGRESS_MODERATE: 'orange' as RadixColor,    // Orange for moderate progress (50-74%)
  PROGRESS_LOW: 'red' as RadixColor,            // Red for low progress (<50%)
  
  TOOLS: 'purple' as RadixColor,                // Purple for tools badges
} as const;

// ============================================================================
// PERFORMANCE SEGMENT COLOR FUNCTIONS
// ============================================================================

/**
 * Get chart color for a performance segment
 * Supports both old and new segment naming conventions
 */
export function getPerformanceSegmentChartColor(segment: string): string {
  const segmentLower = segment.toLowerCase();
  
  // Dark green for top performers (Highly efficient/engaged)
  if (segmentLower.includes('leader efficient')) return SEGMENT_COLORS.LEADER_DARK_GREEN;
  if (segmentLower.includes('highly efficient')) return SEGMENT_COLORS.LEADER_DARK_GREEN;
  if (segmentLower.includes('leader engaged')) return SEGMENT_COLORS.LEADER_DARK_GREEN;
  if (segmentLower.includes('highly engaged')) return SEGMENT_COLORS.LEADER_DARK_GREEN;
  
  // Medium green for committed (Highly committed)
  if (segmentLower.includes('hardworking')) return SEGMENT_COLORS.COMMITTED_MEDIUM_GREEN;
  if (segmentLower.includes('highly effortful')) return SEGMENT_COLORS.COMMITTED_MEDIUM_GREEN;
  if (segmentLower.includes('highly committed')) return SEGMENT_COLORS.COMMITTED_MEDIUM_GREEN;
  
  // Light green for moderate engagement (Moderately engaged)
  if (segmentLower.includes('balanced + engaged')) return SEGMENT_COLORS.MODERATE_LIGHT_GREEN;
  if (segmentLower.includes('balanced middle')) return SEGMENT_COLORS.MODERATE_LIGHT_GREEN;
  if (segmentLower.includes('moderately performing')) return SEGMENT_COLORS.MODERATE_LIGHT_GREEN;
  if (segmentLower.includes('moderately engaged')) return SEGMENT_COLORS.MODERATE_LIGHT_GREEN;
  
  // Red for low engagement (Less engaged)
  if (segmentLower.includes('low engagement')) return SEGMENT_COLORS.LOW_RED;
  if (segmentLower.includes('low participation')) return SEGMENT_COLORS.LOW_RED;
  if (segmentLower.includes('less engaged')) return SEGMENT_COLORS.LOW_RED;
  
  return SEGMENT_COLORS.DEFAULT_GRAY;
}

/**
 * Get badge color for a performance segment
 */
export function getPerformanceSegmentBadgeColor(segment: string): RadixColor {
  const segmentLower = segment.toLowerCase();
  
  // Dark green for top performers (Highly efficient/engaged)
  if (segmentLower.includes('leader efficient')) return BADGE_COLORS.LEADER;
  if (segmentLower.includes('highly efficient')) return BADGE_COLORS.LEADER;
  if (segmentLower.includes('leader engaged')) return BADGE_COLORS.LEADER;
  if (segmentLower.includes('highly engaged')) return BADGE_COLORS.LEADER;
  
  // Medium green for committed (Highly committed)
  if (segmentLower.includes('hardworking')) return BADGE_COLORS.COMMITTED;
  if (segmentLower.includes('highly effortful')) return BADGE_COLORS.COMMITTED;
  if (segmentLower.includes('highly committed')) return BADGE_COLORS.COMMITTED;
  if (segmentLower.includes('committed')) return BADGE_COLORS.COMMITTED;
  
  // Light green for moderate engagement (Moderately engaged)
  if (segmentLower.includes('balanced + engaged')) return BADGE_COLORS.MODERATE_ENGAGED;
  if (segmentLower.includes('balanced middle')) return BADGE_COLORS.MODERATE_ENGAGED;
  if (segmentLower.includes('moderately performing')) return BADGE_COLORS.MODERATE_ENGAGED;
  if (segmentLower.includes('moderately engaged')) return BADGE_COLORS.MODERATE_ENGAGED;
  
  // Red for low engagement (Less engaged)
  if (segmentLower.includes('low engagement')) return BADGE_COLORS.LOW;
  if (segmentLower.includes('low participation')) return BADGE_COLORS.LOW;
  if (segmentLower.includes('less engaged')) return BADGE_COLORS.LOW;
  
  // Light green as fallback for "engaged" segments
  if (segmentLower.includes('engaged')) return BADGE_COLORS.MODERATE_ENGAGED;
  
  return BADGE_COLORS.MODERATE_ENGAGED;
}

// ============================================================================
// EASING PATTERN COLOR FUNCTIONS
// ============================================================================

/**
 * Get chart color for an easing pattern
 */
export function getEasingPatternChartColor(easing: string): string {
  switch (easing.toLowerCase()) {
    case 'ease-out': return SEGMENT_COLORS.EASE_OUT_GREEN;
    case 'ease-in': return SEGMENT_COLORS.EASE_IN_ORANGE;
    case 'ease-in-out': return SEGMENT_COLORS.EASE_IN_OUT_PURPLE;
    case 'ease': return SEGMENT_COLORS.EASE_BLUE;
    case 'linear': return SEGMENT_COLORS.LINEAR_LIGHT_GREEN;
    case 'no-activity': return SEGMENT_COLORS.NO_ACTIVITY_RED;
    default: return SEGMENT_COLORS.DEFAULT_GRAY;
  }
}

/**
 * Get badge color for an easing pattern
 */
export function getEasingPatternBadgeColor(easing: string): RadixColor {
  switch (easing.toLowerCase()) {
    case 'ease-out': return BADGE_COLORS.EASE_OUT;
    case 'ease-in': return BADGE_COLORS.EASE_IN;
    case 'ease-in-out': return BADGE_COLORS.EASE_IN_OUT;
    case 'ease': return BADGE_COLORS.EASE;
    case 'linear': return BADGE_COLORS.LINEAR;
    case 'no-activity': return BADGE_COLORS.NO_ACTIVITY;
    default: return BADGE_COLORS.BALANCED;
  }
}

// ============================================================================
// MODULE ACTIVITY COLORS
// ============================================================================

export const MODULE_COLORS = {
  COMPLETED_STEPS: SEGMENT_COLORS.STEPS_BLUE,
  MEETINGS_ATTENDED: SEGMENT_COLORS.MEETINGS_PURPLE,
} as const;

// ============================================================================
// LEARNING PROGRESS COLORS
// ============================================================================

export const LEARNING_PROGRESS_COLORS = {
  EXCELLENT_GREEN: SEGMENT_COLORS.PROGRESS_EXCELLENT_GREEN,
  MODERATE_ORANGE: SEGMENT_COLORS.PROGRESS_MODERATE_ORANGE,
  LOW_RED: SEGMENT_COLORS.PROGRESS_LOW_RED,
  OUTCOMES_BLUE: SEGMENT_COLORS.OUTCOMES_BLUE,
  TOOLS_PURPLE: SEGMENT_COLORS.TOOLS_PURPLE,
} as const;

/**
 * Get badge color for completion rate
 */
export function getCompletionRateBadgeColor(rate: number): RadixColor {
  if (rate >= 75) return BADGE_COLORS.PROGRESS_EXCELLENT;
  if (rate >= 50) return BADGE_COLORS.PROGRESS_MODERATE;
  return BADGE_COLORS.PROGRESS_LOW;
}

/**
 * Get chart color for completion rate
 */
export function getCompletionRateChartColor(rate: number): string {
  if (rate >= 75) return LEARNING_PROGRESS_COLORS.EXCELLENT_GREEN;
  if (rate >= 50) return LEARNING_PROGRESS_COLORS.MODERATE_ORANGE;
  return LEARNING_PROGRESS_COLORS.LOW_RED;
}

// ============================================================================
// CHART BORDER COLORS
// ============================================================================

export const CHART_BORDERS = {
  PIE_WHITE: 'rgba(255, 255, 255, 1)',
  DEFAULT: 'rgba(255, 255, 255, 0.8)',
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert rgba color to rgb with full opacity for borders
 */
export function toSolidColor(rgbaColor: string): string {
  return rgbaColor.replace(/rgba\((.+),\s*[\d.]+\)/, 'rgba($1, 1)');
}

/**
 * Generate badge styles from chart color to match exactly
 * This creates custom styles for Radix UI Badge to use exact RGB colors from charts
 */
export function getBadgeStyleFromChartColor(chartColor: string): React.CSSProperties {
  // Extract RGB values from rgba(r, g, b, a) string
  const match = chartColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
  
  if (!match) {
    return {}; // Return empty object if color format is invalid
  }
  
  const [, r, g, b] = match;
  
  // Create dark text color by reducing brightness (multiply by 0.3 for dark variant)
  const darkR = Math.floor(parseInt(r) * 0.3);
  const darkG = Math.floor(parseInt(g) * 0.3);
  const darkB = Math.floor(parseInt(b) * 0.3);
  
  // Create color variations for Radix UI badge styling
  const darkTextColor = `rgb(${darkR}, ${darkG}, ${darkB})`;
  const lightBackground = `rgba(${r}, ${g}, ${b}, 0.15)`;
  const border = `rgba(${r}, ${g}, ${b}, 0.3)`;
  
  return {
    backgroundColor: lightBackground,
    color: darkTextColor,
    borderColor: border,
  };
}

/**
 * Get badge style for performance segment - matches chart colors exactly
 */
export function getPerformanceSegmentBadgeStyle(segment: string): React.CSSProperties {
  const chartColor = getPerformanceSegmentChartColor(segment);
  return getBadgeStyleFromChartColor(chartColor);
}

/**
 * Get badge style for easing pattern - matches chart colors exactly
 */
export function getEasingPatternBadgeStyle(easing: string): React.CSSProperties {
  const chartColor = getEasingPatternChartColor(easing);
  return getBadgeStyleFromChartColor(chartColor);
}

/**
 * Get all unique segment colors from a list of segments
 */
export function getSegmentColorMap(segments: string[]): Map<string, string> {
  const colorMap = new Map<string, string>();
  for (const segment of segments) {
    colorMap.set(segment, getPerformanceSegmentChartColor(segment));
  }
  return colorMap;
}

/**
 * Get all unique easing colors from a list of easing patterns
 */
export function getEasingColorMap(easings: string[]): Map<string, string> {
  const colorMap = new Map<string, string>();
  for (const easing of easings) {
    colorMap.set(easing, getEasingPatternChartColor(easing));
  }
  return colorMap;
}

