import muiThemeable from 'material-ui/styles/muiThemeable';
import React, { Component, PureComponent } from 'react';
import { Settings as BaseSettings } from '../Settings';

class Settings extends BaseSettings {
    passwordSettingsCard() {
        return null;
    }
}

export default muiThemeable()(Settings);
