import React, { Component, PureComponent } from 'react';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';
import {
    Table,
    TableBody,
    TableFooter,
    TableHeader,
    TableHeaderColumn,
    TableRow,
    TableRowColumn
} from 'material-ui/Table';
import S from '../store/Store';

const defaultMappings = {
    title: null,
    url: null,
    username: null,
    email: null,
    password: null,
    notes: null
};

class DataMapperDialog extends PureComponent {
    state = {
        dialogOpen: false,
        dialog: {
            title: '',
            message: '',
            leftLabel: '',
            rightLabel: '',
            onLeftLabel: null,
            onRightLabel: null,
            fields: null,
            path: null
        },
        mappings: Object.assign({}, defaultMappings)
    };

    constructor(props) {
        super(props);
        this.onDialog = this.onDialog.bind(this);
        this.onChoice = this.onChoice.bind(this);
        S.on('set.dialog.mapper', this.onDialog);
    }

    componentWillUnmount() {
        S.removeListener('set.dialog.mapper', this.onDialog);
    }

    autoMatch(mappings, fields) {
        if (fields) {
            fields.forEach((f, i) => {
                if (f) {
                    const lf = f.toLowerCase();
                    if (mappings.hasOwnProperty(lf)) {
                        mappings[lf] = i;
                    } else {
                        switch (lf) {
                            case 'account':
                                mappings.title = i;
                                break;
                            case 'comments':
                                mappings.notes = i;
                                break;
                        }
                    }
                }
            });
        }
    }

    onDialog(dialog) {
        if (dialog) {
            const mappings = Object.assign({}, defaultMappings);
            this.autoMatch(mappings, dialog.fields);
            this.setState({
                dialogOpen: true,
                dialog: dialog,
                mappings: mappings
            });
        } else {
            this.setState({
                dialogOpen: false,
                mappings: Object.assign({}, defaultMappings)
            });
        }
    }

    handleDialogButton(cb) {
        const { dialog, mappings } = this.state;
        const { path } = dialog;
        this.setState({
            dialogOpen: false,
            mappings: Object.assign({}, defaultMappings)
        });
        if (cb) {
            cb(path, mappings);
        }
        Object.assign(dialog, {
            title: '',
            message: '',
            leftLabel: '',
            rightLabel: '',
            onLeftLabel: null,
            onRightLabel: null,
            fields: null,
            path: null
        });
    }

    dialogActions() {
        const { dialog } = this.state;
        const actions = [];
        if (dialog.leftLabel) {
            actions.push(
                <FlatButton
                    label={dialog.leftLabel}
                    key="dialogLeft"
                    onTouchTap={this.handleDialogButton.bind(
                        this,
                        dialog.onLeftLabel
                    )}
                />
            );
        }
        if (dialog.rightLabel) {
            actions.push(
                <FlatButton
                    label={dialog.rightLabel}
                    key="dialogRight"
                    primary={true}
                    onTouchTap={this.handleDialogButton.bind(
                        this,
                        dialog.onRightLabel
                    )}
                />
            );
        }
        return actions;
    }

    onChoice(prop, e, i, choice) {
        const { mappings } = this.state;
        mappings[prop] = choice;
        this.forceUpdate();
    }

    columns(prop) {
        const { dialog, mappings } = this.state,
            { fields } = dialog;
        const map = (f, i) => {
            return <MenuItem key={f} value={i} primaryText={f} />;
        };
        if (fields) {
            return (
                <SelectField
                    value={mappings[prop]}
                    floatingLabelText="Column Name"
                    onChange={this.onChoice.bind(this, prop)}>
                    <MenuItem value={-1} primaryText="" />
                    {fields.map(map)}
                </SelectField>
            );
        }
    }

    render() {
        return (
            <Dialog
                title={this.state.dialog.title}
                autoScrollBodyContent={true}
                actions={this.dialogActions()}
                modal={true}
                bodyStyle={{ padding: '0px 18px' }}
                open={this.state.dialogOpen}>
                <Table selectable={false}>
                    <TableHeader
                        adjustForCheckbox={false}
                        displaySelectAll={false}
                        enableSelectAll={false}>
                        <TableRow>
                            <TableHeaderColumn>
                                Entry Field Name
                            </TableHeaderColumn>
                            <TableHeaderColumn>
                                CSV File Column
                            </TableHeaderColumn>
                        </TableRow>
                    </TableHeader>
                    <TableBody displayRowCheckbox={false}>
                        <TableRow selectable={false}>
                            <TableRowColumn>Title</TableRowColumn>
                            <TableRowColumn>
                                {this.columns('title')}
                            </TableRowColumn>
                        </TableRow>
                        <TableRow selectable={false}>
                            <TableRowColumn>URL</TableRowColumn>
                            <TableRowColumn>
                                {this.columns('url')}
                            </TableRowColumn>
                        </TableRow>
                        <TableRow selectable={false}>
                            <TableRowColumn>Username</TableRowColumn>
                            <TableRowColumn>
                                {this.columns('username')}
                            </TableRowColumn>
                        </TableRow>
                        <TableRow selectable={false}>
                            <TableRowColumn>Email</TableRowColumn>
                            <TableRowColumn>
                                {this.columns('email')}
                            </TableRowColumn>
                        </TableRow>
                        <TableRow selectable={false}>
                            <TableRowColumn>Password</TableRowColumn>
                            <TableRowColumn>
                                {this.columns('password')}
                            </TableRowColumn>
                        </TableRow>
                        <TableRow selectable={false}>
                            <TableRowColumn>Notes</TableRowColumn>
                            <TableRowColumn>
                                {this.columns('notes')}
                            </TableRowColumn>
                        </TableRow>
                    </TableBody>
                </Table>
            </Dialog>
        );
    }
}

export default DataMapperDialog;
