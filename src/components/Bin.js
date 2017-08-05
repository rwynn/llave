import React, { Component, PureComponent } from 'react';
import AppBar from 'material-ui/AppBar';
import FlatButton from 'material-ui/FlatButton';
import FontIcon from 'material-ui/FontIcon';
import { Card, CardActions, CardHeader, CardText } from 'material-ui/Card';
import MenuItem from 'material-ui/MenuItem';
import TextField from 'material-ui/TextField';
import BinList from './BinList';
import S from '../store/Store';

const { ipcRenderer } = window.require('electron');

const deleteIcon = (
    <FontIcon style={{ fontSize: '18px' }} className="material-icons">
        delete
    </FontIcon>
);

class Bin extends PureComponent {
    constructor(props) {
        super(props);
        this.handleMenu = this.handleMenu.bind(this);
        this.searchChanged = this.searchChanged.bind(this);
        this.focusSearch = this.focusSearch.bind(this);
        this.purgeDatabase = this.purgeDatabase.bind(this);
    }

    componentWillUnmount() {
        this.resetSearch();
    }

    componentDidMount() {
        this.focusSearch();
    }

    focusSearch() {
        const { search } = this.refs;
        search.focus();
    }

    handleMenu() {
        S.set('menu.main', true);
    }

    resetSearch() {
        S.set('entries.query.filter', null);
        S.set('entries.query.sort', null);
    }

    searchChanged(e) {
        const target = e.target,
            searchTimeout = this.searchTimeout;
        searchTimeout && clearTimeout(searchTimeout);
        this.searchTimeout = setTimeout(
            function() {
                if (target) {
                    this.sendSearch(target.value);
                } else {
                    this.resetSearch();
                }
            }.bind(this),
            400
        );
    }

    sendSearch(query) {
        if (query) {
            ipcRenderer.send('search', query);
        } else {
            this.resetSearch();
        }
    }

    purgeDatabase() {
        ipcRenderer.send('ironclad', ['purge']);
        ipcRenderer.once('ironclad-reply', (ev, payload) => {
            const cmd = payload.cmd,
                code = payload.code;
            if (cmd === 'purge') {
                const msg =
                    code === 0
                        ? 'Deleted entries have been purged'
                        : 'Failed to purge deleted entries';
                S.set('menu.main', false);
                S.set('snack.message', msg);
                if (code === 0) {
                    ipcRenderer.send('ironclad', ['dump']);
                }
            }
        });
    }

    render() {
        return (
            <div>
                <AppBar
                    title="Recycle Bin"
                    style={{
                        position: 'fixed',
                        top: '0',
                        paddingRight: '40px'
                    }}
                    onLeftIconButtonTouchTap={this.handleMenu}
                    onRightIconButtonTouchTap={this.purgeDatabase}
                    iconElementRight={
                        <FlatButton icon={deleteIcon} label="Empty Bin" />
                    }
                />
                <div className="inner">
                    <br />
                    <Card initiallyExpanded={true}>
                        <CardText expandable={false}>
                            <TextField
                                onChange={this.searchChanged}
                                ref="search"
                                fullWidth={true}
                                floatingLabelText="Search Bin"
                                hintText="Search Bin"
                            />
                        </CardText>
                    </Card>
                    <br />
                    <Card initiallyExpanded={true}>
                        <CardText expandable={false}>
                            <BinList history={this.props.history} />
                        </CardText>
                    </Card>
                </div>
            </div>
        );
    }
}

export default Bin;
