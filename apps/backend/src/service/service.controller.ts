import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { LicenseGuard } from '../auth/license.guard';
import { LicenseType } from '@prisma/client';

@Controller('service')
export class ServiceController {
  
  @Get('tickets')
  @UseGuards(new LicenseGuard(LicenseType.SMART_SERVICE))
  async getTickets(@Request() req) {
    // Access license context from guard
    const { roleId, licenseType, userLicenseId } = req.context;
    
    return {
      message: 'Service tickets retrieved successfully',
      context: {
        roleId,
        licenseType,
        userLicenseId,
      },
      tickets: [
        { id: '1', subject: 'Login issue', status: 'open' },
        { id: '2', subject: 'Feature request', status: 'in-progress' },
      ],
    };
  }

  @Post('tickets')
  @UseGuards(new LicenseGuard(LicenseType.SMART_SERVICE))
  async createTicket(@Request() req, @Body() ticketData: any) {
    const { roleId, licenseType } = req.context;
    
    return {
      message: 'Service ticket created successfully',
      context: {
        roleId,
        licenseType,
      },
      ticket: {
        id: '3',
        ...ticketData,
        status: 'open',
        createdAt: new Date(),
      },
    };
  }

  @Get('cases')
  @UseGuards(new LicenseGuard(LicenseType.SMART_SERVICE))
  async getCases(@Request() req) {
    return {
      message: 'Service cases retrieved successfully',
      cases: [
        { id: '1', caseNumber: 'CASE-001', subject: 'Technical support', priority: 'high' },
        { id: '2', caseNumber: 'CASE-002', subject: 'Bug report', priority: 'medium' },
      ],
    };
  }
}
