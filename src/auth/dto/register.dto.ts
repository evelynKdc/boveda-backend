// src/auth/dto/register.dto.ts
import { IsNotEmpty, IsObject, IsString } from 'class-validator';
import { ZkpDataDto } from './zkp.dto';



export class RegisterDto {
  @IsString() @IsNotEmpty() username: string;
  @IsObject() zkp: ZkpDataDto;
}



// src/auth/dto/verify.dto.ts
export class VerifyDto {
  @IsString() @IsNotEmpty() username: string;
  @IsString() @IsNotEmpty() s: string; // Respuesta s
}