/**
 * Performance Debugging Toolkit
 * 
 * This module provides comprehensive performance monitoring and debugging utilities
 * to identify CPU usage, re-renders, animation issues, and other performance bottlenecks.
 */

// ============================================================================
// RENDER COUNTER
// ============================================================================

const renderCounts = new Map<string, number>();
const renderTimestamps = new Map<string, number[]>();

export function logRender(componentName: string, props?: Record<string, any>) {
  const count = (renderCounts.get(componentName) || 0) + 1;
  renderCounts.set(componentName, count);

  const now = Date.now();
  const timestamps = renderTimestamps.get(componentName) || [];
  timestamps.push(now);
  
  // Keep only last 100 renders
  if (timestamps.length > 100) {
    timestamps.shift();
  }
  renderTimestamps.set(componentName, timestamps);

  // Calculate render rate (renders per second)
  const recentTimestamps = timestamps.filter(t => now - t < 1000);
  const renderRate = recentTimestamps.length;

  // Log warning if component renders too frequently
  if (renderRate > 10) {
    console.warn(
      `🔥 [PERF] ${componentName} rendering too frequently: ${renderRate} renders/sec (total: ${count})`,
      props
    );
  } else if (count % 10 === 0) {
    console.log(
      `🔄 [PERF] ${componentName} render #${count} (${renderRate} renders/sec)`,
      props
    );
  }
}

export function getRenderStats() {
  const stats: Record<string, { count: number; rate: number }> = {};
  const now = Date.now();

  for (const [componentName, count] of renderCounts.entries()) {
    const timestamps = renderTimestamps.get(componentName) || [];
    const recentTimestamps = timestamps.filter(t => now - t < 1000);
    
    stats[componentName] = {
      count,
      rate: recentTimestamps.length,
    };
  }

  return stats;
}

export function resetRenderStats() {
  renderCounts.clear();
  renderTimestamps.clear();
  console.log('✅ [PERF] Render stats reset');
}

// ============================================================================
// FRAME RATE MONITOR
// ============================================================================

let frameCount = 0;
let lastFrameTime = performance.now();
let fps = 60;
let isMonitoring = false;
let animationFrameId: number | null = null;

function measureFrameRate() {
  const now = performance.now();
  const delta = now - lastFrameTime;
  
  frameCount++;
  
  // Calculate FPS every second
  if (delta >= 1000) {
    fps = Math.round((frameCount * 1000) / delta);
    
    if (fps < 30) {
      console.warn(`⚠️ [PERF] Low FPS detected: ${fps} fps`);
    } else if (fps < 50) {
      console.log(`📊 [PERF] FPS: ${fps}`);
    }
    
    frameCount = 0;
    lastFrameTime = now;
  }
  
  if (isMonitoring) {
    animationFrameId = requestAnimationFrame(measureFrameRate);
  }
}

export function startFrameRateMonitor() {
  if (isMonitoring) return;
  
  isMonitoring = true;
  frameCount = 0;
  lastFrameTime = performance.now();
  console.log('▶️ [PERF] Frame rate monitoring started');
  measureFrameRate();
}

export function stopFrameRateMonitor() {
  if (!isMonitoring) return;
  
  isMonitoring = false;
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  console.log('⏸️ [PERF] Frame rate monitoring stopped');
}

export function getCurrentFPS() {
  return fps;
}

// ============================================================================
// WEBSOCKET / SUBSCRIPTION MONITOR
// ============================================================================

const subscriptionStats = {
  created: 0,
  closed: 0,
  recreated: 0,
  eventsReceived: 0,
  lastEventTime: 0,
  eventRate: 0,
};

const subscriptionTimestamps: number[] = [];
let lastEventRateCalc = Date.now();

export function logSubscriptionCreated(filter: any) {
  subscriptionStats.created++;
  console.log(`📡 [WS] Subscription created (#${subscriptionStats.created}):`, filter);
}

export function logSubscriptionClosed(subscriptionId?: string) {
  subscriptionStats.closed++;
  console.log(`🔌 [WS] Subscription closed (#${subscriptionStats.closed})`, subscriptionId || '');
}

export function logSubscriptionRecreated(filter: any) {
  subscriptionStats.recreated++;
  console.warn(
    `⚠️ [WS] Subscription RECREATED (#${subscriptionStats.recreated}) - this should NOT happen often:`,
    filter
  );
}

export function logEventReceived(eventId?: string) {
  const now = Date.now();
  subscriptionStats.eventsReceived++;
  subscriptionStats.lastEventTime = now;
  
  subscriptionTimestamps.push(now);
  
  // Keep only last 100 events
  if (subscriptionTimestamps.length > 100) {
    subscriptionTimestamps.shift();
  }
  
  // Calculate event rate every second
  if (now - lastEventRateCalc >= 1000) {
    const recentEvents = subscriptionTimestamps.filter(t => now - t < 1000);
    subscriptionStats.eventRate = recentEvents.length;
    lastEventRateCalc = now;
    
    if (subscriptionStats.eventRate > 10) {
      console.warn(
        `🔥 [WS] High event rate: ${subscriptionStats.eventRate} events/sec (total: ${subscriptionStats.eventsReceived})`
      );
    }
  }
  
  if (subscriptionStats.eventsReceived % 100 === 0) {
    console.log(
      `📨 [WS] Event #${subscriptionStats.eventsReceived} received (${subscriptionStats.eventRate} events/sec)`,
      eventId || ''
    );
  }
}

export function getSubscriptionStats() {
  return { ...subscriptionStats };
}

export function resetSubscriptionStats() {
  subscriptionStats.created = 0;
  subscriptionStats.closed = 0;
  subscriptionStats.recreated = 0;
  subscriptionStats.eventsReceived = 0;
  subscriptionStats.lastEventTime = 0;
  subscriptionStats.eventRate = 0;
  subscriptionTimestamps.length = 0;
  console.log('✅ [PERF] Subscription stats reset');
}

// ============================================================================
// PERFORMANCE MARKERS
// ============================================================================

export function markStart(name: string) {
  performance.mark(`${name}-start`);
}

export function markEnd(name: string) {
  performance.mark(`${name}-end`);
  
  try {
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    const measure = performance.getEntriesByName(name, 'measure')[0];
    if (measure && measure.duration > 16.67) { // Longer than one frame (60fps)
      console.warn(`⏱️ [PERF] Slow operation: ${name} took ${measure.duration.toFixed(2)}ms`);
    }
  } catch (error) {
    // Marks might not exist
  }
}

// ============================================================================
// ANIMATION MONITOR
// ============================================================================

const animatedElements = new Set<string>();

export function registerAnimation(elementId: string, animationType: string) {
  animatedElements.add(`${elementId}:${animationType}`);
  
  if (animatedElements.size > 20) {
    console.warn(
      `⚠️ [PERF] Many animated elements detected: ${animatedElements.size}`,
      Array.from(animatedElements)
    );
  }
}

export function unregisterAnimation(elementId: string, animationType: string) {
  animatedElements.delete(`${elementId}:${animationType}`);
}

export function getActiveAnimations() {
  return Array.from(animatedElements);
}

export function clearAnimationRegistry() {
  animatedElements.clear();
  console.log('✅ [PERF] Animation registry cleared');
}

// ============================================================================
// COMPONENT MOUNT/UNMOUNT TRACKER
// ============================================================================

const mountCounts = new Map<string, number>();
const unmountCounts = new Map<string, number>();
const mountTimestamps = new Map<string, number[]>();

export function logMount(componentName: string) {
  const count = (mountCounts.get(componentName) || 0) + 1;
  mountCounts.set(componentName, count);
  
  const now = Date.now();
  const timestamps = mountTimestamps.get(componentName) || [];
  timestamps.push(now);
  
  if (timestamps.length > 10) {
    timestamps.shift();
  }
  mountTimestamps.set(componentName, timestamps);
  
  // Check for rapid mount/unmount cycles
  const recentMounts = timestamps.filter(t => now - t < 5000);
  if (recentMounts.length > 5) {
    console.warn(
      `⚠️ [PERF] ${componentName} mounting/unmounting rapidly: ${recentMounts.length} mounts in 5 seconds`
    );
  }
  
  console.log(`🔼 [PERF] ${componentName} mounted (#${count})`);
}

export function logUnmount(componentName: string) {
  const count = (unmountCounts.get(componentName) || 0) + 1;
  unmountCounts.set(componentName, count);
  console.log(`🔽 [PERF] ${componentName} unmounted (#${count})`);
}

export function getMountStats() {
  const stats: Record<string, { mounts: number; unmounts: number }> = {};
  
  for (const [componentName, mounts] of mountCounts.entries()) {
    stats[componentName] = {
      mounts,
      unmounts: unmountCounts.get(componentName) || 0,
    };
  }
  
  return stats;
}

// ============================================================================
// MASTER DEBUG CONTROLS
// ============================================================================

let debugMode = false;

export function enableDebugMode() {
  debugMode = true;
  startFrameRateMonitor();
  console.log('🐛 [PERF] Debug mode ENABLED');
  console.log('Available commands:');
  console.log('  - window.perfDebug.getRenderStats()');
  console.log('  - window.perfDebug.getSubscriptionStats()');
  console.log('  - window.perfDebug.getMountStats()');
  console.log('  - window.perfDebug.getCurrentFPS()');
  console.log('  - window.perfDebug.getActiveAnimations()');
  console.log('  - window.perfDebug.resetAll()');
  console.log('  - window.perfDebug.disable()');
}

export function disableDebugMode() {
  debugMode = false;
  stopFrameRateMonitor();
  console.log('🐛 [PERF] Debug mode DISABLED');
}

export function isDebugMode() {
  return debugMode;
}

export function resetAll() {
  resetRenderStats();
  resetSubscriptionStats();
  clearAnimationRegistry();
  mountCounts.clear();
  unmountCounts.clear();
  mountTimestamps.clear();
  console.log('✅ [PERF] All stats reset');
}

// ============================================================================
// GLOBAL WINDOW API
// ============================================================================

if (typeof window !== 'undefined') {
  (window as any).perfDebug = {
    enable: enableDebugMode,
    disable: disableDebugMode,
    getRenderStats,
    getSubscriptionStats,
    getMountStats,
    getCurrentFPS,
    getActiveAnimations,
    resetAll,
    resetRenderStats,
    resetSubscriptionStats,
    logRender,
    logSubscriptionCreated,
    logSubscriptionClosed,
    logEventReceived,
    markStart,
    markEnd,
  };
  
  console.log('💡 Performance debug toolkit loaded. Type window.perfDebug.enable() to start monitoring.');
}
