import { IsString, IsNotEmpty, IsIn, IsOptional } from 'class-validator';

export class AccountStatusDto {
  @IsString()
  @IsNotEmpty()
  external_account_id: string;

  @IsString()
  @IsIn(['connected', 'error', 'disconnected'])
  status: string;

  @IsString()
  @IsOptional()
  error_message?: string;
}
