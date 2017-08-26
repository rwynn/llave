import { Buffer } from 'buffer/';
import EventEmitter from 'events';
import Key from './Key';
import { gzip } from 'zlib';
import { saltLength, blockSize } from './Constants';

const { crypto } = window,
    subtle = crypto.subtle;

class Encrypt extends EventEmitter {
    constructor(database) {
        super();
        this.state = {};
        this.database = database;
        this.iv = new Buffer(blockSize);
        crypto.getRandomValues(this.iv);
        this.saltBuffer = new Buffer(saltLength);
        crypto.getRandomValues(this.saltBuffer);
        this.zip = this.zip.bind(this);
        this.encrypt = this.encrypt.bind(this);
        this.sign = this.sign.bind(this);
        this.finalize = this.finalize.bind(this);
        Object.freeze(this);
    }

    password(password) {
        const key = new Key(password, this.saltBuffer);
        return key.importMaster().then(this.zip);
    }

    zip(keys) {
        this.state.keys = keys;
        Object.freeze(this.state);
        const promise = new Promise((resolve, reject) => {
            let json;
            try {
                const json = JSON.stringify(this.database);
                gzip(Buffer.from(json), null, (err, zipped) => {
                    if (!err) {
                        resolve(this.encrypt(zipped));
                    } else {
                        reject(err);
                    }
                });
            } catch (err) {
                reject(err);
            }
        });
        return promise;
    }

    encrypt(zipped) {
        const { encrypt } = this.state.keys;
        return subtle
            .encrypt(
                {
                    name: 'AES-CBC',
                    iv: this.iv
                },
                encrypt,
                zipped
            )
            .then(this.sign);
    }

    sign(encrypted) {
        const { sign } = this.state.keys;
        this.body = Buffer.concat([
            Buffer.from(this.iv),
            Buffer.from(encrypted)
        ]);
        return subtle.sign('HMAC', sign, this.body).then(this.finalize);
    }

    finalize(signature) {
        const final = Buffer.concat([
            Buffer.from(this.saltBuffer),
            Buffer.from(this.body),
            Buffer.from(signature)
        ]);
        return Promise.resolve(final);
    }
}

export default Encrypt;
