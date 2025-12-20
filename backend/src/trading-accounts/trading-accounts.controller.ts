import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { TradingAccountsService } from './trading-accounts.service';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateTradingAccountDto } from './dto/create-trading-account.dto';
import { TradingAccountResponseDto } from './dto/trading-account-response.dto';

@Controller('trading-accounts')
@UseGuards(SupabaseAuthGuard)
export class TradingAccountsController {
  constructor(
    private readonly tradingAccountsService: TradingAccountsService
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: any,
    @Body() dto: CreateTradingAccountDto
  ): Promise<TradingAccountResponseDto> {
    return this.tradingAccountsService.create(user.id, dto);
  }

  @Get()
  async findAll(@CurrentUser() user: any) {
    return this.tradingAccountsService.findByUserId(user.id);
  }
}
