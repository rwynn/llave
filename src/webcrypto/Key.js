import { Buffer } from 'buffer/';
import EventEmitter from 'events';
import { saltLength, keySize, iterations, derivedKeyBits } from './Constants';

const { crypto } = window,
    subtle = crypto.subtle;

class Key extends EventEmitter {
    constructor(masterKey, saltBuffer) {
        super();
        this.state = {};
        this.masterKey = masterKey;
        this.saltBuffer = saltBuffer;
        this.importMaster = this.importMaster.bind(this);
        this.deriveEncryption = this.deriveEncryption.bind(this);
        this.onDeriveEncryption = this.onDeriveEncryption.bind(this);
        this.importSign = this.importSign.bind(this);
        Object.freeze(this);
    }

    rejectSupport() {
        return Promise.reject('Platform does not support Web Crypto');
    }

    notSupported() {
        try {
            window.crypto = false;
            if (window.crypto === false) {
                return true;
            }
        } catch (err) {}
        try {
            window.crypto.subtle = false;
            if (window.crypto.subtle === false) {
                return true;
            } 
        } catch (err) {}
        return subtle === undefined;
    }

    importMaster() {
        if (this.notSupported()) return this.rejectSupport();
        const key = Buffer.from(this.masterKey, 'utf-8').buffer;
        return subtle
            .importKey(
                'raw',
                key,
                {
                    name: 'PBKDF2'
                },
                false,
                ['deriveBits', 'deriveKey']
            )
            .then(this.deriveEncryption);
    }

    deriveEncryption(masterKey) {
        if (!this.saltBuffer) {
            return Promise.reject('invalid salt');
        }
        if (this.saltBuffer.byteLength !== saltLength) {
            return Promise.reject('invalid salt');
        }
        return subtle
            .deriveKey(
                {
                    name: 'PBKDF2',
                    salt: this.saltBuffer,
                    iterations: iterations,
                    hash: 'SHA-256'
                },
                masterKey,
                { name: 'AES-CBC', length: derivedKeyBits },
                true,
                ['encrypt', 'decrypt']
            )
            .then(this.onDeriveEncryption);
    }

    onDeriveEncryption(encryptKey) {
        const { state } = this;
        state.encryptKey = encryptKey;
        return subtle.exportKey('raw', encryptKey).then(this.importSign);
    }

    importSign(key) {
        if (key.byteLength !== keySize) {
            return Promise.reject('invalid key size');
        }
        return subtle
            .importKey(
                'raw',
                key,
                { name: 'HMAC', hash: { name: 'SHA-256' } },
                false,
                ['sign', 'verify']
            )
            .then(signKey => {
                const { state } = this;
                state.signKey = signKey;
                const keys = Object.freeze({
                    sign: state.signKey,
                    verify: state.signKey,
                    encrypt: state.encryptKey,
                    decrypt: state.encryptKey
                });
                return Promise.resolve(keys);
            });
    }
}

export default Key;
