import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class CreateTradingAccountDto {
  @IsString()
  @IsNotEmpty()
  broker: string;

  @IsString()
  @IsIn(['MT4', 'MT5'])
  platform: string;

  @IsString()
  @IsNotEmpty()
  server: string;

  @IsString()
  @IsNotEmpty()
  login: string;

  @IsString()
  @IsNotEmpty()
  investor_password: string;
}
