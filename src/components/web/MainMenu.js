import React, { Component, PureComponent } from 'react';
import { MainMenu as BaseMainMenu } from '../MainMenu';
import MenuItem from 'material-ui/MenuItem';
import Menu from 'material-ui/Menu';
import FontIcon from 'material-ui/FontIcon';

const lockIcon = (
    <FontIcon style={{ fontSize: '18px' }} className="material-icons">
        lock_outline
    </FontIcon>
);

class MainMenu extends BaseMainMenu {
    menu() {
        return (
            <Menu>
                <MenuItem
                    onTouchTap={this.switchDatabase}
                    leftIcon={lockIcon}
                    value={true}
                    primaryText="Lock Database"
                />
            </Menu>
        );
    }
}

export default MainMenu;
