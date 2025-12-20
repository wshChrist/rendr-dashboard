import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TradingAccountsModule } from './trading-accounts/trading-accounts.module';
import { VpsModule } from './vps/vps.module';
import { TradesModule } from './trades/trades.module';
import { CashbackModule } from './cashback/cashback.module';
import { ConfigModule as AppConfigModule } from './config/config.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env'
    }),
    AppConfigModule,
    TradingAccountsModule,
    VpsModule,
    TradesModule,
    CashbackModule
  ]
})
export class AppModule {}
