import React, { Component, PureComponent } from 'react';
import muiThemeable from 'material-ui/styles/muiThemeable';

class PoweredBy extends PureComponent {
    render() {
        const { textColor, accent1Color } = this.props.muiTheme.palette;
        return (
            <div>
                <span style={{ fontSize: '16px', color: textColor }}>
                    llave powered by{' '}
                </span>
                <span style={{ fontSize: '18px', color: accent1Color }}>
                    Web Crypto
                </span>
            </div>
        );
    }
}

export default muiThemeable()(PoweredBy);
