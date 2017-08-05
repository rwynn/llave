import React, { Component, PureComponent } from 'react';
import Snackbar from 'material-ui/Snackbar';
import { List, ListItem } from 'material-ui/List';
import Infinite from 'react-infinite';
import Avatar from 'material-ui/Avatar';
import IconButton from 'material-ui/IconButton';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import Divider from 'material-ui/Divider';
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';
import { lightBlue800, grey400, transparent } from 'material-ui/styles/colors';
import S from '../store/Store';
import NotFound from './NotFound';

const Letter = letter =>
    <Avatar
        color={lightBlue800}
        backgroundColor={transparent}
        style={{ left: 8 }}>
        {letter}
    </Avatar>;

const { ipcRenderer } = window.require('electron');

const iconButtonElement = (
    <IconButton touch={true} tooltip="more" tooltipPosition="bottom-left">
        <MoreVertIcon color={grey400} />
    </IconButton>
);

class EntriesList extends PureComponent {
    state = {
        snackOpen: false,
        filter: 0,
        queryFilter: null,
        querySortPredicate: null,
        snackMessage: '',
        entries: []
    };

    initComplete = false;

    constructor(props) {
        super(props);
        this.entry = this.entry.bind(this);
        this.filterPredicate = this.filterPredicate.bind(this);
        this.onEntries = this.onEntries.bind(this);
        this.onFilter = this.onFilter.bind(this);
        this.sortPredicate = this.sortPredicate.bind(this);
        this.onQueryFilter = this.onQueryFilter.bind(this);
        this.onQuerySortPredicate = this.onQuerySortPredicate.bind(this);
        this.state.entries = S.get('entries', this.state.entries);
        this.state.filter = S.get('entries.filter', this.state.filter);
        this.state.queryFilter = S.get(
            'entries.query.filter',
            this.state.queryFilter
        );
        this.state.querySortPredicate = S.get(
            'entries.query.sort',
            this.state.querySortPredicate
        );
        S.on('set.entries', this.onEntries);
        S.on('set.entries.filter', this.onFilter);
        S.on('set.entries.query.filter', this.onQueryFilter);
        S.on('set.entries.query.sort', this.onQuerySortPredicate);
    }

    componentDidMount() {
        ipcRenderer.send('ironclad', ['dump']);
    }

    componentWillUnmount() {
        S.off('set.entries', this.onEntries);
        S.off('set.entries.filter', this.onFilter);
        S.off('set.entries.query.filter', this.onQueryFilter);
        S.off('set.entries.query.sort', this.onQuerySortPredicate);
    }

    onQuerySortPredicate(querySortPredicate) {
        this.setState({
            querySortPredicate: querySortPredicate
        });
    }

    onQueryFilter(queryFilter) {
        this.setState({
            queryFilter: queryFilter
        });
    }

    onFilter(filter) {
        this.setState({
            filter: filter
        });
    }

    onEntries(entries) {
        this.initComplete = true;
        this.setState({
            entries: entries
        });
    }

    copyUser(e) {
        if (this.snackTimer) {
            clearTimeout(this.snackTimer);
            this.snackTimer = null;
        }
        ipcRenderer.send('ironclad', ['user', '-p', e.id], { clipboard: true });
        ipcRenderer.once('ironclad-reply', (ev, payload) => {
            const cmd = payload.cmd,
                code = payload.code;
            if (cmd === 'user') {
                this.setState({
                    snackOpen: true,
                    snackMessage:
                        code === 0
                            ? `User name for ${e.title} sent to the clipboard`
                            : 'Failed to copy user name to clipboard'
                });
                if (code === 0) {
                    this.snackTimer = setTimeout(() => {
                        this.setState({
                            snackMessage:
                                'The clipboard will be cleared in 10 seconds'
                        });
                    }, 1500);
                } else {
                }
            }
        });
    }

    copyPassword(e) {
        if (this.snackTimer) {
            clearTimeout(this.snackTimer);
            this.snackTimer = null;
        }
        ipcRenderer.send('ironclad', ['pass', '-p', e.id], { clipboard: true });
        ipcRenderer.once('ironclad-reply', (ev, payload) => {
            const cmd = payload.cmd,
                code = payload.code;
            if (cmd === 'pass') {
                this.setState({
                    snackOpen: true,
                    snackMessage:
                        code === 0
                            ? `Password for ${e.title} sent to the clipboard`
                            : 'Failed to copy password to clipboard'
                });
                if (code === 0) {
                    this.snackTimer = setTimeout(() => {
                        this.setState({
                            snackMessage:
                                'The clipboard will be cleared in 10 seconds'
                        });
                    }, 1500);
                } else {
                }
            }
        });
    }

    deleteEntry(e) {
        const { entries } = this.state,
            index = entries.indexOf(e);
        ipcRenderer.send('ironclad', ['delete', e.id], { input: ['y'] });
        ipcRenderer.once('ironclad-reply', (ev, payload) => {
            const cmd = payload.cmd,
                code = payload.code;
            if (cmd === 'delete') {
                if (code === 0) {
                    entries.splice(index, 1);
                }
                this.setState({
                    entries: entries,
                    snackOpen: true,
                    snackMessage:
                        code === 0
                            ? `${e.title} moved to the Recycle Bin`
                            : 'Failed to delete entry'
                });
            }
        });
    }

    restoreEntry(e) {
        const { title } = e;
        ipcRenderer.send('restore-entry', e.id);
        ipcRenderer.once('restore-entry-reply', (e, payload) => {
            const code = payload.code,
                msg =
                    code === 0
                        ? `${title} has been restored`
                        : 'Failed to restore entry';
            S.set('snack.message', msg);
        });
    }

    showDetails(e) {
        if (e.active) {
            const { history } = this.props;
            history.push(`/details/${e.id}`);
        }
    }

    editEntry(e) {
        const { history } = this.props;
        history.push(`/edit/${e.id}`);
    }

    entry(e) {
        const { querySortPredicate } = this.state;
        const hasPass = e.passwords.reduce((a, p) => {
            return a || p;
        }, false);
        const key = e.id.toString();
        const l = e.title.charAt(0).toUpperCase();
        const letter = Letter(l);
        const rightIconMenu = e.active
            ? <IconMenu iconButtonElement={iconButtonElement}>
                  {e.username
                      ? <MenuItem onTouchTap={this.copyUser.bind(this, e)}>
                            Copy User
                        </MenuItem>
                      : null}
                  {hasPass
                      ? <MenuItem onTouchTap={this.copyPassword.bind(this, e)}>
                            Copy Password
                        </MenuItem>
                      : null}
                  <MenuItem onTouchTap={this.editEntry.bind(this, e)}>
                      Edit
                  </MenuItem>
                  <MenuItem onTouchTap={this.deleteEntry.bind(this, e)}>
                      Delete
                  </MenuItem>
              </IconMenu>
            : <IconMenu iconButtonElement={iconButtonElement}>
                  <MenuItem onTouchTap={this.restoreEntry.bind(this, e)}>
                      Restore
                  </MenuItem>
              </IconMenu>;
        let divider = null,
            repeat = false;
        if (!querySortPredicate) {
            repeat = this.letters.seen[l];
            if (this.letters.has && !repeat) {
                divider = <Divider inset={true} />;
            }
            this.letters.has = true;
            this.letters.seen[l] = true;
        }
        return (
            <div key={key}>
                {divider}
                <ListItem
                    onTouchTap={this.showDetails.bind(this, e)}
                    leftAvatar={repeat ? undefined : letter}
                    insetChildren={repeat}
                    rightIconButton={rightIconMenu}
                    primaryText={e.title}
                    secondaryText={e.url}
                />
            </div>
        );
    }

    sortPredicate(a, b) {
        const { querySortPredicate } = this.state;
        if (querySortPredicate) {
            return querySortPredicate(a, b);
        } else {
            const ta = a.title.toUpperCase(),
                tb = b.title.toUpperCase();
            return ta.localeCompare(tb);
        }
    }

    activeFilter(e) {
        return e.active;
    }

    filterPredicate(e) {
        const { queryFilter, filter } = this.state,
            { tags } = e;
        if (filter === 1) {
            if (tags.indexOf('favorite') === -1) {
                return false;
            }
        }
        if (queryFilter && !queryFilter(e)) {
            return false;
        }
        return this.activeFilter(e);
    }

    filter() {
        const { entries } = this.state;
        return entries.filter(this.filterPredicate);
    }

    render() {
        this.letters = {
            favs: false,
            seen: {}
        };
        const filtered = this.filter(),
            sorted = filtered.sort(this.sortPredicate),
            entries = sorted.map(this.entry);

        const notFoundMsg =
            this.state.filter === 0 ? 'No entries found' : 'No favorites found';

        const placeholder = this.initComplete
            ? <NotFound message={notFoundMsg} />
            : <div />;

        const content =
            entries.length === 0
                ? placeholder
                : <List>
                      <Infinite
                          useWindowAsScrollContainer
                          containerHeight={72 * 10}
                          elementHeight={72}>
                          {entries}
                      </Infinite>
                  </List>;

        return (
            <div>
                {content}
                <Snackbar
                    open={this.state.snackOpen}
                    message={this.state.snackMessage}
                    autoHideDuration={1200}
                    onRequestClose={reason =>
                        this.setState({ snackOpen: false })}
                />
            </div>
        );
    }
}

export default EntriesList;
