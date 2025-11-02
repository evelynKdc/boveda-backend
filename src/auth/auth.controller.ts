// src/auth/auth.controller.ts
import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Get, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { ChallengeDto } from './dto/challenge.dto';
import { VerifyDto } from './dto/verify.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UsersService } from 'src/users/users.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService, private usersService: UsersService,) { }

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


  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    const userId = req.user.userId;
    return this.usersService.findById(userId);
  }
}