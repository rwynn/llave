'use strict';

const { app, ipcMain, clipboard, dialog } = require('electron'),
    toml = require('toml'),
    Readable = require('stream').Readable,
    lunr = require('lunr'),
    storage = require('electron-storage'),
    yaStorage = require('ya-storage'),
    Joi = require('joi'),
    path = require('path'),
    fs = require('fs'),
    formatdb = require('./formatdb'),
    { execFile } = require('child_process');

const ironcladPlatformBinary = {
    win32: 'win/ironclad.exe',
    win64: 'win/ironclad.exe',
    darwin: 'darwin/ironclad',
    linux: 'linux/ironclad'
};

const ironcladBinary = path.join(
    __dirname.replace('app.asar', 'app.asar.unpacked'),
    'go',
    'ironclad',
    ironcladPlatformBinary[process.platform]
);

let masterKey, clipTimeout, index, cachedSettings;

const settingsSchema = Joi.object().keys({
    passwords: Joi.object().keys({
        len: Joi.number()
            .integer()
            .min(8)
            .max(100),
        flags: Joi.string().regex(/^[dlsu]{0,4}$/)
    }),
    clipboard: Joi.object().keys({
        autoClear: Joi.boolean(),
        timeout: Joi.number()
            .integer()
            .min(1)
    }),
    autoLock: Joi.object().keys({
        enabled: Joi.boolean(),
        timeout: Joi.number()
            .integer()
            .min(1)
    }),
    theme: Joi.object().keys({
        dark: Joi.boolean()
    })
});

const storagePath = 'llave/Settings.json';
storage.set = storage.set.bind(this, storagePath);
storage.get = storage.get.bind(this, storagePath);

lunr.tokenizer.separator = /[\@\.\s\-\:\\\/\?\#]+/;

const indexDocs = function() {
    const data = this;
    index = lunr(function() {
        // setup pipelines
        this.pipeline = new lunr.Pipeline();
        this.pipeline.add(lunr.stopWordFilter);
        this.searchPipeline = new lunr.Pipeline();
        this.ref('id');
        this.field('title');
        this.field('tags');
        this.field('url');
        this.field('username');
        this.field('email');
        this.field('notes');
        data.map(d => {
            const indexed = Object.assign({}, d);
            indexed.active = null;
            indexed.passwords = null;
            return indexed;
        }).forEach(this.add, this);
    });
};

const queryBuilder = function(terms, query) {
    const termParts = terms.toLowerCase().split(' ');
    termParts
        .filter(term => !!term)
        .forEach(term => {
            const wildcard =
                term.length > 1
                    ? lunr.Query.wildcard.LEADING | lunr.Query.wildcard.TRAILING
                    : lunr.Query.wildcard.TRAILING;
            query.clause({
                term: term,
                boost: 1,
                usePipeline: false,
                wildcard: wildcard
            });
            query.clause({
                term: term,
                boost: 5,
                usePipeline: false
            });
            query.clause({
                fields: ['title'],
                term: term,
                boost: 10,
                usePipeline: false
            });
        });
    return query;
};

const searchDocs = function(terms) {
    return index ? index.query(queryBuilder.bind(this, terms)) : [];
};

const reviver = function(key, value) {
    const mem = '',
        ast = '*';
    if (key === 'passwords') {
        return value.map(v => {
            return v.split('').reduce(ac => ac + ast, mem);
        });
    } else if (key === 'username') {
        return value.split('').reduce(ac => ac + ast, mem);
    }
    return value;
};

const textResponse = ['--version', 'config', 'user', 'pass', 'gen', 'list'];
const jsonResponse = ['dump', 'export'];
const maskSensitive = ['dump'];

const sendsText = function({ cmd }) {
    return textResponse.indexOf(cmd) !== -1;
};

const sendsJson = function({ cmd }) {
    return jsonResponse.indexOf(cmd) !== -1;
};

const useReviver = function({ cmd }) {
    return maskSensitive.indexOf(cmd) !== -1;
};

const doClipboardTimeout = function(lookup) {
    let timeout = 10,
        autoClear = true;
    if (cachedSettings && cachedSettings.clipboard) {
        const cbs = cachedSettings.clipboard;
        if (cbs.timeout !== undefined) {
            timeout = cbs.timeout;
        }
        if (cbs.autoClear !== undefined) {
            autoClear = cbs.autoClear;
        }
    } else if (lookup) {
        return storage.get((err, data) => {
            if (!err && data) {
                cachedSettings = data;
            }
            doClipboardTimeout(false);
        });
    }
    if (autoClear) {
        clipTimeout = setTimeout(function() {
            clipboard.clear();
            clipTimeout = null;
        }, timeout * 1000);
    }
};

const doClipboard = function(data) {
    if (clipTimeout) {
        clearTimeout(clipTimeout);
    }
    clipboard.writeText(data);
    doClipboardTimeout(true);
};

const run = function(args, options, cb) {
    const opts = options || {};
    const state = {
            cmd: args[0],
            args: args,
            data: '',
            err: '',
            code: 0,
            clipboard: !!opts.clipboard,
            authenticated: false,
            cancelled: false,
            raw: opts.raw
        },
        input = opts.input,
        inputStream = new Readable(),
        ironclad = execFile(ironcladBinary, args);
    let inputDone = false;
    if (opts.hasOwnProperty('pw')) {
        masterKey = opts['pw'] || '';
    }
    ironclad.on('error', function(err) {
        if (err.code && err.code === 'ENOENT') {
            dialog.showErrorBox(
                'Exec Error',
                `Unable to run ironclad.  Is it installed at ${ironcladBinary}?`
            );
            state.cancelled = true;
            app.exit(1);
        } else {
            dialog.showErrorBox(
                'Exec Error',
                'An error occurred while running the ironclad command'
            );
        }
    });
    ironclad.stdout.on('data', function(data) {
        if (sendsJson(state)) {
            if (state.data === '') {
                var c = ('' + data).trim().charAt(0);
                if (c !== '{' && c != '[') {
                    return;
                }
            }
        }
        state.data += data;
    });
    ironclad.stderr.on('data', function(data) {
        let authenticated = false;
        if (!inputDone) {
            inputDone = true;
            var prompt = ('' + data).trim();
            if (
                prompt.indexOf('Password:') === 0 ||
                prompt.indexOf('Master Password:') === 0
            ) {
                inputStream.push(`${masterKey}\n`);
                authenticated = state.authenticated = true;
            }
            if (input) {
                input.forEach(function(i) {
                    inputStream.push(`${i}\n`);
                });
            }
            inputStream.push(null);
            inputStream.pipe(ironclad.stdin);
        }
        if (!authenticated) {
            state.err += data;
        }
    });
    ironclad.on('close', function(code) {
        var data = state.data;
        state.code = code;
        if (state.raw !== true) {
            if (code === 0) {
                if (state.cmd === 'config') {
                    state.data = toml.parse(data);
                } else if (sendsText(state)) {
                    if (state.authenticated) {
                        data = state.data = data
                            .substring(masterKey.length)
                            .trim();
                    }
                    if (state.clipboard) {
                        doClipboard(data);
                    }
                } else if (sendsJson(state)) {
                    try {
                        const revive = useReviver(state) ? reviver : null;
                        state.data = JSON.parse(data, revive);
                        if (state.cmd === 'dump' && code === 0) {
                            setImmediate(indexDocs.bind(state.data.entries));
                        }
                    } catch (e) {
                        state.code = 1;
                        state.err = e;
                    }
                }
            }
        }
        if (state.cancelled === false) {
            cb(state);
        }
    });
};

ipcMain.on('ironclad', function(event, arg, options) {
    run(arg, options, function(state) {
        event.sender.send('ironclad-reply', state);
    });
});

ipcMain.on('search', function(event, query) {
    setImmediate(function() {
        const results = searchDocs(query);
        setImmediate(function() {
            event.sender.send('search-reply', results);
        });
    });
});

ipcMain.on('clipboard', function(event, data) {
    setImmediate(function() {
        doClipboard(data);
        setImmediate(function() {
            event.sender.send('clipboard-reply', true);
        });
    });
});

ipcMain.on('lock', function(event, data) {
    masterKey = null;
});

ipcMain.on('export', function(event) {
    const onStore = function(err) {
        const reply = {
            code: err ? 1 : 0,
            err: err,
            data: ''
        };
        event.sender.send('export-reply', reply);
    };
    const onExport = function(fileName, state) {
        if (state.code === 0) {
            yaStorage.set(fileName, state.data, onStore);
        } else {
            event.sender.send('export-reply', state);
        }
    };
    const onEmpty = function() {
        setImmediate(function() {
            event.sender.send('export-reply', {
                code: 1,
                data: '',
                err: 'No file chosen to export'
            });
        });
    };
    dialog
        .showSaveDialog()
        .then(result => {
            if (result.canceled) {
                onEmpty();
                return;
            }
            const fileName = result.filePath;
            const cb = onExport.bind(this, fileName),
                args = ['export'];
            run(args, null, cb);
        })
        .catch(err => {
            event.sender.send('export-reply', {
                code: 1,
                data: '',
                err: err.message
            });
        });
});

ipcMain.on('import', function(event, options) {
    const opts = options || {
        db: 'Ironclad',
        format: 'JSON'
    };
    const { db, format, path, mappings } = opts;
    if (path) {
        formatdb(path, db, format, mappings)
            .then(formatted => {
                const args = ['import', formatted];
                run(args, null, state => {
                    event.sender.send('import-reply', state);
                    fs.unlink(formatted, err => {
                        if (err) {
                            dialog.showErrorBox(
                                'Import Error',
                                `Unable to remove sensitive temp file from ${formatted}: ${err}`
                            );
                        }
                    });
                });
            })
            .catch(err => {
                event.sender.send('import-reply', {
                    code: 1,
                    data: '',
                    err: err.message
                });
            });
    } else {
        dialog
            .showOpenDialog({
                properties: ['openFile']
            })
            .then(result => {
                if (result.canceled) {
                    return;
                }
                const files = result.filePaths;
                const fileName = files[0];
                if (db === 'Ironclad') {
                    const args = ['import', fileName];
                    run(args, null, state => {
                        event.sender.send('import-reply', state);
                    });
                } else {
                    formatdb(fileName, db, format, mappings)
                        .then(formatted => {
                            if (opts.db === 'Generic') {
                                event.sender.send('import-reply', {
                                    code: 0,
                                    data: formatted,
                                    err: ''
                                });
                            } else {
                                const args = ['import', formatted];
                                run(args, null, state => {
                                    event.sender.send('import-reply', state);
                                    fs.unlink(formatted, err => {
                                        if (err) {
                                            dialog.showErrorBox(
                                                'Import Error',
                                                `Unable to remove sensitive temp file from ${formatted}: ${err}`
                                            );
                                        }
                                    });
                                });
                            }
                        })
                        .catch(err => {
                            event.sender.send('import-reply', {
                                code: 1,
                                data: '',
                                err: err.message
                            });
                        });
                }
            })
            .catch(err => {
                event.sender.send('import-reply', {
                    code: 1,
                    data: '',
                    err: err.message
                });
            });
    }
});

ipcMain.on('store-set', function(event, data) {
    const resp = { code: 0, data: data, err: '' };
    Joi.validate(data, settingsSchema, err => {
        if (err) {
            Object.assign(resp, {
                err: 'Unable to save invalid settings',
                code: 1
            });
            setImmediate(function() {
                event.sender.send('store-set-reply', resp);
            });
        } else {
            storage.set(data, err => {
                Object.assign(resp, {
                    err: err,
                    code: err ? 1 : 0
                });
                setImmediate(function() {
                    event.sender.send('store-set-reply', resp);
                });
                if (!err) {
                    cachedSettings = data;
                }
            });
        }
    });
});

ipcMain.on('store-get', function(event) {
    storage.get((err, data) => {
        const resp = {
            code: err ? 1 : 0,
            data: data,
            err: err
        };
        setImmediate(function() {
            event.sender.send('store-get-reply', resp);
        });
        if (!err) {
            cachedSettings = data;
        }
    });
});

ipcMain.on('restore-entry', function(event, id) {
    const replyName = 'restore-entry-reply',
        resp = {};
    run(['dump'], { raw: true }, function(state) {
        resp.code = state.code;
        resp.err = state.err;
        if (resp.code === 0) {
            try {
                const dump = JSON.parse(state.data),
                    entry = dump.entries.find(e => e.id === id);
                if (entry) {
                    // found matching entry
                    // restore it with an add command
                    let pw = '',
                        pws = entry.passwords,
                        pwCount = pws.length;
                    if (pwCount > 0) {
                        pw = pws[pwCount - 1];
                    }
                    const notes = entry.notes ? ['y', entry.notes] : ['n'];
                    const input = [
                        entry.title,
                        entry.url,
                        entry.username,
                        entry.email,
                        pw,
                        entry.tags.join(',')
                    ].concat(notes);
                    run(
                        ['add', '--no-editor'],
                        {
                            input: input
                        },
                        function(state) {
                            resp.code = state.code;
                            resp.err = state.err;
                            event.sender.send(replyName, resp);
                        }
                    );
                } else {
                    resp.code = 1;
                    resp.err = 'Entry not found';
                    event.sender.send(replyName, resp);
                }
            } catch (e) {
                resp.code = 1;
                resp.err = e;
                event.sender.send(replyName, resp);
            }
        } else {
            event.sender.send(replyName, resp);
        }
    });
});
