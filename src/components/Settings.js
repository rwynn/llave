import React, { Component, PureComponent } from 'react';
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

class Settings extends PureComponent {
    state = {
        example: ''
    };

    defaultPasswords = {
        len: 24,
        flags: 'dlsu'
    };

    defaultAutoLock = {
        enabled: true,
        timeout: 5
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
        borderRadius: '5px',
        backgroundColor: grey300
    };

    cardHeaderStyle = {
        paddingBottom: '0px'
    };

    cardTextStyle = {
        paddingTop: '0px'
    };

    subheaderStyle = {
        color: 'rgba(0, 0, 0, 0.870588)',
        fontSize: '16px',
        lineHeight: '1',
        marginBottom: '12px'
    };

    titleButtonStyle = {
        color: '#fff',
        left: '20px',
        margin: '15px 0px 0px 0px'
    };

    constructor(props) {
        super(props);
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
        this.sliderChange = this.sliderChange.bind(this);
        this.onIdleTimeout = this.onIdleTimeout.bind(this);
        this.onGen = this.onGen.bind(this);
        this.onStorageGet = this.onStorageGet.bind(this);
        this.onStorageSet = this.onStorageSet.bind(this);
        this.handleSave = this.handleSave.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.handleMenu = this.handleMenu.bind(this);
        this.toggleAutolock = this.toggleAutolock.bind(this);
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
            this.storage = data;
            const { passwords, autoLock } = data;
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
        }
        this.regen();
    }

    onStorageSet(e, reply) {
        const { code, err, data } = reply;
        if (code === 0) {
            const { passwords, autoLock } = data;
            S.set('settings.passwords', passwords);
            S.set('settings.autolock', autoLock);
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

    toggleAutolock(e, on) {
        const { autoLock } = this;
        autoLock.enabled = on;
        this.setState({
            autoLock: on
        });
    }

    autoLockToggle() {
        const { enabled } = this.autoLock;
        return <Toggle onToggle={this.toggleAutolock} toggled={enabled} />;
    }

    handleClose() {
        const { history } = this.props;
        history.push('/entries');
        S.set('settings.close', true);
    }

    barChildren() {
        return [
            <FlatButton
                key="close"
                onTouchTap={this.handleClose}
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
        let data = this.storage;
        if (data) {
            const { passwords, autoLock } = data;
            if (autoLock) {
                Object.assign(autoLock, this.autoLock);
            } else {
                data.autoLock = Object.assign({}, this.autoLock);
            }
            if (passwords) {
                Object.assign(passwords, this.passwords);
            } else {
                data.passwords = Object.assign({}, this.passwords);
            }
        } else {
            data = {
                autoLock: Object.assign({}, this.autoLock),
                passwords: Object.assign({}, this.passwords)
            };
        }
        ipcRenderer.send('store-set', data);
    }

    render() {
        const { autoLock } = this;
        const timeout = autoLock.enabled
            ? <div>
                  <Subheader style={this.subheaderStyle}>
                      Inactivity Timeout ({autoLock.timeout} minutes)
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
            : null;

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
                </div>
            </div>
        );
    }
}

export default Settings;
