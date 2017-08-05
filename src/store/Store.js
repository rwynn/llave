import EventEmitter from 'wolfy-eventemitter';

class Store extends EventEmitter {
    records = {};

    set(key, val) {
        this.records[key] = val;
        this.emit(`set.${key}`, val);
    }

    get(key, def) {
        const { records } = this;
        if (records.hasOwnProperty(key)) {
            return records[key];
        }
        return def;
    }
}

const S = new Store();

export default S;
