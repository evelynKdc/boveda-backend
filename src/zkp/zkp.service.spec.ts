import { Test, TestingModule } from '@nestjs/testing';
import { ZkpService } from './zkp.service';
import {
  CHALLENGE_STORE,
  IChallengeStore,
  ChallengeData,
} from './challenge.store';
import { ZkpData } from 'src/users/entities/user.entity';
import * as crypto from 'crypto';

// 1. Creamos un Mock del Store
const mockChallengeStore: IChallengeStore = {
  set: jest.fn().mockResolvedValue(undefined),
  get: jest.fn().mockResolvedValue(undefined),
  delete: jest.fn().mockResolvedValue(true),
};

// 2. Mock de 'crypto.randomInt'
jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomInt: jest.fn(),
}));
const mockedCrypto = crypto as jest.Mocked<typeof crypto>;

describe('ZkpService', () => {
  let service: ZkpService;

  beforeEach(async () => {
    // Reiniciamos todos los mocks antes de cada prueba
    jest.clearAllMocks();

    // 3. Configuramos el módulo de pruebas
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ZkpService,
        {
          provide: CHALLENGE_STORE,
          useValue: mockChallengeStore,
        },
      ],
    }).compile();

    service = module.get<ZkpService>(ZkpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // --- Pruebas para createChallenge ---
  describe('createChallenge', () => {
    it('should create and store a challenge with a mocked random value', async () => {
      const username = 'testUser';
      const t_string = '987654321';
      const t_bigint = BigInt(t_string);
      const c_random_bigint = BigInt(12345);

      // Controlamos el valor que devolverá crypto.randomInt
      mockedCrypto.randomInt.mockImplementationOnce(() => 12345);

      // Ejecutamos la función
      const result = await service.createChallenge(username, t_string);

      // Afirmación 1: ¿Devolvió el 'c' correcto?
      expect(result).toEqual({ c: '12345' });

      // Afirmación 2: ¿Llamó a crypto.randomInt?
      expect(mockedCrypto.randomInt).toHaveBeenCalledWith(1, 1000000);

      // Afirmación 3: ¿Guardó los datos correctos en el store?
      expect(mockChallengeStore.set).toHaveBeenCalledWith(username, {
        t: t_bigint,
        c: c_random_bigint,
      });
      expect(mockChallengeStore.set).toHaveBeenCalledTimes(1);
    });
  });

  // --- Pruebas para verifyProof ---
  describe('verifyProof', () => {
    // Datos de prueba ZKP válidos
    // g = 5, p = 23, x = 6  =>  y = 5^6 mod 23 = 8
    // r = 10                 =>  t = 5^10 mod 23 = 9
    // c = 12
    // s = (r + c*x) mod (p-1) = (10 + 12*6) mod 22 = 82 mod 22 = 16
    const zkpData: ZkpData = {
      publicKeyY: '8', // y
      p: '23',
      g: '5',
    };
    const s_valid = '16';
    const challenge_valid: ChallengeData = {
      t: BigInt(9),
      c: BigInt(12),
    };
    const username = 'testUser';

    it('should return TRUE for a valid proof and delete the challenge', async () => {
      // 1. Configuración: El store debe devolver el desafío correcto
      (mockChallengeStore.get as jest.Mock).mockReturnValueOnce(
        challenge_valid,
      );

      // 2. Ejecución
      const isValid = await service.verifyProof(username, s_valid, zkpData);

      // 3. Afirmaciones
      expect(isValid).toBe(true);
      expect(mockChallengeStore.get).toHaveBeenCalledWith(username);
      // Debe borrar el desafío después de usarlo
      expect(mockChallengeStore.delete).toHaveBeenCalledWith(username);
      expect(mockChallengeStore.delete).toHaveBeenCalledTimes(1);
    });

    it('should return FALSE if the challenge is not found (expired/invalid)', async () => {
      // 1. Configuración: El store no encuentra nada
      (mockChallengeStore.get as jest.Mock).mockReturnValueOnce(undefined);

      // 2. Ejecución
      const isValid = await service.verifyProof(username, s_valid, zkpData);

      // 3. Afirmaciones
      expect(isValid).toBe(false);
      expect(mockChallengeStore.get).toHaveBeenCalledWith(username);
      // NO debe intentar borrar algo que no encontró
      expect(mockChallengeStore.delete).not.toHaveBeenCalled();
    });

    it('should return FALSE for an invalid proof (s is wrong) and delete challenge', async () => {
      const s_invalid = '17'; // s debería ser 16
      // 1. Configuración: El store devuelve el desafío
      (mockChallengeStore.get as jest.Mock).mockReturnValueOnce(
        challenge_valid,
      );

      // 2. Ejecución
      const isValid = await service.verifyProof(username, s_invalid, zkpData);

      // 3. Afirmaciones
      expect(isValid).toBe(false);
      // Aún debe borrar el desafío, ya que es de un solo uso
      expect(mockChallengeStore.delete).toHaveBeenCalledWith(username);
    });

    it('should return FALSE if t from store is wrong and delete challenge', async () => {
      // 1. Configuración: El store devuelve un 't' manipulado
      const challenge_invalid_t: ChallengeData = {
        t: BigInt(10), // t debería ser 9
        c: BigInt(12),
      };
      (mockChallengeStore.get as jest.Mock).mockReturnValueOnce(
        challenge_invalid_t,
      );

      // 2. Ejecución
      const isValid = await service.verifyProof(username, s_valid, zkpData);

      // 3. Afirmaciones
      expect(isValid).toBe(false);
      expect(mockChallengeStore.delete).toHaveBeenCalledWith(username);
    });

    it('should return FALSE if c from store is wrong and delete challenge', async () => {
      // 1. Configuración: El store devuelve un 'c' manipulado
      const challenge_invalid_c: ChallengeData = {
        t: BigInt(9),
        c: BigInt(13), // c debería ser 12
      };
      (mockChallengeStore.get as jest.Mock).mockReturnValueOnce(
        challenge_invalid_c,
      );

      // 2. Ejecución
      const isValid = await service.verifyProof(username, s_valid, zkpData);

      // 3. Afirmaciones
      expect(isValid).toBe(false);
      expect(mockChallengeStore.delete).toHaveBeenCalledWith(username);
    });
  });
});