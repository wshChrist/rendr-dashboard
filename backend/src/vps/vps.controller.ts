import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { VpsService } from './vps.service';
import { VpsApiKeyGuard } from '../auth/guards/vps-api-key.guard';
import { AccountStatusDto } from './dto/account-status.dto';
import { PendingAccountDto } from './dto/pending-account.dto';

@Controller('vps')
@UseGuards(VpsApiKeyGuard)
export class VpsController {
  constructor(private readonly vpsService: VpsService) {}

  @Get('pending-accounts')
  async getPendingAccounts(): Promise<PendingAccountDto[]> {
    return this.vpsService.getPendingAccounts();
  }

  @Post('account-status')
  async updateAccountStatus(
    @Body() dto: AccountStatusDto
  ): Promise<{ success: boolean }> {
    await this.vpsService.updateAccountStatus(dto);
    return { success: true };
  }
}
