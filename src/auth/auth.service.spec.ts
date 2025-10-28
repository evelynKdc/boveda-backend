import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import {
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { User } from 'src/users/entities/user.entity';
import { ZkpService } from '../zkp/zkp.service';

// --- Mocks de las Dependencias ---

const mockUsersService = {
  findOne: jest.fn(),
  create: jest.fn(),
};

const mockZkpService = {
  createChallenge: jest.fn(),
  verifyProof: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn(),
};

// --- Datos de Prueba ---
const testUser = {
  username: 'testUser',
  zkp: {
    publicKeyY: 'y',
    p: 'p',
    g: 'g',
  },
} as User; 

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: ZkpService,
          useValue: mockZkpService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // --- Pruebas para register ---
  describe('register', () => {
    const registerDto = {
      username: 'newUser',
      zkp: { publicKeyY: 'y', p: 'p', g: 'g' },
    };

    it('should successfully register a new user', async () => {
      // Configuración: findOne no encuentra nada (null)
      mockUsersService.findOne.mockResolvedValue(null);
      // Configuración: create devuelve el usuario creado
      mockUsersService.create.mockResolvedValue(testUser);

      await expect(service.register(registerDto)).resolves.toEqual(
        testUser,
      );

      // Verificamos que se llamó a los mocks correctos
      expect(mockUsersService.findOne).toHaveBeenCalledWith(
        registerDto.username,
      );
      expect(mockUsersService.create).toHaveBeenCalledWith(
        registerDto.username,
        registerDto.zkp,
      );
    });

    it('should throw ConflictException if username already exists', async () => {
      // Configuración: findOne SÍ encuentra un usuario
      mockUsersService.findOne.mockResolvedValue(testUser);

      // Verificamos que la promesa es rechazada con el error correcto
      await expect(
        service.register(registerDto),
      ).rejects.toThrow(ConflictException);

      // Verificamos que NO se intentó crear el usuario
      expect(mockUsersService.create).not.toHaveBeenCalled();
    });
  });

  // --- Pruebas para createChallenge ---
  describe('createChallenge', () => {
    const challengeDto = { username: 'testUser', t: '123' };

    it('should create a challenge for an existing user', async () => {
      // Configuración: findOne encuentra al usuario
      mockUsersService.findOne.mockResolvedValue(testUser);
      // Configuración: zkpService devuelve un desafío
      const challengeResponse = { c: '456' };
      mockZkpService.createChallenge.mockResolvedValue(challengeResponse);

      await expect(
        service.createChallenge(challengeDto),
      ).resolves.toEqual(challengeResponse);

      expect(mockUsersService.findOne).toHaveBeenCalledWith(
        challengeDto.username,
      );
      expect(mockZkpService.createChallenge).toHaveBeenCalledWith(
        challengeDto.username,
        challengeDto.t,
      );
    });

    it('should throw UnauthorizedException if user does not exist', async () => {
      // Configuración: findOne NO encuentra al usuario
      mockUsersService.findOne.mockResolvedValue(null);

      await expect(
        service.createChallenge(challengeDto),
      ).rejects.toThrow(UnauthorizedException);

      // Verificamos que NO se intentó crear un desafío
      expect(mockZkpService.createChallenge).not.toHaveBeenCalled();
    });
  });

  // --- Pruebas para verify ---
  describe('verify', () => {
    const verifyDto = { username: 'testUser', s: '789' };

    it('should successfully verify a valid proof and return an access token', async () => {
      const token = 'mockAccessToken';
      // Configuración:
      mockUsersService.findOne.mockResolvedValue(testUser); // Usuario existe
      mockZkpService.verifyProof.mockResolvedValue(true); //  Prueba ZKP es válida
      mockJwtService.sign.mockReturnValue(token); // Se firma el token

      const result = await service.verify(verifyDto);

      expect(result).toEqual({ accessToken: token });
      expect(mockUsersService.findOne).toHaveBeenCalledWith(
        verifyDto.username,
      );
      expect(mockZkpService.verifyProof).toHaveBeenCalledWith(
        verifyDto.username,
        verifyDto.s,
        testUser.zkp,
      );
      // Verificamos que el payload del JWT sea correcto
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        username: testUser.username,
        sub: testUser._id,
      });
    });

    it('should throw UnauthorizedException if user does not exist', async () => {
      // Configuración:
      mockUsersService.findOne.mockResolvedValue(null); 

      await expect(service.verify(verifyDto)).rejects.toThrow(
        'Verificación fallida',
      );

      // Verificamos que la lógica se detuvo allí
      expect(mockZkpService.verifyProof).not.toHaveBeenCalled();
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if ZKP is invalid', async () => {
      // Configuración:
      mockUsersService.findOne.mockResolvedValue(testUser);
      mockZkpService.verifyProof.mockResolvedValue(false); 

      await expect(service.verify(verifyDto)).rejects.toThrow(
        'Prueba de conocimiento cero inválida',
      );

      // Verificamos que no se llegó a firmar el token
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });
  });
});