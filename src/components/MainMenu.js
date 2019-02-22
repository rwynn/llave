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
const editIcon = (
    <FontIcon style={{ fontSize: '18px' }} className="material-icons">
        edit
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
        this.respond = this.respond.bind(this);
        this.switchDatabase = this.switchDatabase.bind(this);
        this.showBin = this.showBin.bind(this);
        this.changePassword = this.changePassword.bind(this);
        this.commitChangePassword = this.commitChangePassword.bind(this);
        this.confirmExport = this.confirmExport.bind(this);
        this.exportDatabase = this.exportDatabase.bind(this);
        this.importDatabase = this.importDatabase.bind(this);
        this.doImport = this.doImport.bind(this);
        this.doGenericImport = this.doGenericImport.bind(this);
        this.onMenu = this.onMenu.bind(this);
        this.onRequestMenu = this.onRequestMenu.bind(this);
        S.on('set.menu.main', this.onMenu);
        S.on('set.database.locked', this.switchDatabase);
        ipcRenderer.on('ironclad-reply', this.respond);
    }

    componentWillUnmount() {
        S.removeListener('set.menu.main', this.onMenu);
        S.removeListener('set.database.locked', this.switchDatabase);
        S.removeListener('ironclad-reply', this.respond);
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
        S.send('dialog', {
            title: 'Import Database',
            choices: [
                'Ironclad JSON',
                'KeePass 1.X XML',
                'KeePass 1.X CSV',
                'Generic CSV'
            ],
            choice: 'Ironclad JSON',
            choicesLabel: 'File Format',
            message: 'Select the file format to import',
            leftLabel: 'Cancel',
            rightLabel: 'Choose File',
            onRightLabel: this.doImport,
            onLeftLabel: undefined
        });
    }

    doGenericImport(path, mappings) {
        const options = {
            path: path,
            mappings: mappings,
            db: 'Generic',
            format: 'CSV'
        };
        ipcRenderer.send('import', options);
        ipcRenderer.once('import-reply', (ev, payload) => {
            const { cmd, err, code } = payload;
            const msg = code === 0 ? 'Entries imported' : err;
            S.set('snack.message', msg);
            if (code === 0) {
                ipcRenderer.send('ironclad', ['dump']);
            }
        });
    }

    doImport(choice) {
        let options;
        switch (choice) {
            case 'KeePass 1.X XML':
                options = { db: 'KeePass', format: 'XML' };
                break;
            case 'KeePass 1.X CSV':
                options = { db: 'KeePass', format: 'CSV' };
                break;
            case 'Generic CSV':
                options = { db: 'Generic', format: 'CSV' };
        }
        ipcRenderer.send('import', options);
        ipcRenderer.once('import-reply', (ev, payload) => {
            const { cmd, err, code } = payload;
            if (choice === 'Generic CSV') {
                if (code === 0) {
                    const { data } = payload,
                        { rows, path } = data;
                    S.send('dialog.mapper', {
                        title: 'Map Columns',
                        leftLabel: 'Cancel',
                        rightLabel: 'Import',
                        onRightLabel: this.doGenericImport,
                        onLeftLabel: null,
                        fields: rows,
                        path: path
                    });
                } else {
                    S.set('snack.message', err);
                }
            } else {
                const msg = code === 0 ? 'Entries imported' : err;
                S.set('snack.message', msg);
                if (code === 0) {
                    ipcRenderer.send('ironclad', ['dump']);
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
        S.send('dialog', null);
        history.push('/');
    }

    changePassword() {
        S.set('menu.main', false);
        S.send('dialog.changepass', {
            title: 'Change Database Password',
            message: 'Enter the new password for your database',
            leftLabel: 'Cancel',
            rightLabel: 'OK',
            onRightLabel: this.commitChangePassword,
            onLeftLabel: null
        });
    }

    respond(e, payload) {
        const { cmd, code, err } = payload;
        if (cmd === 'setpass') {
            if (code === 0) {
                S.set('snack.message', 'Password successfully changed');
                this.switchDatabase();
            } else {
                S.set(
                    'snack.message',
                    err
                        ? `Failed to change password: ${err}`
                        : 'Failed to change password'
                );
            }
        }
    }

    commitChangePassword(password) {
        ipcRenderer.send('ironclad', ['setpass'], {
            input: [password, password],
            raw: true
        });
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
                <MenuItem
                    onTouchTap={this.changePassword}
                    leftIcon={editIcon}
                    value={true}
                    primaryText="Change Password"
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
