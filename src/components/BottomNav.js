import React, { Component } from 'react';
import FontIcon from 'material-ui/FontIcon';
import {
    BottomNavigation,
    BottomNavigationItem
} from 'material-ui/BottomNavigation';
import Paper from 'material-ui/Paper';
import S from '../store/Store';

const allIcon = <FontIcon className="material-icons">list</FontIcon>;
const favoritesIcon = <FontIcon className="material-icons">favorite</FontIcon>;
const settingsIcon = <FontIcon className="material-icons">settings</FontIcon>;

/**
 * A simple example of `BottomNavigation`, with three labels and icons
 * provided. The selected `BottomNavigationItem` is determined by application
 * state (for instance, by the URL).
 */
class BottomNav extends Component {
    state = {
        selectedIndex: 0
    };

    constructor(props) {
        super(props);
        this.onCloseSettings = this.onCloseSettings.bind(this);
        S.on('set.settings.close', this.onCloseSettings);
    }

    componentWillUnmount() {
        S.off('set.settings.close', this.onCloseSettings);
    }

    componentWillReceiveProps(nextProps) {
        const { history } = this.props,
            { location } = history,
            { pathname } = location;
        if (pathname === '/bin') {
            S.set('entries.filter', 0);
            this.setState({
                selectedIndex: null
            });
        }
    }

    onCloseSettings() {
        this.select(0);
    }

    select = index => {
        const { history } = this.props,
            { selectedIndex } = this.state;
        history.push(index === 2 ? '/settings' : '/entries');
        if (index !== selectedIndex) {
            this.setState({ selectedIndex: index });
            if (index !== 2) {
                S.set('entries.filter', index);
            }
        }
    };

    render() {
        return (
            <Paper zDepth={1}>
                <BottomNavigation selectedIndex={this.state.selectedIndex}>
                    <BottomNavigationItem
                        label="All"
                        icon={allIcon}
                        onTouchTap={() => this.select(0)}
                    />
                    <BottomNavigationItem
                        label="Favorites"
                        icon={favoritesIcon}
                        onTouchTap={() => this.select(1)}
                    />
                    <BottomNavigationItem
                        label="Settings"
                        icon={settingsIcon}
                        onTouchTap={() => this.select(2)}
                    />
                </BottomNavigation>
            </Paper>
        );
    }
}

export default BottomNav;
