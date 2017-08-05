import React, { Component, PureComponent } from 'react';
import FontIcon from 'material-ui/FontIcon';
import { grey400 } from 'material-ui/styles/colors';

const faceIcon = (
    <FontIcon
        style={{ color: grey400, margin: 'auto', fontSize: '64px' }}
        className="material-icons">
        sentiment_neutral
    </FontIcon>
);

class NotFound extends PureComponent {
    rootStyles = {
        display: 'flex',
        padding: '50px 0px',
        'flex-direction': 'column',
        'align-items': 'center'
    };

    render() {
        return (
            <div style={this.rootStyles}>
                {faceIcon}
                <p style={{ color: grey400, margin: 'auto' }}>
                    {this.props.message}
                </p>
            </div>
        );
    }
}

export default NotFound;
