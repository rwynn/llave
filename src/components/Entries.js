import React, { Component, PureComponent } from 'react';
import AppBar from 'material-ui/AppBar';
import { Card, CardActions, CardHeader, CardText } from 'material-ui/Card';
import MenuItem from 'material-ui/MenuItem';
import TextField from 'material-ui/TextField';
import EntriesList from './EntriesList';
import EntriesAppBar from './EntriesAppBar';
import S from '../store/Store';

const { ipcRenderer } = window.require('electron');

class Entries extends PureComponent {
    constructor(props) {
        super(props);
        this.handleToggle = this.handleToggle.bind(this);
        this.handleAdd = this.handleAdd.bind(this);
        this.searchChanged = this.searchChanged.bind(this);
        this.focusSearch = this.focusSearch.bind(this);
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

    handleToggle() {
        S.set('menu.main', true);
    }

    handleAdd() {
        const { history } = this.props;
        history.push('/add');
    }

    render() {
        return (
            <div>
                <EntriesAppBar
                    handleToggle={this.handleToggle}
                    handleAdd={this.handleAdd}
                />
                <div className="inner">
                    <br />
                    <Card initiallyExpanded={true}>
                        <CardText expandable={false}>
                            <TextField
                                onChange={this.searchChanged}
                                ref="search"
                                fullWidth={true}
                                floatingLabelText="Search Database"
                                hintText="Search Database"
                            />
                        </CardText>
                    </Card>
                    <br />
                    <Card initiallyExpanded={true}>
                        <CardText expandable={false}>
                            <EntriesList history={this.props.history} />
                        </CardText>
                    </Card>
                </div>
            </div>
        );
    }
}

export default Entries;
