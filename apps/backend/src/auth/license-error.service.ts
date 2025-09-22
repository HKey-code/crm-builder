import { Injectable } from '@nestjs/common';

export enum LicenseErrorCode {
  SEAT_EXPIRED = 'SEAT_EXPIRED',
  NO_TENANT_LICENSE = 'NO_TENANT_LICENSE',
  TENANT_RETIRED = 'TENANT_RETIRED',
  SEAT_SUSPENDED = 'SEAT_SUSPENDED',
  NO_SEATS_AVAILABLE = 'NO_SEATS_AVAILABLE',
  LICENSE_NOT_FOUND = 'LICENSE_NOT_FOUND',
  INVALID_LICENSE_TYPE = 'INVALID_LICENSE_TYPE',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  TENANT_NOT_FOUND = 'TENANT_NOT_FOUND',
}

export interface LicenseErrorResponse {
  code: LicenseErrorCode;
  message: string;
  detail?: string;
  timestamp: string;
}

@Injectable()
export class LicenseErrorService {
  /**
   * Create standardized license error response
   */
  createError(code: LicenseErrorCode, detail?: string): LicenseErrorResponse {
    const messages = {
      [LicenseErrorCode.SEAT_EXPIRED]: 'User license seat has expired',
      [LicenseErrorCode.NO_TENANT_LICENSE]: 'No active license found for this tenant and license type',
      [LicenseErrorCode.TENANT_RETIRED]: 'Tenant license has been retired or expired',
      [LicenseErrorCode.SEAT_SUSPENDED]: 'User license seat has been suspended',
      [LicenseErrorCode.NO_SEATS_AVAILABLE]: 'No seats available for this license type',
      [LicenseErrorCode.LICENSE_NOT_FOUND]: 'License not found',
      [LicenseErrorCode.INVALID_LICENSE_TYPE]: 'Invalid license type specified',
      [LicenseErrorCode.USER_NOT_FOUND]: 'User not found',
      [LicenseErrorCode.TENANT_NOT_FOUND]: 'Tenant not found',
    };

    return {
      code,
      message: messages[code],
      detail,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Create error for expired seat
   */
  seatExpired(userId: string, licenseType: string): LicenseErrorResponse {
    return this.createError(
      LicenseErrorCode.SEAT_EXPIRED,
      `User ${userId} seat expired for ${licenseType}`
    );
  }

  /**
   * Create error for no tenant license
   */
  noTenantLicense(tenantId: string, licenseType: string): LicenseErrorResponse {
    return this.createError(
      LicenseErrorCode.NO_TENANT_LICENSE,
      `No active license found for tenant ${tenantId} and type ${licenseType}`
    );
  }

  /**
   * Create error for retired tenant license
   */
  tenantRetired(tenantId: string, licenseType: string): LicenseErrorResponse {
    return this.createError(
      LicenseErrorCode.TENANT_RETIRED,
      `Tenant ${tenantId} license for ${licenseType} has been retired or expired`
    );
  }

  /**
   * Create error for suspended seat
   */
  seatSuspended(userId: string, licenseType: string): LicenseErrorResponse {
    return this.createError(
      LicenseErrorCode.SEAT_SUSPENDED,
      `User ${userId} seat suspended for ${licenseType}`
    );
  }

  /**
   * Create error for no available seats
   */
  noSeatsAvailable(tenantId: string, licenseType: string, totalSeats: number): LicenseErrorResponse {
    return this.createError(
      LicenseErrorCode.NO_SEATS_AVAILABLE,
      `No seats available for tenant ${tenantId}, license ${licenseType}. Maximum ${totalSeats} seats already assigned.`
    );
  }

  /**
   * Create error for license not found
   */
  licenseNotFound(licenseId: string): LicenseErrorResponse {
    return this.createError(
      LicenseErrorCode.LICENSE_NOT_FOUND,
      `License with ID ${licenseId} not found`
    );
  }

  /**
   * Create error for invalid license type
   */
  invalidLicenseType(licenseType: string): LicenseErrorResponse {
    return this.createError(
      LicenseErrorCode.INVALID_LICENSE_TYPE,
      `Invalid license type: ${licenseType}`
    );
  }

  /**
   * Create error for user not found
   */
  userNotFound(userId: string): LicenseErrorResponse {
    return this.createError(
      LicenseErrorCode.USER_NOT_FOUND,
      `User with ID ${userId} not found`
    );
  }

  /**
   * Create error for tenant not found
   */
  tenantNotFound(tenantId: string): LicenseErrorResponse {
    return this.createError(
      LicenseErrorCode.TENANT_NOT_FOUND,
      `Tenant with ID ${tenantId} not found`
    );
  }
}
