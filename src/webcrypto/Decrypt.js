import { Buffer } from 'buffer/';
import EventEmitter from 'events';
import Key from './Key';
import { gunzip } from 'zlib';
import { saltLength, hmacSize, blockSize } from './Constants';

const { crypto } = window,
    subtle = crypto.subtle;

class Decrypt extends EventEmitter {
    constructor(buffer) {
        super();
        this.state = {};
        this.saltBuffer = Buffer.from(buffer).slice(0, saltLength);
        this.cipherText = Buffer.from(buffer).slice(saltLength);
        this.password = this.password.bind(this);
        this.decrypt = this.decrypt.bind(this);
        this.verify = this.verify.bind(this);
        this.unzip = this.unzip.bind(this);
        Object.freeze(this);
    }

    password(password) {
        const key = new Key(password, this.saltBuffer);
        return key.importMaster().then(this.verify);
    }

    verify(keys) {
        this.state.keys = keys;

        const { cipherText } = this,
            { verify } = this.state.keys;

        if (cipherText.byteLength % blockSize !== 0) {
            return Promise.reject('invalid ciphertext length');
        }
        if (cipherText.byteLength < 4 * blockSize) {
            return Promise.reject('invalid ciphertext length');
        }

        const index = cipherText.byteLength - hmacSize,
            cipherHmac = Buffer.from(cipherText).slice(index),
            cipherBody = Buffer.from(cipherText).slice(0, index);

        this.state.cipherBody = cipherBody;

        Object.freeze(this.state);

        return subtle
            .verify('HMAC', verify, cipherHmac, cipherBody)
            .then(this.decrypt);
    }

    decrypt(verified) {
        if (verified) {
            const { cipherBody } = this.state,
                { decrypt } = this.state.keys,
                iv = Buffer.from(cipherBody).slice(0, blockSize),
                data = Buffer.from(cipherBody).slice(blockSize);
            return subtle
                .decrypt(
                    {
                        name: 'AES-CBC',
                        iv: iv
                    },
                    decrypt,
                    data
                )
                .then(this.unzip);
        } else {
            return Promise.reject('authentication failed');
        }
    }

    unzip(zipped) {
        const promise = new Promise((resolve, reject) => {
            gunzip(Buffer.from(zipped), null, (err, unzipped) => {
                if (!err) {
                    try {
                        const textDecoder = new TextDecoder('utf-8'),
                            json = textDecoder.decode(unzipped);
                        resolve(JSON.parse(json));
                    } catch (err) {
                        reject(err);
                    }
                } else {
                    reject(err);
                }
            });
        });
        return promise;
    }
}

export default Decrypt;
