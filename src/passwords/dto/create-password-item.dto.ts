import { IsString, IsNotEmpty, IsOptional, IsUrl } from 'class-validator';

export class CreatePasswordItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  username: string;

  @IsUrl()
  @IsOptional()
  url: string;

  @IsString()
  @IsNotEmpty()
  encryptedData: string;
}