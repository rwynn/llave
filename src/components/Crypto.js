import React, { Component, PureComponent } from 'react';
import { Buffer } from 'buffer/';
import { gunzip, gzip } from 'zlib';
import Decrypt from '../webcrypto/Decrypt';
import Encrypt from '../webcrypto/Encrypt';

class Crypto extends PureComponent {
    state = {
        proof: ''
    };

    saltLength = 32;
    keySize = 32;
    hmacSize = 32;
    blockSize = 16;

    passphraseKey = Buffer.from('joe', 'utf-8').buffer;

    constructor(props) {
        super(props);
        this.import = this.import.bind(this);
        this.onFile = this.onFile.bind(this);
        this.onFileLoadError = this.onFileLoadError.bind(this);
        this.onFileLoad = this.onFileLoad.bind(this);
        this.onImport = this.onImport.bind(this);
        this.onDerive = this.onDerive.bind(this);
        this.onExport = this.onExport.bind(this);
    }

    onFileLoadError() {}

    onFileLoad(e) {
        const target = e.target,
            arrayBuf = target.result;

        if (arrayBuf.byteLength <= this.saltLength) {
            return this.onFileLoadError();
        }

        /*this.saltBuffer = Buffer.from(arrayBuf).slice(0, this.saltLength);
        this.cipherText = Buffer.from(arrayBuf).slice(this.saltLength);

        this.import();*/
        const d = new Decrypt(arrayBuf);
        d
            .password('joe')
            .then(function(result) {
                debugger;
                const e = new Encrypt(result);
                e
                    .password('joe')
                    .then(function(result) {
                        debugger;
                    })
                    .catch(function(err) {
                        debugger;
                    });
            })
            .catch(function(err) {
                debugger;
            });
    }

    onFile(e) {
        const input = e.target,
            files = input.files;
        if (files && files.length > 0) {
            const file = files[0],
                reader = new FileReader();
            reader.onerror = this.onFileLoadError;
            reader.onload = this.onFileLoad;
            reader.readAsArrayBuffer(file);
        }
    }

    import() {
        window.crypto.subtle
            .importKey(
                'raw',
                this.passphraseKey,
                {
                    name: 'PBKDF2'
                },
                false,
                ['deriveBits', 'deriveKey']
            )
            .then(this.onImport);
    }

    onImport(key) {
        return window.crypto.subtle
            .deriveKey(
                {
                    name: 'PBKDF2',
                    salt: this.saltBuffer,
                    iterations: 10000,
                    hash: 'SHA-256'
                },
                key,
                { name: 'AES-CBC', length: 256 },
                true,
                ['encrypt', 'decrypt']
            )
            .then(this.onDerive);
    }

    onDerive(webKey) {
        this.webKey = webKey;
        return crypto.subtle.exportKey('raw', webKey).then(this.onExport);
    }

    onExport(key) {
        if (key.byteLength !== this.keySize) {
            return;
        }
        this.verify(this.cipherText, key);
    }

    verify(cipherArray, key) {
        if (cipherArray.byteLength % this.blockSize !== 0) {
            return;
        }
        if (cipherArray.byteLength < 4 * this.blockSize) {
            return;
        }
        const index = cipherArray.byteLength - this.hmacSize,
            cipherHmac = Buffer.from(cipherArray).slice(index),
            cipherText = Buffer.from(cipherArray).slice(0, index);

        window.crypto.subtle
            .importKey(
                'raw',
                key,
                { name: 'HMAC', hash: { name: 'SHA-256' } },
                false,
                ['sign', 'verify']
            )
            .then(importedKey => {
                this.signKey = importedKey;
                crypto.subtle
                    .verify('HMAC', importedKey, cipherHmac, cipherText)
                    .then(ok => {
                        if (ok) {
                            this.decrypt(cipherText);
                        }
                    });
            });
    }

    decrypt(cipherText) {
        const iv = Buffer.from(cipherText).slice(0, this.blockSize),
            data = Buffer.from(cipherText).slice(this.blockSize);
        window.crypto.subtle
            .decrypt(
                {
                    name: 'AES-CBC',
                    length: 256,
                    iv: iv
                },
                this.webKey,
                data
            )
            .then(decrypted => {
                gunzip(Buffer.from(decrypted), null, (err, decompressed) => {
                    if (!err) {
                        const textDecoder = new TextDecoder('utf-8'),
                            json = textDecoder.decode(decompressed);
                        console.log(json);

                        // experiment
                        this.encrypt(iv, json);
                    } else {
                        console.error(err);
                    }
                });
            })
            .catch(function(err) {
                console.error(err);
            });
    }

    /*pad(text) {
        const size = text.byteLength;
        let padded = text;
        const padding = this.blockSize - (size % this.blockSize);
        for (let i=0; i<padding; ++i) {
            padded = Buffer.concat([Buffer.from(padded), Buffer.from([padding])]);
        }
        return padded;
    }*/

    encrypt(iv, plainText) {
        gzip(Buffer.from(plainText), null, (err, compressed) => {
            if (!err) {
                window.crypto.subtle
                    .encrypt(
                        {
                            name: 'AES-CBC',
                            length: 256,
                            iv: iv
                        },
                        this.webKey,
                        compressed
                    )
                    .then(encrypted => {
                        const data = Buffer.concat([
                            Buffer.from(iv),
                            Buffer.from(encrypted)
                        ]);
                        crypto.subtle
                            .sign('HMAC', this.signKey, data)
                            .then(signature => {
                                const cipherText = Buffer.concat([
                                    Buffer.from(data),
                                    Buffer.from(signature)
                                ]);
                                const final = Buffer.concat([
                                    Buffer.from(this.saltBuffer),
                                    Buffer.from(cipherText)
                                ]);
                            });
                    });
            } else {
                console.error(err);
            }
        });
    }

    render() {
        return (
            <div>
                <input type="file" onChange={this.onFile} />
            </div>
        );
    }
}

export default Crypto;
