import React, { Component, PureComponent } from 'react';
import S from '../store/Store';
import SelectField from 'material-ui/SelectField';
import TextField from 'material-ui/TextField';
import RaisedButton from 'material-ui/RaisedButton';
import MenuItem from 'material-ui/MenuItem';
import FontIcon from 'material-ui/FontIcon';
const { ipcRenderer } = window.require('electron');
const { remote } = window.require('electron');
const { dialog } = remote;
const unlockIcon = (
    <FontIcon style={{ fontSize: '18px' }} className="material-icons">
        lock_open
    </FontIcon>
);
const addIcon = (
    <FontIcon style={{ fontSize: '18px' }} className="material-icons">
        add
    </FontIcon>
);

class DatabaseForm extends PureComponent {
    state = {
        action: 'init',
        config: {},
        submitOk: false,
        pwError: '',
        file: ''
    };

    onConfig(config) {
        this.setState({
            config: config,
            file: config.file || '',
            action: config.file ? 'open' : 'init'
        });
        if (config.file) {
            this.empty_pass();
        }
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

    constructor(props) {
        super(props);
        this.handleChange = this.handleChange.bind(this);
        this.handlePress = this.handlePress.bind(this);
        this.handlePass = this.handlePass.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.pwRef = this.pwRef.bind(this);
        this.onConfig = this.onConfig.bind(this);
        this.state.config = S.get('config', this.state.config);
        this.state.file = this.state.config.file || '';
        S.on('set.config', this.onConfig);
    }

    componentDidMount() {
        ipcRenderer.send('ironclad', ['config']);
    }

    componentWillUnmount() {
        S.removeListener('set.config', this.onConfig);
    }

    initdb() {
        var fileName = this.state.file,
            { history } = this.props,
            pw = this.pass();
        ipcRenderer.send('ironclad', ['init', fileName], { pw: pw });
        ipcRenderer.once('ironclad-reply', (e, payload) => {
            const cmd = payload.cmd,
                code = payload.code;
            if (cmd === 'init' && code === 0) {
                history.push('/entries');
            }
        });
    }

    opendb() {
        const { history } = this.props,
            fileName = this.state.file,
            pw = this.pass();
        ipcRenderer.send('ironclad', ['config', 'file', fileName], { pw: pw });
        ipcRenderer.once('ironclad-reply', (e, payload) => {
            const cmd = payload.cmd,
                code = payload.code;
            if (cmd === 'config' && code === 0) {
                ipcRenderer.send('ironclad', ['list'], { pw: pw });
                ipcRenderer.once('ironclad-reply', (e, payload) => {
                    const cmd = payload.cmd,
                        code = payload.code;
                    if (cmd === 'list') {
                        if (code === 0) {
                            history.push('/entries');
                        } else {
                            this.empty_pass();
                            this.setState({
                                pwError: payload.err,
                                submitOk: false
                            });
                        }
                    }
                });
            }
        });
    }

    handleChange(e, i, val) {
        const { config } = this.state;
        if (val === false) {
            dialog.showSaveDialog(
                function(fileName) {
                    if (fileName === undefined) return;
                    this.empty_pass();
                    this.setState({
                        action: 'init',
                        submitOk: !!this.pass(),
                        file: fileName,
                        pwError: ''
                    });
                }.bind(this)
            );
        } else if (val === true) {
            dialog.showOpenDialog(
                function(fileNames) {
                    if (fileNames === undefined) return;
                    var fileName = fileNames[0];
                    this.empty_pass();
                    this.setState({
                        action: 'open',
                        submitOk: !!this.pass(),
                        file: fileName,
                        pwError: ''
                    });
                }.bind(this)
            );
        } else if (val === config.file) {
            this.setState({
                action: 'open',
                submitOk: !!this.pass(),
                file: val
            });
        }
    }

    handleSubmit() {
        if (this.state.action === 'init') {
            this.initdb();
        } else {
            this.opendb();
        }
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

    menuItems() {
        const { file } = this.state,
            items = [];
        if (file) {
            items.push(<MenuItem key="3" value={file} primaryText={file} />);
        }
        items.push(
            <MenuItem key="1" value={true} primaryText="Open Database ..." />
        );
        items.push(
            <MenuItem key="2" value={false} primaryText="Create Database ..." />
        );
        return items;
    }

    render() {
        const open = this.state.action === 'open',
            label = open ? 'Unlock Database' : 'Create Database',
            icon = open ? unlockIcon : addIcon,
            hint = this.state.pw ? '' : 'Enter your database key';
        return (
            <div>
                <SelectField
                    floatingLabelText="Database file"
                    fullWidth={true}
                    value={this.state.file}
                    onChange={this.handleChange}>
                    {this.menuItems()}
                </SelectField>
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
