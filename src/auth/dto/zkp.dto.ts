import { IsNotEmpty, IsString } from 'class-validator';

export class ZkpDataDto {
  @IsString() @IsNotEmpty() publicKeyY: string;
  @IsString() @IsNotEmpty() p: string;
  @IsString() @IsNotEmpty() g: string;
}