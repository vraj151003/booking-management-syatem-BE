import { SetMetadata } from '@nestjs/common';

export const THROTTLE_KEY = 'throttle';
export const BYPASS_THROTTLE = 'bypassThrottle';

export const Throttle = (limit?: number, ttl?: number) =>
  SetMetadata(THROTTLE_KEY, { limit, ttl });

export const BypassThrottle = () => SetMetadata(BYPASS_THROTTLE, true);
