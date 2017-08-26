import React, { Component, PureComponent } from 'react';
import S from '../../store/Store';
import TextField from 'material-ui/TextField';
import RaisedButton from 'material-ui/RaisedButton';
import FontIcon from 'material-ui/FontIcon';
import Decrypt from '../../webcrypto/Decrypt';
const { ipcRenderer } = window.require('electron');
const unlockIcon = (
    <FontIcon style={{ fontSize: '18px' }} className="material-icons">
        lock_open
    </FontIcon>
);
class DatabaseForm extends PureComponent {
    state = {
        submitOk: false,
        pwError: '',
        file: null
    };

    dbLabelStyle = {
        fontSize: '16px',
        fontWeight: '500',
        marginRight: '16px'
    };

    constructor(props) {
        super(props);
        this.handleChange = this.handleChange.bind(this);
        this.handleRead = this.handleRead.bind(this);
        this.handleReadError = this.handleReadError.bind(this);
        this.handlePress = this.handlePress.bind(this);
        this.handlePass = this.handlePass.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.pwRef = this.pwRef.bind(this);
    }

    pwRef(text) {
        this.pwText = text;
    }

    empty_pass() {
        if (this.pwText) {
            this.pwText.input.value = '';
            this.pwText.focus();
        }
    }

    pass() {
        if (this.pwText) {
            return this.pwText.input.value;
        }
        return '';
    }

    handleSubmit() {
        const { history } = this.props,
            file = this.state.file,
            pw = this.pass();
        const decrypt = new Decrypt(file);
        decrypt
            .password(pw)
            .then(database => {
                this.state.file = null;
                S.set('database', database);
                history.push('/entries');
            })
            .catch(err => {
                this.empty_pass();
                this.setState({
                    pwError: err,
                    submitOk: false
                });
            });
    }

    handleChange(e) {
        const input = e.target,
            files = input.files;
        if (files && files.length > 0) {
            const file = files[0],
                reader = new FileReader();
            reader.onerror = this.handleReadError;
            reader.onload = this.handleRead;
            reader.readAsArrayBuffer(file);
        } else {
            this.setState({
                submitOk: false,
                file: null
            });
        }
    }

    handleReadError() {
        this.setState({
            submitOk: false,
            file: null
        });
        this.refs.database.value = '';
    }

    handleRead(e) {
        const target = e.target,
            arrayBuf = target.result;
        if (this.pwText) {
            this.pwText.focus();
        }
        this.setState({
            submitOk: !!this.pass(),
            file: arrayBuf
        });
    }

    handlePress(ev) {
        if (ev.key === 'Enter') {
            if (this.submitOk()) {
                this.handleSubmit();
                ev.preventDefault();
            }
        }
    }

    submitOk() {
        return this.pass() && this.state.file;
    }

    handlePass(e, newVal) {
        this.setState({
            submitOk: this.submitOk()
        });
    }

    render() {
        const label = 'Unlock Database',
            icon = unlockIcon,
            hint = this.state.pw ? '' : 'Enter your database key';
        return (
            <div>
                <label style={this.dbLabelStyle} htmlFor="dbfile">
                    Ironclad database file
                </label>
                <input
                    id="dbfile"
                    onChange={this.handleChange}
                    ref="database"
                    type="file"
                />
                <TextField
                    ref={this.pwRef}
                    errorText={this.state.pwError}
                    onKeyPress={this.handlePress}
                    onChange={this.handlePass}
                    autoComplete="off"
                    type="password"
                    fullWidth={true}
                    floatingLabelText="Database key"
                    hintText={hint}
                />
                <RaisedButton
                    disabled={!this.state.submitOk}
                    onTouchTap={this.handleSubmit}
                    style={{ marginTop: '30px' }}
                    label={label}
                    icon={icon}
                    primary={true}
                />
            </div>
        );
    }
}

export default DatabaseForm;
