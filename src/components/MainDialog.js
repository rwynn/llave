import React, { Component, PureComponent } from 'react';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';
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
            onRightLabel: null,
            choices: null,
            choicesLabel: null
        }
    };

    constructor(props) {
        super(props);
        this.onDialog = this.onDialog.bind(this);
        this.onChoice = this.onChoice.bind(this);
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
        const choice = dialog.choices ? dialog.choice : undefined;
        this.setState({
            dialogOpen: false
        });
        if (cb) {
            if (choice) {
                cb(choice);
            } else {
                cb();
            }
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
        const actions = [];
        if (dialog.leftLabel) {
            actions.push(
                <FlatButton
                    label={dialog.leftLabel}
                    key="dialogLeft"
                    primary={true}
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

    onChoice(e, i, choice) {
        const { dialog } = this.state;
        dialog.choice = choice;
        this.forceUpdate();
    }

    choices() {
        const { dialog } = this.state,
            { choices } = dialog;
        const map = c => {
            return <MenuItem key={c} value={c} primaryText={c} />;
        };
        if (choices) {
            return (
                <SelectField
                    value={dialog.choice}
                    floatingLabelText={dialog.choicesLabel}
                    fullWidth={true}
                    onChange={this.onChoice}>
                    {choices.map(map)}
                </SelectField>
            );
        }
    }

    render() {
        return (
            <Dialog
                title={this.state.dialog.title}
                actions={this.dialogActions()}
                modal={true}
                open={this.state.dialogOpen}>
                {this.state.dialog.message}
                {this.choices()}
            </Dialog>
        );
    }
}

export default MainDialog;
