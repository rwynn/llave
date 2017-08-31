import React, { Component, PureComponent } from 'react';
import muiThemeable from 'material-ui/styles/muiThemeable';
import S from '../store/Store';
const { ipcRenderer } = window.require('electron');

class PoweredBy extends PureComponent {
    state = {
        version: ''
    };

    constructor(props) {
        super(props);
        this.onReply = this.onReply.bind(this);
        this.state.version = S.get('ironclad-version', '', true);
        ipcRenderer.on('ironclad-reply', this.onReply);
    }

    onReply(e, payload) {
        const cmd = payload.cmd,
            code = payload.code;
        if (cmd === '--version' && code === 0) {
            S.set('ironclad-version', payload.data, true);
            this.setState({
                version: payload.data
            });
        }
    }

    componentDidMount() {
        ipcRenderer.send('ironclad', ['--version']);
    }

    componentWillUnmount() {
        ipcRenderer.removeListener('ironclad-reply', this.onReply);
    }

    render() {
        const { version } = this.state;
        const { textColor, accent1Color } = this.props.muiTheme.palette;
        return (
            <div>
                <span style={{ fontSize: '16px', color: textColor }}>
                    llave powered by{' '}
                </span>
                <span style={{ fontSize: '18px', color: accent1Color }}>
                    Ironclad {version}
                </span>
            </div>
        );
    }
}

export default muiThemeable()(PoweredBy);
