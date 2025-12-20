import { IsString, IsNotEmpty, IsNumber, IsDateString } from 'class-validator';

export class CreateTradeDto {
  @IsString()
  @IsNotEmpty()
  external_account_id: string;

  @IsNumber()
  ticket: number;

  @IsString()
  @IsNotEmpty()
  symbol: string;

  @IsNumber()
  lots: number;

  @IsNumber()
  commission: number;

  @IsNumber()
  swap: number;

  @IsNumber()
  profit: number;

  @IsDateString()
  open_time: string;

  @IsDateString()
  close_time: string;

  @IsString()
  @IsNotEmpty()
  signature: string;
}
