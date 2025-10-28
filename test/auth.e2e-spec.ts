import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/users/entities/user.entity';
import { modPow } from 'bigint-mod-arith';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let userModel: Model<User>;

  // --- Datos Criptográficos Válidos ---
  const g_bigint = 5n;
  const p_bigint = 23n;
  const q_bigint = 22n; // q = p - 1
  const testX_secret = 6n; // El "password" secreto del cliente
  const testY_public = 8n; // y = g^x mod p = 5^6 mod 23 = 8

  // El 'r' secreto que el cliente generará. Lo hacemos fijo para una prueba predecible.
  const testR_secret = 10n;

  // Datos del usuario que se enviarán a /register
  const testUser = {
    username: 'e2eUser',
    zkp: {
      publicKeyY: testY_public.toString(), // "8"
      p: p_bigint.toString(), // "23"
      g: g_bigint.toString(), // "5"
    },
  };

  // --- Cliente ZKP Simulado ---
  const zkpClient = {
    /**
     * Cliente: Genera el compromiso 't'
     * t = g^r mod p
     */
    createCommitment: (r: bigint, g: bigint, p: bigint) => {
      const t = modPow(g, r, p);
      return { t, r }; // Devuelve 't' (público) y 'r' (secreto)
    },
    /**
     * Cliente: Genera la respuesta 's'
     * s = (r + c*x) mod q
     */
    createResponse: (
      r: bigint,
      c: bigint,
      x: bigint,
      q: bigint,
    ) => {
      const cx = c * x;
      const r_plus_cx = r + cx;
      
      const s = ((r_plus_cx % q) + q) % q;
      return s;
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    userModel = moduleFixture.get<Model<User>>(getModelToken(User.name));
  });

  afterEach(async () => {
    await userModel.deleteMany({ username: testUser.username });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Flujo de Autenticación Completo', () => {
    
    it('1. (POST /auth/register) debe registrar un nuevo usuario con datos ZKP válidos', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201)
        .expect((res) => {
          expect(res.body.username).toEqual(testUser.username);
          expect(res.body.zkp.publicKeyY).toEqual(testY_public.toString());
        });
    });

    it('2. (POST /auth/register) debe fallar si el usuario ya existe (409 Conflict)', async () => {
      await request(app.getHttpServer()).post('/auth/register').send(testUser);
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(409);
    });

    it('3. (POST /auth/login/challenge) debe fallar si el usuario no existe (401 Unauthorized)', () => {
      return request(app.getHttpServer())
        .post('/auth/login/challenge')
        .send({ username: 'usuarioQueNoExiste', t: '12345' })
        .expect(401);
    });

    it('4. (POST /auth/login/verify) debe fallar si no existe un desafío previo (401 Unauthorized)', () => {
      return request(app.getHttpServer())
        .post('/auth/login/verify')
        .send({ username: testUser.username, s: '12345' })
        .expect(401); // "Verificación fallida"
    });

    // --- EL FLUJO EXITOSO ---
    it('5. (POST /auth/login/...) debe completar el login exitosamente con una prueba ZKP válida', async () => {
      // --- PASO 1: Registrar el usuario ---
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201);

      // --- PASO 2: (CLIENTE) Generar compromiso 't' ---
      const { t } = zkpClient.createCommitment(
        testR_secret,
        g_bigint,
        p_bigint,
      ); // t = 5^10 mod 23 = 9

      // --- PASO 3: (SERVIDOR) Obtener desafío 'c' ---
      const challengeRes = await request(app.getHttpServer())
        .post('/auth/login/challenge')
        .send({ username: testUser.username, t: t.toString() })
        .expect(200);

      expect(challengeRes.body.c).toBeDefined();
      const c_from_server = BigInt(challengeRes.body.c);

      // --- PASO 4: (CLIENTE) Generar respuesta 's' ---
      const s = zkpClient.createResponse(
        testR_secret,
        c_from_server,
        testX_secret,
        q_bigint,
      );

      // --- PASO 5: (SERVIDOR) Verificar la prueba 's' ---
      return request(app.getHttpServer())
        .post('/auth/login/verify')
        .send({ username: testUser.username, s: s.toString() })
        .expect(200)
        .expect((res) => {
          // ¡Éxito! Recibimos un token
          expect(res.body.accessToken).toBeDefined();
          expect(res.body.accessToken.length).toBeGreaterThan(20);
        });
    });

    it('6. (POST /auth/login/verify) debe fallar con una prueba ZKP inválida (s incorrecto)', async () => {
      // Repetimos el flujo, pero enviamos un 's' manipulado
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201);
      const { t } = zkpClient.createCommitment(
        testR_secret,
        g_bigint,
        p_bigint,
      );
      const challengeRes = await request(app.getHttpServer())
        .post('/auth/login/challenge')
        .send({ username: testUser.username, t: t.toString() })
        .expect(200);
      const c_from_server = BigInt(challengeRes.body.c);
      const s_valid = zkpClient.createResponse(
        testR_secret,
        c_from_server,
        testX_secret,
        q_bigint,
      );
      
      const s_invalid = s_valid + 1n; // Manipulamos 's' para que sea inválido

      return request(app.getHttpServer())
        .post('/auth/login/verify')
        .send({ username: testUser.username, s: s_invalid.toString() })
        .expect(401) // 401 Unauthorized
        .expect((res) => {
          expect(res.body.message).toEqual(
            'Prueba de conocimiento cero inválida',
          );
          expect(res.body.accessToken).toBeUndefined();
        });
    });

    it('7. (POST /auth/login/verify) debe fallar si se reusa una prueba (Ataque de Repetición)', async () => {
      // --- PASO 1: Hacemos un login exitoso ---
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201);
      const { t } = zkpClient.createCommitment(
        testR_secret,
        g_bigint,
        p_bigint,
      );
      const challengeRes = await request(app.getHttpServer())
        .post('/auth/login/challenge')
        .send({ username: testUser.username, t: t.toString() })
        .expect(200);
      const c_from_server = BigInt(challengeRes.body.c);
      const s = zkpClient.createResponse(
        testR_secret,
        c_from_server,
        testX_secret,
        q_bigint,
      );
      await request(app.getHttpServer())
        .post('/auth/login/verify')
        .send({ username: testUser.username, s: s.toString() })
        .expect(200); // Éxito la primera vez

      // --- PASO 2: Intentamos reusar la misma prueba 's' ---
      return request(app.getHttpServer())
        .post('/auth/login/verify')
        .send({ username: testUser.username, s: s.toString() })
        .expect(401) // Falla la segunda vez
        .expect((res) => {
          expect(res.body.message).toContain('Prueba de conocimiento cero inválida');
          expect(res.body.accessToken).toBeUndefined();
        });
    });
  });
});