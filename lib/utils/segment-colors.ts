/**
 * Centralized color management system for segments, patterns, and charts
 * This is the single source of truth for all colors used across the application
 */

import React from 'react';

// ============================================================================
// COLOR CONSTANTS
// ============================================================================

export const SEGMENT_COLORS = {
  // Performance Segments
  LEADER_GREEN: 'rgba(34, 197, 94, 0.8)',      // Green for leaders (efficient/engaged)
  MODERATE_BLUE: 'rgba(59, 130, 246, 0.8)',    // Blue for moderate engagement
  BALANCED_LIGHT_GREEN: 'rgba(134, 239, 172, 0.8)', // Light green for balanced middle
  EFFORTFUL_ORANGE: 'rgba(249, 115, 22, 0.8)', // Orange for effortful/struggling
  LOW_RED: 'rgba(239, 68, 68, 0.8)',           // Red for low engagement
  
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
  
  // Default
  DEFAULT_GRAY: 'rgba(156, 163, 175, 0.8)',    // Default gray for unknown
} as const;

// ============================================================================
// BADGE COLORS (Radix UI color names)
// ============================================================================

export type RadixColor = 'gray' | 'red' | 'orange' | 'yellow' | 'green' | 'grass' | 'lime' | 'mint' | 'cyan' | 'teal' | 'blue' | 'purple' | 'pink';

export const BADGE_COLORS = {
  // Performance Segments
  LEADER: 'green' as RadixColor,        // Dark green for leaders
  MODERATE_ENGAGED: 'blue' as RadixColor,
  BALANCED: 'lime' as RadixColor,       // Lime (very light green) for balanced - more distinct from green
  EFFORTFUL: 'orange' as RadixColor,
  LOW: 'red' as RadixColor,
  
  // Easing Patterns
  EASE_OUT: 'green' as RadixColor,      // Dark green for frontloaded
  EASE_IN: 'orange' as RadixColor,
  EASE_IN_OUT: 'purple' as RadixColor,
  EASE: 'blue' as RadixColor,
  LINEAR: 'lime' as RadixColor,         // Lime (very light green) for linear - more distinct from green
  NO_ACTIVITY: 'red' as RadixColor,
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
  
  // Green for leaders/high performers (old: Leader efficient/engaged, new: Highly efficient/engaged)
  if (segmentLower.includes('leader efficient')) return SEGMENT_COLORS.LEADER_GREEN;
  if (segmentLower.includes('highly efficient')) return SEGMENT_COLORS.LEADER_GREEN;
  if (segmentLower.includes('leader engaged')) return SEGMENT_COLORS.LEADER_GREEN;
  if (segmentLower.includes('highly engaged')) return SEGMENT_COLORS.LEADER_GREEN;
  
  // Blue for moderate engagement (old: Balanced + engaged, new: Moderately engaged)
  if (segmentLower.includes('balanced + engaged')) return SEGMENT_COLORS.MODERATE_BLUE;
  if (segmentLower.includes('moderately engaged')) return SEGMENT_COLORS.MODERATE_BLUE;
  
  // Light green for balanced/moderate (old: Balanced middle, new: Moderately performing)
  if (segmentLower.includes('balanced middle')) return SEGMENT_COLORS.BALANCED_LIGHT_GREEN;
  if (segmentLower.includes('moderately performing')) return SEGMENT_COLORS.BALANCED_LIGHT_GREEN;
  
  // Orange for effortful (old: Hardworking but struggling, new: Highly effortful)
  if (segmentLower.includes('hardworking')) return SEGMENT_COLORS.EFFORTFUL_ORANGE;
  if (segmentLower.includes('highly effortful')) return SEGMENT_COLORS.EFFORTFUL_ORANGE;
  
  // Red for low engagement (old: Low engagement, new: Low participation)
  if (segmentLower.includes('low engagement')) return SEGMENT_COLORS.LOW_RED;
  if (segmentLower.includes('low participation')) return SEGMENT_COLORS.LOW_RED;
  
  return SEGMENT_COLORS.DEFAULT_GRAY;
}

/**
 * Get badge color for a performance segment
 */
export function getPerformanceSegmentBadgeColor(segment: string): RadixColor {
  const segmentLower = segment.toLowerCase();
  
  // Green for leaders
  if (segmentLower.includes('leader efficient')) return BADGE_COLORS.LEADER;
  if (segmentLower.includes('highly efficient')) return BADGE_COLORS.LEADER;
  if (segmentLower.includes('leader engaged')) return BADGE_COLORS.LEADER;
  if (segmentLower.includes('highly engaged')) return BADGE_COLORS.LEADER;
  
  // Blue for moderate engagement
  if (segmentLower.includes('balanced + engaged')) return BADGE_COLORS.MODERATE_ENGAGED;
  if (segmentLower.includes('moderately engaged')) return BADGE_COLORS.MODERATE_ENGAGED;
  
  // Gray for balanced
  if (segmentLower.includes('balanced middle')) return BADGE_COLORS.BALANCED;
  if (segmentLower.includes('moderately performing')) return BADGE_COLORS.BALANCED;
  
  // Orange for effortful
  if (segmentLower.includes('hardworking')) return BADGE_COLORS.EFFORTFUL;
  if (segmentLower.includes('highly effortful')) return BADGE_COLORS.EFFORTFUL;
  if (segmentLower.includes('effortful')) return BADGE_COLORS.EFFORTFUL;
  
  // Red for low
  if (segmentLower.includes('low engagement')) return BADGE_COLORS.LOW;
  if (segmentLower.includes('low participation')) return BADGE_COLORS.LOW;
  
  // Blue as fallback for "engaged" segments
  if (segmentLower.includes('engaged')) return BADGE_COLORS.MODERATE_ENGAGED;
  
  return BADGE_COLORS.BALANCED;
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

