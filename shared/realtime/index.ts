/**
 * Shared real-time communication infrastructure utilities
 * 
 * This module provides reusable utilities for improving reliability
 * of real-time calls (LiveKit and WebRTC).
 * 
 * @module shared/realtime
 */

export { 
  useConnectionSupervisor,
  type ConnectionState,
  type ConnectionSupervisorOptions 
} from './connection-supervisor';

export { 
  useHeartbeat,
  useLiveKitHeartbeat,
  useWebRTCHeartbeat,
  type HeartbeatOptions 
} from './heartbeat';

export { 
  ResilientApiClient,
  type CircuitState,
  type ResilientApiClientOptions,
  type ApiMetrics 
} from './resilient-api-client';

export { 
  useTokenManager,
  type TokenManagerOptions 
} from './token-manager';

export { 
  useNetworkQuality,
  type NetworkQuality,
  type ConnectionType,
  type NetworkQualityState 
} from './network-quality';
