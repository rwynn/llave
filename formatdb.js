'use strict';

const sax = require('sax'),
    csv = require('csv'),
    electron = require('electron'),
    { app } = electron,
    userData = app.getPath('userData'),
    fs = require('fs'),
    path = require('path');

const convertedFilePath = path.join(userData, 'conversion.file');

const template = {
    title: '',
    url: '',
    username: '',
    passwords: [],
    email: '',
    tags: [],
    notes: ''
};

const formatKeePass_X_XML = function(input, resolve, reject) {
    const saxStream = sax.createStream(true),
        tags = [],
        entries = [];
    let entry = undefined,
        prop = undefined,
        inTag = false,
        inTitle = false;
    saxStream.on('error', function(err) {
        reject(err);
    });
    saxStream.on('text', function(text) {
        if (inTag && inTitle) {
            tags.push(text);
        } else if (entry !== undefined && prop !== undefined) {
            if (prop === 'password') {
                entry.passwords = [text];
            } else if (prop === 'comment') {
                entry.notes = text;
            } else {
                entry[prop] = text;
            }
        }
    });
    saxStream.on('opentag', function(node) {
        const name = node.name;
        if (inTag && name === 'title') {
            inTitle = true;
            return;
        }
        switch (name) {
            case 'group':
                inTag = true;
                break;
            case 'entry':
                inTag = false;
                entry = Object.assign({}, template);
                break;
            case 'title':
            case 'username':
            case 'url':
            case 'comment':
            case 'password':
                if (entry !== undefined) {
                    prop = name;
                }
                break;
        }
    });
    saxStream.on('closetag', function(name) {
        switch (name) {
            case 'group':
                inTag = false;
                tags.pop();
                break;
            case 'title':
                inTitle = false;
                break;
            case 'entry':
                if (tags.length > 0) {
                    entry.tags = [...tags];
                }
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

const formatKeePassXML = function(input, resolve, reject) {
    const saxStream = sax.createStream(true),
        tagParents = {},
        entries = [];
    let entry = undefined,
        prop = undefined,
        tagParent = undefined,
        inTag = false;
    saxStream.on('error', function(err) {
        reject(err);
    });
    saxStream.on('text', function(text) {
        if (inTag) {
            entry.tags = [text];
            if (tagParent) {
                tagParents[text] = tagParent;
            }
        } else if (entry !== undefined && prop !== undefined) {
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
            case 'group':
                inTag = true;
                tagParent = node.attributes.tree;
                break;
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
            case 'group':
                inTag = false;
                tagParent = undefined;
                break;
            case 'pwentry':
                entries.push(entry);
                entry = undefined;
                break;
        }
        prop = undefined;
    });
    saxStream.on('end', function() {
        try {
            const es = entries.map(function(e) {
                if (e.tags && e.tags.length === 1) {
                    let tag = e.tags[0];
                    while (tagParents[tag]) {
                        tag = tagParents[tag];
                        e.tags.push(tag);
                    }
                }
                return e;
            });
            const json = JSON.stringify(es);
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

const formatGenericCSV = function(path, input, resolve, reject, mappings) {
    const parser = csv.parse({
        auto_parse: true,
        escape: '\\',
        skip_empty_lines: true
    });
    const rows = [];
    const mapEntry = row => {
        const entry = Object.assign({}, template);
        Object.keys(mappings).forEach(prop => {
            const mapped = mappings[prop];
            if (typeof mapped === 'number' && mapped >= 0) {
                const val = row[mapped];
                if (prop === 'password') {
                    entry.passwords = [val];
                } else {
                    entry[prop] = val;
                }
            }
        });
        return entry;
    };
    parser.on('error', function(err) {
        reject(err);
    });
    parser.on('readable', function() {
        let record;
        while ((record = parser.read())) {
            rows.push(record);
        }
    });
    parser.on('finish', function() {
        if (rows.length > 0) {
            if (mappings) {
                try {
                    const entries = rows.slice(1).map(mapEntry),
                        json = JSON.stringify(entries);
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
            } else {
                resolve({
                    path: path,
                    rows: rows[0]
                });
            }
        } else {
            reject(new Error('Invalid CSV file'));
        }
    });
    input.pipe(parser);
};

const formatDatabase = function(path, db, format, mappings) {
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
            case 'KeePassX':
                switch (format) {
                    case 'XML':
                        formatKeePass_X_XML(input, resolve, reject);
                        break;
                    default:
                        reject(new Error('Invalid import format'));
                }
                break;
            case 'Generic':
                switch (format) {
                    case 'CSV':
                        formatGenericCSV(
                            path,
                            input,
                            resolve,
                            reject,
                            mappings
                        );
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
