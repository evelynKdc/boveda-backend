// src/auth/auth.controller.ts
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { ChallengeDto } from './dto/challenge.dto';
import { VerifyDto } from './dto/verify.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login/challenge')
  @HttpCode(HttpStatus.OK)
  createChallenge(@Body() challengeDto: ChallengeDto) {
    return this.authService.createChallenge(challengeDto);
  }

  @Post('login/verify')
  @HttpCode(HttpStatus.OK)
  verify(@Body() verifyDto: VerifyDto) {
    return this.authService.verify(verifyDto);
  }
}