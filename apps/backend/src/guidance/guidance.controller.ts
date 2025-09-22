import { Body, Controller, Get, Param, Post, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { GuidanceService } from './guidance.service';
import { StartRunDto } from './dto/start-run.dto';
import { AnswerDto } from './dto/answer.dto';
import { PublishDto } from './dto/publish.dto';
import { LicenseGuard } from '../auth/license.guard';
import { LicenseType } from '@prisma/client';

function ensureAdminPermission(req: any) {
  const perms: string[] = req.user?.permissions ?? [];
  if (!perms.includes('gov_311.configure') && !perms.includes('guidance.admin')) {
    throw new ForbiddenException('Missing admin permission');
  }
}

@Controller('guidance')
export class GuidanceController {
  constructor(private readonly svc: GuidanceService) {}

  @Get('scripts/:key')
  @UseGuards(new LicenseGuard(LicenseType.SMART_SERVICE))
  getActive(@Param('key') key: string, @Req() req: any) {
    const { tenantId } = req.user || {};
    return this.svc.getActiveScriptByKey(tenantId, key);
  }

  @Post('scripts/:key/run')
  @UseGuards(new LicenseGuard(LicenseType.SMART_SERVICE))
  startRun(@Param('key') key: string, @Body() dto: StartRunDto, @Req() req: any) {
    const { tenantId, sub: userId } = req.user || {};
    return this.svc.startRun(tenantId, key, dto.subjectSchema, dto.subjectModel, dto.subjectId, userId);
  }

  @Post('runs/:id/answer')
  @UseGuards(new LicenseGuard(LicenseType.SMART_SERVICE))
  answer(@Param('id') id: string, @Body() dto: AnswerDto) {
    return this.svc.answer(id, dto.nodeKey, dto.value);
  }

  @Post('runs/:id/advance')
  @UseGuards(new LicenseGuard(LicenseType.SMART_SERVICE))
  advance(@Param('id') id: string) {
    return this.svc.advance(id);
  }

  @Post('scripts/:id/publish')
  publish(@Param('id') id: string, @Body() dto: PublishDto, @Req() req: any) {
    ensureAdminPermission(req);
    return this.svc.publishScript(id, dto.version, req.user?.sub ?? null);
  }
}
