// src/auth/dto/verify.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';
export class VerifyDto {
  @IsString() @IsNotEmpty() username: string;
  @IsString() @IsNotEmpty() s: string; 
}