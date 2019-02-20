import React, { Component, PureComponent } from 'react';
import muiThemeable from 'material-ui/styles/muiThemeable';
import AppBar from 'material-ui/AppBar';
import FlatButton from 'material-ui/FlatButton';
import TextField from 'material-ui/TextField';
import FontIcon from 'material-ui/FontIcon';
import { grey500, transparent } from 'material-ui/styles/colors';
import Toggle from 'material-ui/Toggle';
import { Card, CardActions, CardHeader, CardText } from 'material-ui/Card';
import Tags from './Tags';
import S from '../store/Store';

const { ipcRenderer } = window.require('electron');
const favoriteLabel = 'favorite';
const saveIcon = (
    <FontIcon style={{ fontSize: '18px' }} className="material-icons">
        save
    </FontIcon>
);
const descIcon = (
    <FontIcon
        color={grey500}
        style={{ fontSize: '36px' }}
        className="material-icons">
        description
    </FontIcon>
);

export class Add extends PureComponent {
    state = {
        showErrors: false,
        showPassword: false,
        isFavorite: false
    };

    entry = {
        title: '',
        url: '',
        username: '',
        email: '',
        password: '',
        tags: [],
        notes: ''
    };

    defaultSettings = {
        len: 24,
        flags: 'dlsu'
    };

    title = 'Add';

    cardHeaderStyle = {
        paddingBottom: '0px'
    };

    cardTextStyle = {
        paddingTop: '0px'
    };

    titleButtonStyle = {
        left: '20px',
        margin: '15px 0px 0px 0px'
    };

    constructor(props) {
        super(props);
        const setFavorite = S.get('entries.filter', -1) === 1;
        Object.assign(this.titleButtonStyle, {
            color: props.muiTheme.palette.alternateTextColor
        });
        this.settings = Object.assign(
            {},
            this.defaultSettings,
            S.get('settings.passwords', this.defaultSettings)
        );
        this.generatePassword = this.generatePassword.bind(this);
        this.handlePress = this.handlePress.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleSave = this.handleSave.bind(this);
        this.togglePassword = this.togglePassword.bind(this);
        this.toggleFavorite = this.toggleFavorite.bind(this);
        this.tagsChanged = this.tagsChanged.bind(this);
        this.handleMenu = this.handleMenu.bind(this);
        this.handleCancel = this.handleCancel.bind(this);
        this.onStorageGet = this.onStorageGet.bind(this);
        this.onGen = this.onGen.bind(this);
        if (setFavorite) {
            this.state.isFavorite = true;
            this.entry.tags.push('favorite');
        }
    }

    handleMenu() {
        S.set('menu.main', true);
    }

    tagsChanged(tags) {
        this.entry.tags = tags.slice();
        this.setState({
            isFavorite: this.isFavorite()
        });
        this.forceUpdate();
    }

    isFavorite() {
        const { tags } = this.entry;
        return tags.indexOf(favoriteLabel) !== -1;
    }

    togglePassword(e, on) {
        this.setState({
            showPassword: on
        });
    }

    toggleFavorite(e, on) {
        const { tags } = this.entry,
            tag = favoriteLabel,
            i = tags.indexOf(tag);
        if (on) {
            if (i === -1) {
                tags.push(tag);
                this.tagsChanged(tags);
            }
        } else {
            if (i !== -1) {
                tags.splice(i, 1);
                this.tagsChanged(tags);
            }
        }
    }

    onStorageGet(e, reply) {
        const { code, err, data } = reply;
        if (code === 0) {
            const { passwords } = data;
            if (passwords) {
                S.set('settings.passwords', passwords);
                if (passwords.len) {
                    this.settings.len = passwords.len;
                }
                if (passwords.flags) {
                    this.settings.flags = passwords.flags;
                }
            }
        }
        this.generatePassword();
    }

    generatePassword() {
        const { len, flags } = this.settings;
        const args = flags
            ? ['gen', `-${flags}`, '-px', len]
            : ['gen', '-px', len];
        ipcRenderer.send('ironclad', args);
    }

    onGen(e, payload) {
        const cmd = payload.cmd,
            entry = this.entry,
            { password } = this.refs,
            code = payload.code;
        if (cmd === 'gen') {
            if (code === 0) {
                entry.password = payload.data;
                password.input.value = entry.password;
                password.setState({ hasValue: true });
            } else {
            }
        }
    }

    componentDidMount() {
        const { title } = this.refs,
            { input } = title;
        input.focus();
        ipcRenderer.on('ironclad-reply', this.onGen);
        ipcRenderer.on('store-get-reply', this.onStorageGet);
        ipcRenderer.send('store-get');
    }

    componentWillUnmount() {
        ipcRenderer.removeListener('ironclad-reply', this.onGen);
        ipcRenderer.removeListener('store-get-reply', this.onStorageGet);
    }

    getInput() {
        const entry = this.entry,
            fields = [
                'title',
                'url',
                'username',
                'email',
                'password',
                'tags',
                'addnote'
            ];
        fields[0] = entry.title;
        fields[1] = entry.url;
        fields[2] = entry.username;
        fields[3] = entry.email;
        fields[4] = entry.password;
        fields[5] = entry.tags.join(',');
        fields[6] = entry.notes ? 'y' : 'n';
        if (entry.notes) {
            fields.push(entry.notes);
        }
        return fields;
    }

    submitOk() {
        const entry = this.entry;
        return entry.title !== '';
    }

    firstInvalid() {
        const entry = this.entry,
            { title } = this.refs;
        return title;
    }

    handlePress(ev) {
        if (ev.key === 'Enter') {
            this.handleSave();
            ev.preventDefault();
        }
    }

    handleChange(e, newVal) {
        const entry = this.entry;
        entry[e.target.name] = newVal;
        this.setState({
            showErrors: false
        });
    }

    makeField(prop, required, multi) {
        const { showErrors, showPassword } = this.state,
            entry = this.entry,
            value = entry[prop],
            multiLine = multi === true,
            rows = multiLine ? 5 : 1,
            onKeyPress = multiLine ? null : this.handlePress,
            label =
                prop === 'url'
                    ? prop.toUpperCase()
                    : prop.charAt(0).toUpperCase() + prop.substring(1),
            type =
                !showPassword && prop === 'password'
                    ? 'password'
                    : prop === 'email'
                    ? 'email'
                    : 'text';
        let errorText = null;
        if (showErrors && required && value === '') {
            errorText = `${label} is required`;
        }
        return (
            <TextField
                ref={prop}
                multiLine={multiLine}
                rows={rows}
                errorText={errorText}
                onKeyPress={onKeyPress}
                onChange={this.handleChange}
                name={prop}
                type={type}
                fullWidth={true}
                floatingLabelText={label}
                hintText={label}
            />
        );
    }

    handleCancel() {
        const { history, match } = this.props,
            { from, id } = match.params,
            next = from === 'details' ? `/details/${id}` : '/entries';
        history.push(next);
    }

    handleSave() {
        const { history } = this.props;
        if (this.submitOk()) {
            ipcRenderer.send('ironclad', ['add', '--no-editor'], {
                input: this.getInput()
            });
            ipcRenderer.once('ironclad-reply', (e, payload) => {
                const cmd = payload.cmd,
                    code = payload.code;
                if (cmd === 'add') {
                    if (code === 0) {
                        history.push('/entries');
                    }
                    const { title } = this.entry,
                        msg =
                            code === 0
                                ? `${title} has been saved`
                                : 'Failed to save entry';
                    S.set('snack.message', msg);
                }
            });
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

    render() {
        return (
            <div>
                <AppBar
                    title={this.title}
                    children={
                        <FlatButton
                            onTouchTap={this.handleCancel}
                            style={this.titleButtonStyle}
                            label="Cancel"
                        />
                    }
                    style={{
                        position: 'fixed',
                        top: '0',
                        paddingRight: '40px'
                    }}
                    onLeftIconButtonTouchTap={this.handleMenu}
                    onRightIconButtonTouchTap={this.handleSave}
                    iconElementRight={
                        <FlatButton icon={saveIcon} label="Save" />
                    }
                />
                <div className="inner">
                    <br />
                    <Card initiallyExpanded={true}>
                        <CardHeader
                            avatar={descIcon}
                            title="Details"
                            style={this.cardHeaderStyle}
                            subtitle="Add some details"
                            actAsExpander={false}
                            showExpandableButton={false}
                        />
                        <CardText style={this.cardTextStyle} expandable={false}>
                            {this.makeField('title', true)}
                            <br />
                            {this.makeField('url')}
                            <br />
                            {this.makeField('username')}
                            <br />
                            {this.makeField('email')}
                            <br />
                            {this.makeField('password')}
                            <br />
                            <br />
                            <div
                                style={{
                                    display: 'flex',
                                    'align-items': 'center'
                                }}>
                                <Toggle
                                    style={{ width: '200px' }}
                                    label="Show Password"
                                    toggled={this.state.showPassword}
                                    onKeyPress={this.handlePress}
                                    onToggle={this.togglePassword}
                                />
                                <FlatButton
                                    onTouchTap={this.generatePassword}
                                    style={{ marginLeft: 'auto' }}
                                    primary={true}
                                    label="Generate New Password"
                                />
                            </div>
                            <br />
                            <Toggle
                                style={{ width: '200px' }}
                                label="Favorite"
                                toggled={this.state.isFavorite}
                                onKeyPress={this.handlePress}
                                onToggle={this.toggleFavorite}
                            />
                            <br />
                            {this.makeField('notes', false, true)}
                            <br />
                        </CardText>
                    </Card>
                    <br />
                    <Tags
                        tags={this.entry.tags}
                        tagKeyPress={this.handlePress}
                        onChange={this.tagsChanged}
                    />
                </div>
            </div>
        );
    }
}

export default muiThemeable()(Add);
