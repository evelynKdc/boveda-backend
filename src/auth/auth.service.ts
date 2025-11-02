// src/auth/auth.service.ts
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { User } from 'src/users/entities/user.entity';
import { ChallengeDto } from './dto/challenge.dto';
import { ZkpService } from 'src/zkp/zkp.service';
import { VerifyDto } from './dto/verify.dto';


@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private zkpService: ZkpService,
  ) { }

  async register(registerDto: RegisterDto): Promise<User> {
    const existingUser = await this.usersService.findOne(registerDto.username);
    if (existingUser) {
      throw new ConflictException('El nombre de usuario ya existe');
    }
    return this.usersService.create(registerDto.username, registerDto.zkp);
  }

  async createChallenge(challengeDto: ChallengeDto): Promise<{ c: string }> {
    const user = await this.usersService.findOne(challengeDto.username);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return await this.zkpService.createChallenge(
      challengeDto.username,
      challengeDto.t,
    );
  }

  async verify(verifyDto: VerifyDto): Promise<{ accessToken: string, user: User }> {
    const user = await this.usersService.findOne(verifyDto.username);
    if (!user) {
      throw new UnauthorizedException('Verificación fallida');
    }

    const isProofValid = await this.zkpService.verifyProof(
      verifyDto.username,
      verifyDto.s,
      user.zkp,
    );

    if (!isProofValid) {
      throw new UnauthorizedException('Prueba de conocimiento cero inválida');
    }

    const payload = { username: user.username, sub: user._id };
    return {
      accessToken: this.jwtService.sign(payload),
      user,
    };
  }
}