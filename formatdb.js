'use strict';

const sax = require('sax'),
    csv = require('csv'),
    electron = require('electron'),
    { app } = electron,
    userData = app.getPath('userData'),
    fs = require('fs'),
    path = require('path');

const convertedFilePath = path.join(userData, 'llave/conversion.file');

const formatKeePassXML = function(input, resolve, reject) {
    const saxStream = sax.createStream(true),
        entries = [];
    let entry = undefined,
        prop = undefined;
    const template = {
        title: '',
        url: '',
        username: '',
        passwords: [],
        email: '',
        tags: [],
        notes: ''
    };
    saxStream.on('error', function(err) {
        reject(err);
    });
    saxStream.on('text', function(text) {
        if (entry !== undefined && prop !== undefined) {
            if (prop === 'password') {
                entry.passwords = [text];
            } else {
                entry[prop] = text;
            }
        }
    });
    saxStream.on('opentag', function(node) {
        const name = node.name;
        switch (name) {
            case 'pwentry':
                entry = Object.assign({}, template);
                break;
            case 'title':
            case 'username':
            case 'url':
            case 'notes':
            case 'password':
                if (entry !== undefined) {
                    prop = name;
                }
                break;
        }
    });
    saxStream.on('closetag', function(name) {
        switch (name) {
            case 'pwentry':
                entries.push(entry);
                entry = undefined;
                break;
        }
        prop = undefined;
    });
    saxStream.on('end', function() {
        try {
            const json = JSON.stringify(entries);
            fs.writeFile(convertedFilePath, json, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(convertedFilePath);
                }
            });
        } catch (err) {
            reject(err);
        }
    });
    input.pipe(saxStream);
};

const formatKeePassCSV = function(input, resolve, reject) {
    const parser = csv.parse({
        columns: first => ['title', 'username', 'password', 'url', 'notes'],
        delimiter: ',',
        escape: '\\',
        skip_empty_lines: true
    });
    const entries = [];
    const template = {
        title: '',
        url: '',
        username: '',
        passwords: [],
        email: '',
        tags: [],
        notes: ''
    };
    parser.on('error', function(err) {
        reject(err);
    });
    parser.on('readable', function() {
        let record;
        while ((record = parser.read())) {
            let entry = Object.assign({}, template, record);
            entry.passwords = [entry.password];
            delete entry.password;
            entries.push(entry);
        }
    });
    parser.on('finish', function() {
        try {
            const json = JSON.stringify(entries);
            fs.writeFile(convertedFilePath, json, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(convertedFilePath);
                }
            });
        } catch (err) {
            reject(err);
        }
    });
    input.pipe(parser);
};

const formatDatabase = function(path, db, format) {
    const promise = new Promise((resolve, reject) => {
        const input = fs.createReadStream(path);
        input.on('error', function(err) {
            reject(err);
        });
        switch (db) {
            case 'KeePass':
                switch (format) {
                    case 'XML':
                        formatKeePassXML(input, resolve, reject);
                        break;
                    case 'CSV':
                        formatKeePassCSV(input, resolve, reject);
                        break;
                    default:
                        reject(new Error('Invalid import format'));
                }
                break;
            default:
                reject(new Error('Invalid import database'));
        }
    });
    return promise;
};

module.exports = formatDatabase;
