import React, { Component, PureComponent } from 'react';
import AppBar from 'material-ui/AppBar';
import FlatButton from 'material-ui/FlatButton';
import FontIcon from 'material-ui/FontIcon';
import S from '../store/Store';

const addIcon = (
    <FontIcon style={{ fontSize: '18px' }} className="material-icons">
        add
    </FontIcon>
);
const entriesTitles = ['All', 'Favorites', 'Settings'];

class EntriesAppBar extends PureComponent {
    state = {
        filter: 0
    };

    constructor(props) {
        super(props);
        this.onFilter = this.onFilter.bind(this);
        this.state.filter = S.get('entries.filter', this.state.filter);
        S.on('set.entries.filter', this.onFilter);
    }

    componentWillUnmount() {
        S.off('set.entries.filter', this.onFilter);
    }

    onFilter(filter) {
        this.setState({
            filter: filter
        });
    }

    render() {
        const title = entriesTitles[this.state.filter];
        return (
            <AppBar
                title={title}
                style={{ position: 'fixed', top: '0', paddingRight: '40px' }}
                onLeftIconButtonTouchTap={this.props.handleToggle}
                onRightIconButtonTouchTap={this.props.handleAdd}
                iconElementRight={<FlatButton icon={addIcon} label="Add" />}
            />
        );
    }
}

export default EntriesAppBar;
