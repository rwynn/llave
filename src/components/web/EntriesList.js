import muiThemeable from 'material-ui/styles/muiThemeable';
import React, { Component, PureComponent } from 'react';
import { EntriesList as BaseEntriesList } from '../EntriesList';
import IconButton from 'material-ui/IconButton';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';
import { grey400, transparent } from 'material-ui/styles/colors';

const iconButtonElement = (
    <IconButton touch={true} tooltip="more" tooltipPosition="bottom-left">
        <MoreVertIcon color={grey400} />
    </IconButton>
);

class EntriesList extends BaseEntriesList {
    rightIconMenu(e) {
        const hasPass = e.passwords.reduce((a, p) => {
            return a || p;
        }, false);
        let rightIconMenu = null;
        let userItem,
            passwordItem,
            urlItem = null;
        if (e.username) {
            userItem = (
                <MenuItem onTouchTap={this.copyUser.bind(this, e)}>
                    Copy User
                </MenuItem>
            );
        }
        if (hasPass) {
            passwordItem = (
                <MenuItem onTouchTap={this.copyPassword.bind(this, e)}>
                    Copy Password
                </MenuItem>
            );
        }
        if (e.url) {
            urlItem = (
                <MenuItem onTouchTap={this.copyURL.bind(this, e)}>
                    Copy URL
                </MenuItem>
            );
        }
        rightIconMenu = (
            <IconMenu iconButtonElement={iconButtonElement}>
                {userItem}
                {passwordItem}
                {urlItem}
            </IconMenu>
        );
        return rightIconMenu;
    }
}

export default muiThemeable()(EntriesList);
