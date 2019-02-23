import React, { Component, PureComponent } from 'react';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import TextField from 'material-ui/TextField';
import S from '../store/Store';

class ChangePassDialog extends PureComponent {
    state = {
        dialogOpen: false,
        err: null,
        dialog: {
            title: '',
            message: '',
            leftLabel: '',
            rightLabel: '',
            onLeftLabel: null,
            onRightLabel: null
        }
    };

    constructor(props) {
        super(props);
        this.onDialog = this.onDialog.bind(this);
        this.handlePress = this.handlePress.bind(this);
        this.handleChange = this.handleChange.bind(this);
        S.on('set.dialog.changepass', this.onDialog);
    }

    componentWillUnmount() {
        S.removeListener('set.dialog.changepass', this.onDialog);
    }

    onDialog(dialog) {
        if (dialog) {
            this.setState({
                dialogOpen: true,
                dialog: dialog
            });
        } else {
            this.setState({
                dialogOpen: false
            });
        }
        setTimeout(
            function() {
                const { pass1 } = this.refs;
                if (pass1) {
                    const { input } = pass1;
                    input.focus();
                }
            }.bind(this),
            200
        );
    }

    handleChange(ev) {
        const { err } = this.state;
        if (err) {
            this.setState({
                err: null
            });
        }
    }

    handlePress(ev) {
        if (ev.key === 'Enter') {
            const { dialog } = this.state;
            if (dialog.onRightLabel) {
                this.handleDialogButton(dialog.onRightLabel);
            }
        }
    }

    handleDialogButton(cb) {
        if (cb) {
            const { pass1, pass2 } = this.refs;
            const p1 = pass1.input.value,
                p2 = pass2.input.value;
            if (!p1 || !p2) {
                this.setState({
                    err: 'Passwords cannot be empty'
                });
                return;
            }
            if (p1 !== p2) {
                this.setState({
                    err: 'Passwords do not match'
                });
                return;
            }
            cb(p1);
        }
        const { dialog } = this.state;
        this.setState({
            dialogOpen: false,
            err: null
        });
        Object.assign(dialog, {
            title: '',
            message: '',
            leftLabel: '',
            rightLabel: '',
            onLeftLabel: null,
            onRightLabel: null,
            err: null
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

    render() {
        return (
            <Dialog
                title={this.state.dialog.title}
                actions={this.dialogActions()}
                modal={true}
                open={this.state.dialogOpen}>
                {this.state.dialog.message}
                <TextField
                    ref="pass1"
                    errorText={this.state.err}
                    onKeyPress={this.handlePress}
                    onChange={this.handleChange}
                    name="pass1"
                    type="password"
                    fullWidth={true}
                    floatingLabelText="New password"
                    hintText="Enter new password"
                />
                <TextField
                    ref="pass2"
                    errorText={this.state.err}
                    onKeyPress={this.handlePress}
                    onChange={this.handleChange}
                    name="pass2"
                    type="password"
                    fullWidth={true}
                    floatingLabelText="New password again"
                    hintText="Enter new password again"
                />
            </Dialog>
        );
    }
}

export default ChangePassDialog;
