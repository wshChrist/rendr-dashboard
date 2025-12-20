import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class RegisterAccountDto {
  @IsNumber()
  account_number: number;

  @IsString()
  @IsNotEmpty()
  server: string;

  @IsString()
  @IsNotEmpty()
  platform: string; // 'MT4' ou 'MT5'
}
