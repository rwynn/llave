import React, { Component, PureComponent } from 'react';
import muiThemeable from 'material-ui/styles/muiThemeable';
import S from '../store/Store';
import { Add } from './Add';

const { ipcRenderer } = window.require('electron');

class Edit extends Add {
    title = 'Edit';

    constructor(props) {
        super(props);
        const entries = S.get('entries', []),
            { match } = this.props,
            { id } = match.params;
        entries.find(function(e) {
            if (e.id == id) {
                this.saved = e;
                this.orig = Object.assign({}, e);
                this.orig.tags = e.tags.slice();
                this.entry = Object.assign({}, e);
                this.entry.tags = e.tags.slice();
                const { tags } = e;
                this.state.isFavorite = tags.indexOf('favorite') !== -1;
                const { passwords } = e,
                    len = passwords.length;
                if (len > 0) {
                    const current = passwords[len - 1];
                    this.orig.password = this.entry.password = current;
                }
            }
        }, this);
        this.onPayload = this.onPayload.bind(this);
    }

    onPayload(ev, payload) {
        const { username, password } = this.refs,
            cmd = payload.cmd,
            code = payload.code;
        if (code === 0) {
            if (cmd === 'user') {
                username.input.value = payload.data;
                username.setState({ hasValue: !!payload.data });
            } else if (cmd === 'pass') {
                password.input.value = payload.data;
                password.setState({ hasValue: !!payload.data });
            } else if (cmd === 'gen') {
                this.onGen(ev, payload);
            }
        }
    }

    componentDidMount() {
        const { title, url, email, notes } = this.refs,
            { match } = this.props,
            { id } = match.params,
            { entry } = this;
        title.input.focus();
        title.input.value = entry.title;
        title.setState({ hasValue: !!entry.title });
        url.input.value = entry.url;
        url.setState({ hasValue: !!entry.url });
        email.input.value = entry.email;
        email.setState({ hasValue: !!entry.email });
        notes.input.refs.input.value = entry.notes;
        notes.setState({ hasValue: !!entry.notes });
        ipcRenderer.on('ironclad-reply', this.onPayload);
        ipcRenderer.send('ironclad', ['user', '-p', id]);
        ipcRenderer.send('ironclad', ['pass', '-p', id]);
    }

    componentWillUnmount() {
        ipcRenderer.removeListener('ironclad-reply', this.onPayload);
    }

    getInput() {
        const { entry } = this,
            { orig } = this,
            { title, url, username, password, email, tags, notes } = entry;

        let fields = [],
            changed = false;

        if (title !== orig.title) {
            fields.push('y');
            fields.push(title);
            changed = true;
        } else {
            fields.push('n');
        }

        if (url !== orig.url) {
            fields.push('y');
            fields.push(url);
            changed = true;
        } else {
            fields.push('n');
        }

        if (username !== orig.username) {
            fields.push('y');
            fields.push(username);
            changed = true;
        } else {
            fields.push('n');
        }

        if (password !== orig.password) {
            fields.push('y');
            fields.push(password);
            changed = true;
        } else {
            fields.push('n');
        }

        if (email !== orig.email) {
            fields.push('y');
            fields.push(email);
            changed = true;
        } else {
            fields.push('n');
        }

        if (tags.join(',') !== orig.tags.join(',')) {
            fields.push('y');
            fields.push(tags.join(','));
            changed = true;
        } else {
            fields.push('n');
        }

        if (notes !== orig.notes) {
            fields.push('y');
            fields.push(notes);
            changed = true;
        } else {
            fields.push('n');
        }

        return changed ? fields : false;
    }

    mask(val) {
        return val.split('').reduce(ac => ac + '*', '');
    }

    appendNewPassword() {
        const { passwords, password } = this.entry,
            masked = this.mask(password),
            len = passwords.length;
        if (len > 0) {
            if (passwords[len - 1] !== password) {
                passwords.push(masked);
            }
        } else {
            passwords.push(masked);
        }
    }

    handleSave() {
        const { history, match } = this.props,
            { from, id } = match.params,
            next = from === 'details' ? `/details/${id}` : '/entries';
        if (this.submitOk()) {
            const input = this.getInput();
            if (input) {
                ipcRenderer.send('ironclad', ['edit', '--no-editor', id], {
                    input: input
                });
                ipcRenderer.once('ironclad-reply', (e, payload) => {
                    const cmd = payload.cmd,
                        code = payload.code;
                    if (cmd === 'edit') {
                        if (code === 0) {
                            this.appendNewPassword();
                            Object.assign(this.saved, this.entry);
                            history.push(next);
                            const { title } = this.entry,
                                msg =
                                    code === 0
                                        ? `${title} has been updated`
                                        : 'Failed to update entry';
                            S.set('snack.message', msg);
                        }
                    }
                });
            } else {
                history.push(next);
            }
        } else {
            const invalid = this.firstInvalid(),
                { input } = invalid;
            input.focus();
            window.scrollTo(0, 0);
            this.setState({
                showErrors: true
            });
        }
    }
}

export default muiThemeable()(Edit);
