import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

@Injectable()
export class LicenseCacheService {
  private rolePermissionsCache = new Map<string, CacheEntry<any>>();
  private roleUIConfigCache = new Map<string, CacheEntry<any>>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(private prisma: PrismaService) {}

  /**
   * Get role permissions with caching
   */
  async getRolePermissions(roleId: string) {
    const cacheKey = `role_permissions_${roleId}`;
    const cached = this.rolePermissionsCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    const permissions = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissionSets: {
          include: {
            permissionSet: true,
          },
        },
      },
    });

    this.rolePermissionsCache.set(cacheKey, {
      data: permissions,
      timestamp: Date.now(),
    });

    return permissions;
  }

  /**
   * Get role UI config with caching
   */
  async getRoleUIConfig(roleId: string) {
    const cacheKey = `role_uiconfig_${roleId}`;
    const cached = this.roleUIConfigCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    const uiConfig = await this.prisma.uIConfig.findUnique({
      where: { roleId },
      include: {
        role: true,
      },
    });

    this.roleUIConfigCache.set(cacheKey, {
      data: uiConfig,
      timestamp: Date.now(),
    });

    return uiConfig;
  }

  /**
   * Clear cache for a specific role
   */
  clearRoleCache(roleId: string) {
    this.rolePermissionsCache.delete(`role_permissions_${roleId}`);
    this.roleUIConfigCache.delete(`role_uiconfig_${roleId}`);
  }

  /**
   * Clear all caches
   */
  clearAllCaches() {
    this.rolePermissionsCache.clear();
    this.roleUIConfigCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      rolePermissionsCacheSize: this.rolePermissionsCache.size,
      roleUIConfigCacheSize: this.roleUIConfigCache.size,
      totalCacheEntries: this.rolePermissionsCache.size + this.roleUIConfigCache.size,
    };
  }
}
