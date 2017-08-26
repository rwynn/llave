import EventEmitter from 'events';
import S from '../../store/Store.js';
import clipboard from 'clipboard-js';

class IPCRenderer extends EventEmitter {
    constructor() {
        super();
        this.onDatabase = this.onDatabase.bind(this);
        this.mapEntry = this.mapEntry.bind(this);
        this.mapSearch = this.mapSearch.bind(this);
        this.onWorkerMessage = this.onWorkerMessage.bind(this);
        this.searchWorker = new Worker('worker.web.js');
        this.searchWorker.addEventListener('message', this.onWorkerMessage);
        S.on('set.database', this.onDatabase);
    }

    mask(text) {
        const mem = '',
            ast = '*';
        return text.split('').reduce(ac => ac + ast, mem);
    }

    mapEntry(e) {
        const m = Object.assign({}, e),
            { passwords, username } = m;
        if (passwords) {
            m.passwords = passwords.map(this.mask);
        }
        if (username) {
            m.username = this.mask(username);
        }
        return m;
    }

    mapSearch(e) {
        const m = Object.assign({}, e);
        m.passwords = null;
        return m;
    }

    onDatabase(database) {
        const { searchWorker } = this;
        let e = [],
            docs = [];
        if (database) {
            const { entries } = database;
            if (entries) {
                docs = entries;
                e = entries.map(this.mapEntry);
            }
        }
        S.set('entries', e);
        searchWorker.postMessage({
            cmd: 'index',
            docs: docs.map(this.mapSearch)
        });
    }

    send(cmd, params, options) {
        if (cmd === 'ironclad') {
            if (params && params.length > 0) {
                this.ironclad(params, options);
            }
        } else if (cmd === 'lock') {
            this.lock();
        } else if (cmd === 'clipboard') {
            this.clip(params);
        } else if (cmd === 'search') {
            this.search(params);
        } else if (cmd === 'store-set') {
            this.storeSet(params);
        } else if (cmd === 'store-get') {
            this.storeGet();
        }
    }

    emitAsync(...args) {
        setTimeout(() => {
            this.emit.apply(this, args);
        });
    }

    onWorkerMessage(e) {
        try {
            const json = e.data,
                message = JSON.parse(json);
            const { cmd, results } = message;
            if (cmd === 'query') {
                this.emitAsync('search-reply', {}, results || []);
            }
        } catch (err) {
            console.error(err);
        }
    }

    search(query) {
        const { searchWorker } = this;
        searchWorker.postMessage({
            cmd: 'query',
            terms: query
        });
    }

    storeGet() {
        const reply = 'store-get-reply';
        const resp = { code: 0, data: {}, err: '' };
        const json = S.get('settings.web', '{}', true);
        try {
            resp.data = JSON.parse(json);
        } catch (err) {
            resp.code = 1;
            resp.err = err;
        }
        this.emitAsync(reply, {}, resp);
    }

    storeSet(settings) {
        const reply = 'store-set-reply';
        const data = Object.assign({}, settings);
        delete data.passwords;
        const resp = { code: 0, data: data, err: '' };
        try {
            S.set('settings.web', JSON.stringify(data), true);
        } catch (err) {
            resp.code = 1;
            resp.err = err;
        }
        this.emitAsync(reply, {}, resp);
    }

    openClearClipDialog() {
        setTimeout(() => {
            S.send('dialog', {
                title: 'Clear Clipboard',
                message:
                    'Click "Clear" below to clear the clipboard. Click "Keep" do nothing.',
                leftLabel: 'Clear',
                rightLabel: 'Keep',
                onRightLabel: null,
                onLeftLabel: clipboard.copy.bind(clipboard, '')
            });
        }, 1000);
    }

    clip(text) {
        const reply = 'clipboard-reply';
        if (text) {
            clipboard
                .copy(text)
                .then(() => {
                    this.emitAsync(reply, {}, true);
                    this.openClearClipDialog();
                })
                .catch(() => {
                    this.emitAsync(reply, {}, false);
                });
        } else {
            this.emitAsync(reply, {}, false);
        }
    }

    lock() {
        const { searchWorker } = this;
        S.set('database', null);
        clipboard.copy('');
        searchWorker.postMessage({
            cmd: 'index',
            docs: []
        });
    }

    entryProp(reply, command, args, opts, accessor) {
        const id = this.firstNum(args),
            entry = this.findEntry(id);
        if (entry) {
            const data = accessor.call(this, entry);
            if (data) {
                if (opts.clipboard) {
                    clipboard
                        .copy(data)
                        .then(() => {
                            this.emitAsync(
                                reply,
                                {},
                                {
                                    code: 0,
                                    cmd: command,
                                    data: data,
                                    err: ''
                                }
                            );
                            this.openClearClipDialog();
                        })
                        .catch(err => {
                            this.emitAsync(
                                reply,
                                {},
                                {
                                    code: 1,
                                    cmd: command,
                                    data: '',
                                    err: err
                                }
                            );
                        });
                } else {
                    this.emitAsync(
                        reply,
                        {},
                        {
                            code: 0,
                            cmd: command,
                            data: data,
                            err: ''
                        }
                    );
                }
            } else {
                this.emitAsync(
                    reply,
                    {},
                    {
                        code: 1,
                        cmd: command,
                        data: '',
                        err: 'Data not found'
                    }
                );
            }
        } else {
            this.emitAsync(
                reply,
                {},
                {
                    code: 1,
                    cmd: command,
                    data: '',
                    err: 'Data not found'
                }
            );
        }
    }

    dump(reply, command) {
        const entries = S.get('entries', []);
        const db = {
            entries: entries
        };
        this.emitAsync(
            reply,
            {},
            {
                code: 0,
                cmd: command,
                data: db
            }
        );
    }

    ironclad(params, options) {
        const reply = 'ironclad-reply',
            opts = options || {};
        const [command, ...rest] = params;
        if (command === 'dump') {
            this.dump(reply, command);
        } else if (command === 'pass') {
            this.entryProp(reply, command, rest, opts, entry => {
                const { passwords } = entry;
                if (passwords) {
                    const len = passwords.length,
                        data = entry.passwords[len - 1];
                    return data;
                }
            });
        } else if (command === 'user') {
            this.entryProp(reply, command, rest, opts, entry => {
                const { username } = entry;
                return username;
            });
        } else if (command === 'gen') {
            this.gen(reply, command);
        }
    }

    gen(reply, command) {
        this.emitAsync(
            reply,
            {},
            {
                code: 0,
                cmd: command,
                data: '',
                err: ''
            }
        );
    }

    findEntry(id) {
        const database = S.get('database', {}),
            { entries } = database;
        if (entries) {
            return entries.find(e => e.id === id);
        }
    }

    firstNum(args) {
        if (args) {
            return args.find(a => {
                return typeof a === 'number';
            });
        }
    }
}

class FakeElectron {
    constructor() {
        this.ipcRenderer = new IPCRenderer();
        this.remote = {};
    }
}

class WebShim {
    constructor() {
        this.electron = new FakeElectron();
        this.require = this.require.bind(this);
    }
    require(name) {
        if (name === 'electron') {
            return this.electron;
        }
    }
}

const webShim = new WebShim();
window.require = webShim.require;

export default webShim;
