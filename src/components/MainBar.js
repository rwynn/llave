import React, { Component, PureComponent } from 'react';
import Snackbar from 'material-ui/Snackbar';
import S from '../store/Store';

class MainBar extends PureComponent {
    state = {
        snackMessage: ''
    };

    constructor(props) {
        super(props);
        this.onSnack = this.onSnack.bind(this);
        S.on('set.snack.message', this.onSnack);
    }

    componentWillUnmount() {
        S.removeListener('set.snack.message', this.onSnack);
    }

    onSnack(message) {
        this.setState({
            snackOpen: true,
            snackMessage: message
        });
    }

    render() {
        return (
            <Snackbar
                open={this.state.snackOpen}
                message={this.state.snackMessage}
                autoHideDuration={1200}
                onRequestClose={reason => this.setState({ snackOpen: false })}
            />
        );
    }
}

export default MainBar;
