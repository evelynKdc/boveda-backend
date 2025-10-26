// src/zkp/zkp.service.ts
import { Inject, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { modPow } from 'bigint-mod-arith';
import { ZkpData } from 'src/users/entities/user.entity';
import {
    CHALLENGE_STORE,
    IChallengeStore,
    ChallengeData,
} from './challenge.store';


@Injectable()
export class ZkpService {
    constructor(
        @Inject(CHALLENGE_STORE) private challengeStore: IChallengeStore,
    ) { }
    /**
     * Genera un desafío 'c' y almacena temporalmente el compromiso 't'.
     * Esta es la primera parte del protocolo ZKP de Schnorr.
     *
     * @param username - El identificador del usuario.
     * @param t - El compromiso (t = g^r) enviado por el cliente.
     * @returns Un objeto que contiene el desafío 'c' como string.
     */
    async createChallenge(
        username: string,
        t: string,
    ): Promise<{ c: string }> {
        const t_bigint = BigInt(t);
        // Generamos un desafío aleatorio 'c'
        const c_bigint = BigInt(crypto.randomInt(1, 1000000));

        // Almacenamos 't' y 'c' para la verificación
        await this.challengeStore.set(username, { t: t_bigint, c: c_bigint });

        return { c: c_bigint.toString() };
    }

    /**
     * Verifica la prueba de conocimiento cero (s = r + c*x).
     * La verificación es: g^s == t * y^c (mod p)
     *
     * @param username - El identificador del usuario.
     * @param s - La respuesta al desafío (s) enviada por el cliente.
     * @param zkpData - Los datos ZKP públicos del usuario (y, p, g).
     * @returns `true` si la prueba es válida, `false` en caso contrario.
     */
    async verifyProof(
        username: string,
        s: string,
        zkpData: ZkpData,
    ): Promise<boolean> {
        // 1. Recuperar el desafío
        const challenge = await this.challengeStore.get(username);
        if (!challenge) {
            return false; // Desafío no encontrado o expirado
        }

        // El desafío es de un solo uso. 
        await this.challengeStore.delete(username);

        // 2. Convertir todos los valores a BigInt para aritmética
        const { t, c } = challenge;
        const s_bigint = BigInt(s);
        const { publicKeyY, p, g } = zkpData;

        const y_bigint = BigInt(publicKeyY);
        const p_bigint = BigInt(p);
        const g_bigint = BigInt(g);

        // 3. Calcular el lado izquierdo: g^s (mod p)
        const ladoIzquierdo = modPow(g_bigint, s_bigint, p_bigint);

        // 4. Calcular el lado derecho: t * y^c (mod p)
        const y_elevado_c = modPow(y_bigint, c, p_bigint);
        const ladoDerecho = (t * y_elevado_c) % p_bigint;

        // 5. Comparar
        return ladoIzquierdo === ladoDerecho;
    }
}