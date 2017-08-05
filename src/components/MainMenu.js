import React, { Component, PureComponent } from 'react';
import MenuItem from 'material-ui/MenuItem';
import Menu from 'material-ui/Menu';
import Drawer from 'material-ui/Drawer';
import Snackbar from 'material-ui/Snackbar';
import Subheader from 'material-ui/Subheader';
import FontIcon from 'material-ui/FontIcon';
import S from '../store/Store';

const { ipcRenderer } = window.require('electron');

const deleteIcon = (
    <FontIcon style={{ fontSize: '18px' }} className="material-icons">
        delete
    </FontIcon>
);
const importIcon = (
    <FontIcon style={{ fontSize: '18px' }} className="material-icons">
        file_upload
    </FontIcon>
);
const exportIcon = (
    <FontIcon style={{ fontSize: '18px' }} className="material-icons">
        file_download
    </FontIcon>
);
const lockIcon = (
    <FontIcon style={{ fontSize: '18px' }} className="material-icons">
        lock_outline
    </FontIcon>
);

class MainMenu extends PureComponent {
    state = {
        menuOpen: false,
        snackOpen: false,
        snackMessage: ''
    };

    constructor(props) {
        super(props);
        this.switchDatabase = this.switchDatabase.bind(this);
        this.purgeDatabase = this.purgeDatabase.bind(this);
        this.showBin = this.showBin.bind(this);
        this.exportDatabase = this.exportDatabase.bind(this);
        this.importDatabase = this.importDatabase.bind(this);
        this.onMenu = this.onMenu.bind(this);
        this.onSnack = this.onSnack.bind(this);
        this.onRequestMenu = this.onRequestMenu.bind(this);
        S.on('set.menu.main', this.onMenu);
        S.on('set.snack.message', this.onSnack);
        S.on('set.database.locked', this.switchDatabase);
    }

    componentWillUnmount() {
        S.off('set.menu.main', this.onMenu);
        S.off('set.snack.message', this.onSnack);
        S.off('set.database.locked', this.switchDatabase);
    }

    onRequestMenu(open) {
        S.set('menu.main', open);
    }

    onSnack(message) {
        this.setState({
            snackOpen: true,
            snackMessage: message
        });
    }

    onMenu(open) {
        this.setState({
            menuOpen: open
        });
    }

    exportDatabase() {
        S.set('menu.main', false);
        ipcRenderer.send('export');
        ipcRenderer.once('export-reply', (ev, payload) => {
            const { cmd, err, code } = payload;
            const msg = code === 0 ? 'Entries exported' : err;
            this.setState({
                snackOpen: true,
                snackMessage: msg
            });
        });
    }

    importDatabase() {
        S.set('menu.main', false);
        ipcRenderer.send('import');
        ipcRenderer.once('import-reply', (ev, payload) => {
            const { cmd, err, code } = payload;
            const msg = code === 0 ? 'Entries imported' : err;
            this.setState({
                snackOpen: true,
                snackMessage: msg
            });
            if (code === 0) {
                ipcRenderer.send('ironclad', ['dump']);
            }
        });
    }

    purgeDatabase() {
        ipcRenderer.send('ironclad', ['purge']);
        ipcRenderer.once('ironclad-reply', (ev, payload) => {
            const cmd = payload.cmd,
                code = payload.code;
            if (cmd === 'purge') {
                const msg =
                    code === 0
                        ? 'Deleted entries have been purged'
                        : 'Failed to purge deleted entries';
                S.set('menu.main', false);
                this.setState({
                    snackOpen: true,
                    snackMessage: msg
                });
                if (code === 0) {
                    ipcRenderer.send('ironclad', ['dump']);
                } else {
                }
            }
        });
    }

    showBin() {
        const { history } = this.props;
        S.set('menu.main', false);
        history.push('/bin');
    }

    switchDatabase() {
        ipcRenderer.send('lock');
        const { history } = this.props;
        S.set('menu.main', false);
        S.set('entries', []);
        S.set('entries.filter', 0);
        history.push('/');
    }

    render() {
        return (
            <div>
                <Drawer
                    containerStyle={{ 'overflow-x': 'hidden' }}
                    open={this.state.menuOpen}
                    onRequestChange={this.onRequestMenu}
                    docked={false}>
                    <Subheader>Manage Database</Subheader>
                    <Menu>
                        <MenuItem
                            onTouchTap={this.switchDatabase}
                            leftIcon={lockIcon}
                            value={true}
                            primaryText="Lock Database"
                        />
                        <MenuItem
                            onTouchTap={this.exportDatabase}
                            leftIcon={exportIcon}
                            value={true}
                            primaryText="Export Entries"
                        />
                        <MenuItem
                            onTouchTap={this.importDatabase}
                            leftIcon={importIcon}
                            value={true}
                            primaryText="Import Entries"
                        />
                        <MenuItem
                            onTouchTap={this.showBin}
                            leftIcon={deleteIcon}
                            value={true}
                            primaryText="Recycle Bin"
                        />
                    </Menu>
                </Drawer>
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

export default MainMenu;
