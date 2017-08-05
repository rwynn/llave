import React, { Component, PureComponent } from 'react';
import AppBar from 'material-ui/AppBar';
import Snackbar from 'material-ui/Snackbar';
import FlatButton from 'material-ui/FlatButton';
import TextField from 'material-ui/TextField';
import Toggle from 'material-ui/Toggle';
import Subheader from 'material-ui/Subheader';
import FontIcon from 'material-ui/FontIcon';
import { grey500, transparent } from 'material-ui/styles/colors';
import { List, ListItem } from 'material-ui/List';
import { Card, CardActions, CardHeader, CardText } from 'material-ui/Card';
import Tags from './Tags';
import S from '../store/Store';

const closeIcon = (
    <FontIcon style={{ fontSize: '18px' }} className="material-icons">
        close
    </FontIcon>
);
const deleteIcon = (
    <FontIcon style={{ fontSize: '18px' }} className="material-icons">
        delete
    </FontIcon>
);
const editIcon = (
    <FontIcon style={{ fontSize: '18px' }} className="material-icons">
        mode_edit
    </FontIcon>
);
const showIcon = (
    <FontIcon color={grey500} className="material-icons">
        visibility
    </FontIcon>
);
const hideIcon = (
    <FontIcon color={grey500} className="material-icons">
        visibility_off
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

const { ipcRenderer } = window.require('electron');

class Details extends PureComponent {
    state = {
        title: '',
        url: '',
        username: '',
        email: '',
        password: '',
        tags: [],
        showPassword: false,
        showUser: false,
        snackOpen: false,
        snackMessage: ''
    };

    cardHeaderStyle = {
        paddingBottom: '0px'
    };

    cardTextStyle = {
        paddingTop: '0px'
    };

    titleButtonStyle = {
        color: '#fff',
        left: '20px',
        margin: '15px 0px 0px 0px'
    };

    constructor(props) {
        super(props);
        const entries = S.get('entries', []),
            { match } = this.props,
            { id } = match.params;
        entries.find(function(e) {
            if (e.id == id) {
                Object.assign(this.state, e);
                this.state.tags = e.tags.slice();
                const { passwords } = e,
                    len = passwords.length;
                if (len > 0) {
                    this.state.password = passwords[len - 1];
                }
                return true;
            }
        }, this);
        this.handleEdit = this.handleEdit.bind(this);
        this.handleDelete = this.handleDelete.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.togglePassword = this.togglePassword.bind(this);
        this.toggleUser = this.toggleUser.bind(this);
        this.handleMenu = this.handleMenu.bind(this);
    }

    handleMenu() {
        S.set('menu.main', true);
    }

    mask(val) {
        return val.split('').reduce(ac => ac + '*', '');
    }

    clip(prop, label) {
        const val = this.state[prop];
        if (!val) return;
        const { id } = this.state;
        const commands = {
            password: 'pass',
            username: 'user'
        };
        if (this.snackTimer) {
            clearTimeout(this.snackTimer);
            this.snackTimer = null;
        }
        if (prop === 'password' || prop === 'username') {
            const command = commands[prop];
            ipcRenderer.send('ironclad', [command, '-p', id], {
                clipboard: true
            });
            ipcRenderer.once('ironclad-reply', (ev, payload) => {
                const cmd = payload.cmd,
                    code = payload.code;
                if (cmd === command) {
                    this.setState({
                        snackOpen: true,
                        snackMessage:
                            code === 0
                                ? `${label} sent to the clipboard`
                                : `Failed to copy ${label} to clipboard`
                    });
                    if (code === 0) {
                        this.snackTimer = setTimeout(() => {
                            this.setState({
                                snackMessage:
                                    'The clipboard will be cleared in 10 seconds'
                            });
                        }, 1500);
                    }
                }
            });
        } else {
            ipcRenderer.send('clipboard', val);
            ipcRenderer.once('clipboard-reply', (ev, ok) => {
                this.setState({
                    snackOpen: true,
                    snackMessage: ok
                        ? `${label} sent to the clipboard`
                        : `Failed to copy ${label} to clipboard`
                });
                if (ok) {
                    this.snackTimer = setTimeout(() => {
                        this.setState({
                            snackMessage:
                                'The clipboard will be cleared in 10 seconds'
                        });
                    }, 1500);
                }
            });
        }
    }

    togglePassword() {
        const { password, showPassword, id } = this.state;
        if (showPassword) {
            this.setState({
                showPassword: false,
                password: this.mask(password)
            });
        } else {
            ipcRenderer.send('ironclad', ['pass', '-p', id]);
            ipcRenderer.once('ironclad-reply', (ev, payload) => {
                const cmd = payload.cmd,
                    code = payload.code;
                if (cmd === 'pass') {
                    if (code === 0) {
                        this.setState({
                            showPassword: true,
                            password: payload.data
                        });
                    }
                }
            });
        }
    }

    toggleUser() {
        const { username, showUser, id } = this.state;
        if (showUser) {
            this.setState({
                showUser: false,
                username: this.mask(username)
            });
        } else {
            ipcRenderer.send('ironclad', ['user', '-p', id]);
            ipcRenderer.once('ironclad-reply', (ev, payload) => {
                const cmd = payload.cmd,
                    code = payload.code;
                if (cmd === 'user') {
                    if (code === 0) {
                        this.setState({
                            showUser: true,
                            username: payload.data
                        });
                    }
                }
            });
        }
    }

    makeField(prop) {
        let val = this.state[prop];
        let rightIconButton = null,
            rightIcon = null;
        const label =
            prop === 'url'
                ? prop.toUpperCase()
                : prop.charAt(0).toUpperCase() + prop.substring(1);
        if (val) {
            if (prop === 'password') {
                const { showPassword } = this.state,
                    rightIcon = showPassword ? hideIcon : showIcon;
                rightIconButton = (
                    <FlatButton
                        icon={rightIcon}
                        label={showPassword ? 'Hide' : 'Show'}
                        labelStyle={{ color: grey500 }}
                        hoverColor="#fff"
                        onTouchTap={this.togglePassword}
                    />
                );
            } else if (prop === 'username') {
                const { showUser } = this.state,
                    rightIcon = showUser ? hideIcon : showIcon;
                rightIconButton = (
                    <FlatButton
                        icon={rightIcon}
                        label={showUser ? 'Hide' : 'Show'}
                        labelStyle={{ color: grey500 }}
                        hoverColor="#fff"
                        onTouchTap={this.toggleUser}
                    />
                );
            }
        }
        return (
            <ListItem
                onTouchTap={this.clip.bind(this, prop, label)}
                primaryText={val}
                secondaryText={label}
                rightIconButton={rightIconButton}
            />
        );
    }

    handleEdit() {
        const { history, match } = this.props,
            { id } = match.params;
        history.push(`/edit/${id}/details`);
    }

    handleDelete() {
        const { history, match } = this.props,
            { title } = this.state,
            { id } = match.params;
        ipcRenderer.send('ironclad', ['delete', id], { input: ['y'] });
        ipcRenderer.once('ironclad-reply', (ev, payload) => {
            const cmd = payload.cmd,
                code = payload.code;
            if (cmd === 'delete') {
                const msg =
                    code === 0
                        ? `${title} moved to the Recycle Bin`
                        : 'Failed to delete entry';
                if (code === 0) {
                    const entries = S.get('entries', []),
                        index = entries.findIndex(e => {
                            return e.id == id;
                        });
                    if (index !== -1) {
                        entries.splice(index, 1);
                    }
                    history.push('/entries');
                }
                S.set('snack.message', msg);
            }
        });
    }

    handleClose() {
        const { history } = this.props;
        history.push('/entries');
    }

    barChildren() {
        return [
            <FlatButton
                key="edit"
                onTouchTap={this.handleEdit}
                icon={editIcon}
                style={this.titleButtonStyle}
                label="Edit"
            />,
            <FlatButton
                key="close"
                onTouchTap={this.handleClose}
                icon={closeIcon}
                style={this.titleButtonStyle}
                label="Close"
            />
        ];
    }

    render() {
        return (
            <div>
                <AppBar
                    title="Details"
                    children={this.barChildren()}
                    style={{
                        position: 'fixed',
                        top: '0',
                        paddingRight: '40px'
                    }}
                    onRightIconButtonTouchTap={this.handleDelete}
                    onLeftIconButtonTouchTap={this.handleMenu}
                    iconElementRight={
                        <FlatButton icon={deleteIcon} label="Delete" />
                    }
                />
                <div className="inner">
                    <br />
                    <Card initiallyExpanded={true}>
                        <CardHeader
                            avatar={descIcon}
                            title={this.state.title}
                            style={this.cardHeaderStyle}
                            subtitle={this.state.url}
                            actAsExpander={false}
                            showExpandableButton={false}
                        />
                        <CardText style={this.cardTextStyle} expandable={false}>
                            <List>
                                {this.makeField('title')}
                                {this.makeField('url')}
                                {this.makeField('username')}
                                {this.makeField('email')}
                                {this.makeField('password')}
                                <Tags readonly={true} tags={this.state.tags} />
                            </List>
                        </CardText>
                    </Card>
                </div>
                <Snackbar
                    open={this.state.snackOpen}
                    message={this.state.snackMessage}
                    autoHideDuration={1200}
                    onRequestClose={reason =>
                        this.setState({ snackOpen: false })}
                />
            </div>
        );
    }
}

export default Details;
