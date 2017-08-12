import EventEmitter from 'events';

class Store extends EventEmitter {
    records = {};

    setLocal(key, val) {
        const { localStorage } = window;
        if (localStorage) {
            try {
                localStorage.setItem(key, JSON.stringify(val));
            } catch (e) {
                console.log(e);
            }
        }
    }

    getLocal(key) {
        const { localStorage } = window;
        if (localStorage) {
            try {
                const json = localStorage.getItem(key);
                if (json) {
                    return JSON.parse(json);
                }
            } catch (e) {
                console.log(e);
            }
        }
    }

    set(key, val, local) {
        this.records[key] = val;
        if (local) {
            this.setLocal(key, val);
        }
        this.send(key, val);
    }

    send(key, val) {
        this.emit(`set.${key}`, val);
    }

    get(key, def, local) {
        const { records } = this;
        if (records.hasOwnProperty(key)) {
            return records[key];
        }
        if (local) {
            const val = this.getLocal(key);
            if (val) {
                return val;
            }
        }
        return def;
    }
}

const S = new Store();

export default S;
