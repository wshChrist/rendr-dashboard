import { Module } from '@nestjs/common';
import { TradesController } from './trades.controller';
import { TradesService } from './trades.service';
import { CashbackModule } from '../cashback/cashback.module';

@Module({
  imports: [CashbackModule],
  controllers: [TradesController],
  providers: [TradesService]
})
export class TradesModule {}
