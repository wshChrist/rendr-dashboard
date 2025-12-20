import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req
} from '@nestjs/common';
import { TradesService } from './trades.service';
import { TradeSignatureGuard } from '../auth/guards/trade-signature.guard';
import { CreateTradeDto } from './dto/create-trade.dto';
import { RegisterAccountDto } from './dto/register-account.dto';

@Controller('trades')
export class TradesController {
  constructor(private readonly tradesService: TradesService) {}

  @Post('register')
  @HttpCode(HttpStatus.OK)
  async registerAccount(@Body() dto: RegisterAccountDto) {
    return this.tradesService.registerAccount(dto);
  }

  @Post()
  @UseGuards(TradeSignatureGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateTradeDto,
    @Req() request: any
  ): Promise<{ success: boolean }> {
    // tradingAccountId est injecté par le guard dans request.tradingAccountId
    const tradingAccountId = request.tradingAccountId;
    await this.tradesService.create(tradingAccountId, dto);
    return { success: true };
  }
}
