// src/auth/dto/challenge.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';
export class ChallengeDto {
  @IsString() @IsNotEmpty() username: string;
  @IsString() @IsNotEmpty() t: string; // Compromiso t
}