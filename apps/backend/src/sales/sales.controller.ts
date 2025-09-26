import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { LicenseGuard } from '../auth/license.guard';
import { LicenseType } from '@prisma/client';

@Controller('sales')
export class SalesController {
  
  @Get('opportunities')
  @UseGuards(new LicenseGuard(LicenseType.SMART_SALES))
  async getOpportunities(@Request() req) {
    const { roleId, licenseType } = req.context;
    
    return {
      message: 'Sales opportunities retrieved successfully',
      context: {
        roleId,
        licenseType,
      },
      opportunities: [
        { id: '1', name: 'Enterprise Deal', amount: 50000, stage: 'negotiation', probability: 75 },
        { id: '2', name: 'SMB Contract', amount: 15000, stage: 'proposal', probability: 60 },
      ],
    };
  }

  @Post('opportunities')
  @UseGuards(new LicenseGuard(LicenseType.SMART_SALES))
  async createOpportunity(@Request() req, @Body() opportunityData: any) {
    const { roleId, licenseType } = req.context;
    
    return {
      message: 'Sales opportunity created successfully',
      context: {
        roleId,
        licenseType,
      },
      opportunity: {
        id: '3',
        ...opportunityData,
        stage: 'prospecting',
        probability: 25,
        createdAt: new Date(),
      },
    };
  }

  @Get('leads')
  @UseGuards(new LicenseGuard(LicenseType.SMART_SALES))
  async getLeads(@Request() req) {
    return {
      message: 'Sales leads retrieved successfully',
      leads: [
        { id: '1', name: 'Acme Corp', status: 'qualified', value: 25000 },
        { id: '2', name: 'TechStart Inc', status: 'prospecting', value: 10000 },
      ],
    };
  }
}
