import { Injectable, ExecutionContext, ForbiddenException, CanActivate } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ThrottlerConfigService } from './throttler.service';
import { RedisService } from '../../module/redis/redis.service';
import { BYPASS_THROTTLE } from './throttler.decorator';

@Injectable()
export class CustomThrottlerGuard implements CanActivate {
  constructor(
    private readonly throttlerConfigService: ThrottlerConfigService,
    private readonly redisService: RedisService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if throttling is bypassed for this route
    const bypassThrottle = this.reflector.getAllAndOverride<boolean>(BYPASS_THROTTLE, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (bypassThrottle) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const userId = request.user?.id;
    const ip = request.ip;

    // Get tier-based rate limit
    const rateLimitConfig = await this.throttlerConfigService.getRateLimitForUser(userId);

    // Create a unique key for rate limiting
    const tracker = userId ? `rate_limit:user:${userId}` : `rate_limit:ip:${ip}`;

    // Use Redis INCR for atomic increment
    const count = await this.redisService.increment(tracker);

    // console.log(`[Throttler] Tracker: ${tracker}, Count: ${count}, Limit: ${rateLimitConfig.limit}, TTL: ${rateLimitConfig.ttl}s`);

    // If this is the first request, set the expiry
    if (count === 1) {
      await this.redisService.expire(tracker, rateLimitConfig.ttl);
    }

    // Get TTL for reset header
    const resetTime = Math.ceil(Date.now() / 1000) + rateLimitConfig.ttl;

    if (count > rateLimitConfig.limit) {
      // Rate limit exceeded
      response.setHeader('X-RateLimit-Limit', rateLimitConfig.limit);
      response.setHeader('X-RateLimit-Remaining', 0);
      response.setHeader('X-RateLimit-Reset', resetTime);
      
      throw new ForbiddenException(
        'Too many requests. Please try again later.',
      );
    }

    // Set rate limit headers
    response.setHeader('X-RateLimit-Limit', rateLimitConfig.limit);
    response.setHeader('X-RateLimit-Remaining', rateLimitConfig.limit - count);
    response.setHeader('X-RateLimit-Reset', resetTime);

    return true;
  }
}
