import React, { Component, PureComponent } from 'react';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import S from '../store/Store';

class MainDialog extends PureComponent {
    state = {
        dialogOpen: false,
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
        S.on('set.dialog', this.onDialog);
    }

    componentWillUnmount() {
        S.removeListener('set.dialog', this.onDialog);
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
    }

    handleDialogButton(cb) {
        const { dialog } = this.state;
        this.setState({
            dialogOpen: false
        });
        if (cb) {
            cb();
        }
        Object.assign(dialog, {
            title: '',
            message: '',
            leftLabel: '',
            rightLabel: '',
            onLeftLabel: null,
            onRightLabel: null
        });
    }

    dialogActions() {
        const { dialog } = this.state;
        const actions = [
            <FlatButton
                label={dialog.leftLabel}
                primary={true}
                onTouchTap={this.handleDialogButton.bind(
                    this,
                    dialog.onLeftLabel
                )}
            />,
            <FlatButton
                label={dialog.rightLabel}
                primary={true}
                onTouchTap={this.handleDialogButton.bind(
                    this,
                    dialog.onRightLabel
                )}
            />
        ];
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
            </Dialog>
        );
    }
}

export default MainDialog;
