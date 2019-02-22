import React, { Component, PureComponent } from 'react';
import muiThemeable from 'material-ui/styles/muiThemeable';
import Chip from 'material-ui/Chip';
import AppBar from 'material-ui/AppBar';
import FontIcon from 'material-ui/FontIcon';
import FlatButton from 'material-ui/FlatButton';
import Toggle from 'material-ui/Toggle';
import Subheader from 'material-ui/Subheader';
import Slider from 'material-ui/Slider';
import { List, ListItem } from 'material-ui/List';
import { Card, CardActions, CardHeader, CardText } from 'material-ui/Card';
import {
    grey500,
    grey300,
    grey900,
    transparent
} from 'material-ui/styles/colors';
import PasswordLength from './PasswordLength';
import S from '../store/Store';

const { ipcRenderer } = window.require('electron');

const closeIcon = (
    <FontIcon style={{ fontSize: '18px' }} className="material-icons">
        close
    </FontIcon>
);
const saveIcon = (
    <FontIcon style={{ fontSize: '18px' }} className="material-icons">
        save
    </FontIcon>
);
const keyIcon = (
    <FontIcon
        color={grey500}
        style={{ fontSize: '36px' }}
        className="material-icons">
        vpn_key
    </FontIcon>
);
const timerIcon = (
    <FontIcon
        color={grey500}
        style={{ fontSize: '36px' }}
        className="material-icons">
        timer
    </FontIcon>
);
const themeIcon = (
    <FontIcon
        color={grey500}
        style={{ fontSize: '36px' }}
        className="material-icons">
        palette
    </FontIcon>
);

export class Settings extends PureComponent {
    state = {
        example: ''
    };

    defaultPasswords = {
        len: 24,
        flags: 'dlsu'
    };

    defaultClipboard = {
        autoClear: true,
        timeout: 10
    };

    defaultAutoLock = {
        enabled: true,
        timeout: 5
    };

    defaultTheme = {
        dark: false
    };

    sliderStyle = {
        maxWidth: '400px',
        margin: '0px 0px 0px 15px'
    };

    exampleLabelStyle = {
        fontSize: '16px'
    };

    exampleStyle = {
        marginLeft: '15px',
        borderRadius: '5px'
    };

    cardHeaderStyle = {
        paddingBottom: '0px'
    };

    cardTextStyle = {
        paddingTop: '0px'
    };

    subheaderStyle = {
        fontSize: '16px',
        lineHeight: '1',
        marginBottom: '12px'
    };

    titleButtonStyle = {
        left: '20px',
        margin: '15px 0px 0px 0px'
    };

    constructor(props) {
        super(props);
        Object.assign(this.titleButtonStyle, {
            color: props.muiTheme.palette.alternateTextColor
        });
        Object.assign(this.subheaderStyle, {
            color: props.muiTheme.palette.primaryTextColor
        });
        this.passwords = Object.assign(
            {},
            this.defaultPasswords,
            S.get('settings.passwords', this.defaultPasswords)
        );
        this.autoLock = Object.assign(
            {},
            this.defaultAutoLock,
            S.get('settings.autolock', this.defaultAutoLock)
        );
        this.clipboard = Object.assign(
            {},
            this.defaultClipboard,
            S.get('settings.clipboard', this.defaultClipboard)
        );
        this.theme = Object.assign(
            {},
            this.defaultTheme,
            S.get('settings.theme', this.defaultTheme, true)
        );
        this.initialSettings = {
            passwords: Object.assign({}, this.passwords),
            autoLock: Object.assign({}, this.autoLock),
            clipboard: Object.assign({}, this.clipboard),
            theme: Object.assign({}, this.theme)
        };
        this.sliderChange = this.sliderChange.bind(this);
        this.onIdleTimeout = this.onIdleTimeout.bind(this);
        this.onClipboardTimeout = this.onClipboardTimeout.bind(this);
        this.onGen = this.onGen.bind(this);
        this.onStorageGet = this.onStorageGet.bind(this);
        this.onStorageSet = this.onStorageSet.bind(this);
        this.handleSave = this.handleSave.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.confirmClose = this.confirmClose.bind(this);
        this.handleMenu = this.handleMenu.bind(this);
        this.toggleAutolock = this.toggleAutolock.bind(this);
        this.toggleClipboardClear = this.toggleClipboardClear.bind(this);
        this.toggleDarkTheme = this.toggleDarkTheme.bind(this);
    }

    onGen(e, payload) {
        const cmd = payload.cmd,
            code = payload.code;
        if (cmd === 'gen') {
            if (code === 0) {
                this.setState({
                    example: payload.data
                });
            }
        }
    }

    regen() {
        const { len, flags } = this.passwords;
        const args = flags
            ? ['gen', `-${flags}`, '-px', len]
            : ['gen', '-px', len];
        ipcRenderer.send('ironclad', args);
    }

    loadStorage() {
        ipcRenderer.send('store-get');
    }

    onStorageGet(e, reply) {
        const { code, err, data } = reply;
        if (code === 0) {
            const { passwords, autoLock, theme, clipboard } = data;
            if (passwords) {
                this.passwords = Object.assign(
                    {},
                    this.defaultPasswords,
                    passwords
                );
                S.set('settings.passwords', this.passwords);
            }
            if (autoLock) {
                this.autoLock = Object.assign(
                    {},
                    this.defaultAutoLock,
                    autoLock
                );
                S.set('settings.autolock', this.autoLock);
            }
            if (theme) {
                this.theme = Object.assign({}, this.defaultTheme, theme);
                S.set('settings.theme', this.theme, true);
            }
            if (clipboard) {
                this.clipboard = Object.assign(
                    {},
                    this.defaultClipboard,
                    clipboard
                );
                S.set('settings.clipboard', this.clipboard);
            }
            this.initialSettings = {
                passwords: Object.assign({}, this.passwords),
                autoLock: Object.assign({}, this.autoLock),
                clipboard: Object.assign({}, this.clipboard),
                theme: Object.assign({}, this.theme)
            };
        }
        this.regen();
    }

    onStorageSet(e, reply) {
        const { code, err, data } = reply;
        if (code === 0) {
            const { passwords, autoLock, theme, clipboard } = data;
            S.set('settings.passwords', passwords);
            S.set('settings.autolock', autoLock);
            S.set('settings.clipboard', clipboard);
            S.set('settings.theme', theme, true);
            this.handleClose();
            S.set('snack.message', 'Settings saved');
        } else {
            S.set('snack.message', err);
        }
    }

    sliderChange(e, len) {
        this.passwords.len = len;
        this.regen();
    }

    onIdleTimeout(e, timeout) {
        this.autoLock.timeout = timeout;
        this.setState({
            autoLockTimeout: timeout
        });
    }

    onClipboardTimeout(e, timeout) {
        this.clipboard.timeout = timeout;
        this.setState({
            clipboardTimeout: timeout
        });
    }

    componentDidMount() {
        ipcRenderer.on('ironclad-reply', this.onGen);
        ipcRenderer.on('store-get-reply', this.onStorageGet);
        ipcRenderer.on('store-set-reply', this.onStorageSet);
        const settings = S.get('settings.passwords', false);
        if (settings === false) {
            this.loadStorage();
        } else {
            this.regen();
        }
    }

    componentWillUnmount() {
        ipcRenderer.removeListener('ironclad-reply', this.onGen);
        ipcRenderer.removeListener('store-get-reply', this.onStorageGet);
        ipcRenderer.removeListener('store-set-reply', this.onStorageSet);
    }

    toggleFlag(f, e, on) {
        const { flags } = this.passwords;
        if (on) {
            const flag = flags.indexOf(f);
            if (flag === -1) {
                this.passwords.flags = flags + f;
                this.regen();
            }
        } else {
            this.passwords.flags = flags.replace(f, '');
            this.regen();
        }
    }

    makeToggle(f) {
        const { flags } = this.passwords,
            on = flags.indexOf(f) !== -1;
        return <Toggle onToggle={this.toggleFlag.bind(this, f)} toggled={on} />;
    }

    toggleDarkTheme(e, on) {
        const { theme } = this;
        theme.dark = on;
        this.setState({
            darkTheme: on
        });
    }

    darkThemeToggle() {
        const { dark } = this.theme;
        return <Toggle onToggle={this.toggleDarkTheme} toggled={dark} />;
    }

    toggleAutolock(e, on) {
        const { autoLock } = this;
        autoLock.enabled = on;
        this.setState({
            autoLock: on
        });
    }

    toggleClipboardClear(e, on) {
        const { clipboard } = this;
        clipboard.autoClear = on;
        this.setState({
            clipboardClear: on
        });
    }

    autoLockToggle() {
        const { enabled } = this.autoLock;
        return <Toggle onToggle={this.toggleAutolock} toggled={enabled} />;
    }

    clipboardToggle() {
        const { autoClear } = this.clipboard;
        return (
            <Toggle onToggle={this.toggleClipboardClear} toggled={autoClear} />
        );
    }

    handleClose() {
        const { history } = this.props;
        history.push('/entries');
        S.set('settings.close', true);
    }

    confirmClose() {
        const initial = JSON.stringify(this.initialSettings),
            settings = JSON.stringify({
                passwords: this.passwords,
                autoLock: this.autoLock,
                clipboard: this.clipboard,
                theme: this.theme
            });
        if (initial !== settings) {
            S.send('dialog', {
                title: 'Unsaved Changes',
                message:
                    'You have unsaved changes. Would you like to save them?',
                leftLabel: 'Discard',
                rightLabel: 'Save',
                onRightLabel: this.handleSave,
                onLeftLabel: this.handleClose
            });
        } else {
            this.handleClose();
        }
    }

    barChildren() {
        return [
            <FlatButton
                key="close"
                onTouchTap={this.confirmClose}
                icon={closeIcon}
                style={this.titleButtonStyle}
                label="Close"
            />
        ];
    }

    handleMenu() {
        S.set('menu.main', true);
    }

    handleSave() {
        ipcRenderer.send('store-set', {
            passwords: this.passwords,
            autoLock: this.autoLock,
            theme: this.theme,
            clipboard: this.clipboard
        });
    }

    passwordSettingsCard() {
        return (
            <Card initiallyExpanded={true}>
                <CardHeader
                    avatar={keyIcon}
                    title="Default Password Settings"
                    style={this.cardHeaderStyle}
                    subtitle="The password settings below will be applied to new entries"
                    actAsExpander={false}
                    showExpandableButton={false}
                />
                <CardText style={this.cardTextStyle} expandable={false}>
                    <List>
                        <ListItem
                            primaryText="Digits"
                            secondaryText="Include Digits"
                            rightToggle={this.makeToggle('d')}
                        />
                        <ListItem
                            primaryText="Symbols"
                            secondaryText="Include Symbols"
                            rightToggle={this.makeToggle('s')}
                        />
                        <ListItem
                            primaryText="Uppercase"
                            secondaryText="Include Uppercase Characters"
                            rightToggle={this.makeToggle('u')}
                        />
                        <ListItem
                            primaryText="Lowercase"
                            secondaryText="Include Lowercase Characters"
                            rightToggle={this.makeToggle('l')}
                        />
                        <PasswordLength
                            len={this.passwords.len}
                            onChange={this.sliderChange}
                        />
                        <Subheader>Example Password</Subheader>
                        <Chip
                            labelStyle={this.exampleLabelStyle}
                            style={this.exampleStyle}>
                            {this.state.example}
                        </Chip>
                    </List>
                </CardText>
            </Card>
        );
    }

    render() {
        const { autoLock, clipboard } = this;
        const timeout = autoLock.enabled ? (
            <div>
                <Subheader style={this.subheaderStyle}>
                    Inactivity Timeout ({autoLock.timeout}{' '}
                    {autoLock.timeout === 1 ? 'minute' : 'minutes'})
                </Subheader>
                <Slider
                    onChange={this.onIdleTimeout}
                    sliderStyle={this.sliderStyle}
                    min={1}
                    max={30}
                    step={1}
                    value={autoLock.timeout}
                />
            </div>
        ) : null;
        const cbTimeout = clipboard.autoClear ? (
            <div>
                <Subheader style={this.subheaderStyle}>
                    Clipboard Timeout ({clipboard.timeout}{' '}
                    {clipboard.timeout === 1 ? 'second' : 'seconds'})
                </Subheader>
                <Slider
                    onChange={this.onClipboardTimeout}
                    sliderStyle={this.sliderStyle}
                    min={1}
                    max={60}
                    step={1}
                    value={clipboard.timeout}
                />
            </div>
        ) : null;
        return (
            <div>
                <AppBar
                    title="Settings"
                    children={this.barChildren()}
                    style={{
                        position: 'fixed',
                        top: '0',
                        paddingRight: '40px'
                    }}
                    onRightIconButtonTouchTap={this.handleSave}
                    onLeftIconButtonTouchTap={this.handleMenu}
                    iconElementRight={
                        <FlatButton icon={saveIcon} label="Save" />
                    }
                />
                <div className="inner">
                    <br />
                    <Card initiallyExpanded={true}>
                        <CardHeader
                            avatar={themeIcon}
                            title="Theme Settings"
                            style={this.cardHeaderStyle}
                            subtitle="Configure the appearance of the interface"
                            actAsExpander={false}
                            showExpandableButton={false}
                        />
                        <CardText style={this.cardTextStyle} expandable={false}>
                            <List>
                                <ListItem
                                    primaryText="Dark Theme"
                                    secondaryText="Use a dark theme"
                                    rightToggle={this.darkThemeToggle()}
                                />
                            </List>
                        </CardText>
                    </Card>
                    <br />
                    <Card initiallyExpanded={true}>
                        <CardHeader
                            avatar={timerIcon}
                            title="Auto Lock Settings"
                            style={this.cardHeaderStyle}
                            subtitle="The database will be locked according to the settings below"
                            actAsExpander={false}
                            showExpandableButton={false}
                        />
                        <CardText style={this.cardTextStyle} expandable={false}>
                            <List>
                                <ListItem
                                    primaryText="Auto Lock"
                                    secondaryText="Lock the database and require a password after a period of inactivity"
                                    rightToggle={this.autoLockToggle()}
                                />
                                {timeout}
                            </List>
                        </CardText>
                    </Card>
                    <br />
                    <Card initiallyExpanded={true}>
                        <CardHeader
                            avatar={timerIcon}
                            title="Clipboard Settings"
                            style={this.cardHeaderStyle}
                            subtitle="The clipboard will be cleared according to the settings below"
                            actAsExpander={false}
                            showExpandableButton={false}
                        />
                        <CardText style={this.cardTextStyle} expandable={false}>
                            <List>
                                <ListItem
                                    primaryText="Auto Clear"
                                    secondaryText="Clear the clipboard after a timeout. Check your clipboard manager to ensure emptying is allowed."
                                    rightToggle={this.clipboardToggle()}
                                />
                                {cbTimeout}
                            </List>
                        </CardText>
                    </Card>
                    <br />
                    {this.passwordSettingsCard()}
                </div>
            </div>
        );
    }
}

export default muiThemeable()(Settings);
