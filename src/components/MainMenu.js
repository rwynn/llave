import React, { Component, PureComponent } from 'react';
import MenuItem from 'material-ui/MenuItem';
import Menu from 'material-ui/Menu';
import Drawer from 'material-ui/Drawer';
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
        file_download
    </FontIcon>
);
const exportIcon = (
    <FontIcon style={{ fontSize: '18px' }} className="material-icons">
        file_upload
    </FontIcon>
);
const lockIcon = (
    <FontIcon style={{ fontSize: '18px' }} className="material-icons">
        lock_outline
    </FontIcon>
);

export class MainMenu extends PureComponent {
    state = {
        menuOpen: false
    };

    constructor(props) {
        super(props);
        this.switchDatabase = this.switchDatabase.bind(this);
        this.showBin = this.showBin.bind(this);
        this.confirmExport = this.confirmExport.bind(this);
        this.exportDatabase = this.exportDatabase.bind(this);
        this.importDatabase = this.importDatabase.bind(this);
        this.onMenu = this.onMenu.bind(this);
        this.onRequestMenu = this.onRequestMenu.bind(this);
        S.on('set.menu.main', this.onMenu);
        S.on('set.database.locked', this.switchDatabase);
    }

    componentWillUnmount() {
        S.removeListener('set.menu.main', this.onMenu);
        S.removeListener('set.database.locked', this.switchDatabase);
    }

    onRequestMenu(open) {
        S.set('menu.main', open);
    }

    onMenu(open) {
        this.setState({
            menuOpen: open
        });
    }

    confirmExport() {
        S.set('menu.main', false);
        S.send('dialog', {
            title: 'Export Database',
            message:
                'Your database will be exported unencrypted.  Save a copy of the database in plain text?',
            leftLabel: 'Cancel',
            rightLabel: 'OK',
            onRightLabel: this.exportDatabase,
            onLeftLabel: null
        });
    }

    exportDatabase() {
        ipcRenderer.send('export');
        ipcRenderer.once('export-reply', (ev, payload) => {
            const { cmd, err, code } = payload;
            const msg = code === 0 ? 'Entries exported' : err;
            S.set('snack.message', msg);
        });
    }

    importDatabase() {
        S.set('menu.main', false);
        ipcRenderer.send('import');
        ipcRenderer.once('import-reply', (ev, payload) => {
            const { cmd, err, code } = payload;
            const msg = code === 0 ? 'Entries imported' : err;
            S.set('snack.message', msg);
            if (code === 0) {
                ipcRenderer.send('ironclad', ['dump']);
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
        S.send('dialog', null);
        history.push('/');
    }

    menu() {
        return (
            <Menu>
                <MenuItem
                    onTouchTap={this.switchDatabase}
                    leftIcon={lockIcon}
                    value={true}
                    primaryText="Lock Database"
                />
                <MenuItem
                    onTouchTap={this.confirmExport}
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
        );
    }

    render() {
        return (
            <Drawer
                containerStyle={{ 'overflow-x': 'hidden' }}
                open={this.state.menuOpen}
                onRequestChange={this.onRequestMenu}
                docked={false}>
                <Subheader>Manage Database</Subheader>
                {this.menu()}
            </Drawer>
        );
    }
}

export default MainMenu;
