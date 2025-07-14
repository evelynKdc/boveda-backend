// src/auth/auth.service.ts
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as crypto from 'crypto';
import { modPow } from 'bigint-mod-arith';
import { RegisterDto, VerifyDto } from './dto/register.dto';
import { User } from 'src/users/entities/user.entity';
import { ChallengeDto } from './dto/challenge.dto';

// Almacenamiento en memoria para los desafíos. En producción, usar Redis.
const challengeStore = new Map<string, { t: bigint; c: bigint }>();

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

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

    const t = BigInt(challengeDto.t);
    const c = BigInt(crypto.randomInt(1, 1000000)); // Desafío aleatorio

    challengeStore.set(user.username, { t, c });

    return { c: c.toString() };
  }

  async verify(verifyDto: VerifyDto): Promise<{ accessToken: string }> {
    const user = await this.usersService.findOne(verifyDto.username);
    const challenge = challengeStore.get(verifyDto.username);

    if (!user || !challenge) {
      throw new UnauthorizedException('Verificación fallida o expirada');
    }

    const { t, c } = challenge;
    const s = BigInt(verifyDto.s);
    const { publicKeyY, p, g } = user.zkp;

    const y_bigint = BigInt(publicKeyY);
    const p_bigint = BigInt(p);
    const g_bigint = BigInt(g);

    // Verificación: g^s == t * y^c (mod p)
    const ladoIzquierdo = modPow(g_bigint, s, p_bigint);
    const y_elevado_c = modPow(y_bigint, c, p_bigint);
    const ladoDerecho = (t * y_elevado_c) % p_bigint;

    challengeStore.delete(verifyDto.username); // El desafío es de un solo uso

    if (ladoIzquierdo !== ladoDerecho) {
      throw new UnauthorizedException('Prueba de conocimiento cero inválida');
    }

    const payload = { username: user.username, sub: user._id };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
}