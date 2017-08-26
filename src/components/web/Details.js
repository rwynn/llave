import muiThemeable from 'material-ui/styles/muiThemeable';
import React, { Component, PureComponent } from 'react';
import { Details as BaseDetails } from '../Details';
import FlatButton from 'material-ui/FlatButton';
import FontIcon from 'material-ui/FontIcon';

const closeIcon = (
    <FontIcon style={{ fontSize: '18px' }} className="material-icons">
        close
    </FontIcon>
);

class Details extends BaseDetails {
    deleteIcon() {
        return null;
    }

    barChildren() {
        return [
            <FlatButton
                key="close"
                onTouchTap={this.handleClose}
                icon={closeIcon}
                style={this.titleButtonStyle}
                label="Close"
            />
        ];
    }
}

export default muiThemeable()(Details);
