import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../module/users/entity/user.entity';

export interface RateLimitConfig {
  ttl: number;
  limit: number;
}

@Injectable()
export class ThrottlerConfigService {
  // Rate limit configuration - can be extended or moved to config file
  private readonly rateLimitConfig: Record<string, RateLimitConfig> = {
    ADMIN: {
      ttl: 60, // 1 minute
      limit: 50, // 5 requests per minute (for testing)
    },
    THEATER_OWNER: {
      ttl: 60, // 1 minute
      limit: 50, // 3 requests per minute (for testing)
    },
    USER: {
      ttl: 60, // 1 minute
      limit: 50, // 2 requests per minute (for testing)
    },
  };

  private readonly guestRateLimit: RateLimitConfig = {
    ttl: 60, // 1 minute
    limit: 50, // 1 request per minute (for testing)
  };

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async getRateLimitForUser(userId?: string): Promise<RateLimitConfig> {
    if (!userId) {
      return this.guestRateLimit;
    }

    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['role'],
    });

    if (!user || !user.role) {
      return this.guestRateLimit;
    }

    return this.getRateLimitByRole(user.role.name);
  }

  private getRateLimitByRole(roleName: string): RateLimitConfig {
    // Return configured rate limit for the role, or default to guest limit
    return this.rateLimitConfig[roleName] || this.guestRateLimit;
  }

  // Method to add or update rate limit for a role dynamically
  setRateLimitForRole(roleName: string, config: RateLimitConfig): void {
    this.rateLimitConfig[roleName] = config;
  }

  // Method to get all configured rate limits
  getAllRateLimits(): Record<string, RateLimitConfig> {
    return {
      ...this.rateLimitConfig,
      GUEST: this.guestRateLimit,
    };
  }
}
