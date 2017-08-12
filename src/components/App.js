import '../assets/stylesheets/base.scss';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import darkBaseTheme from 'material-ui/styles/baseThemes/darkBaseTheme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import {
    lightBlue300,
    lightBlue400,
    lightBlue800,
    lightBlue900
} from 'material-ui/styles/colors';
import React, { Component, PureComponent } from 'react';
import BottomNav from './BottomNav';
import MainMenu from './MainMenu';
import MainBar from './MainBar';
import MainDialog from './MainDialog';
import Add from './Add';
import Details from './Details';
import Edit from './Edit';
import Database from './Database';
import Entries from './Entries';
import Bin from './Bin';
import Settings from './Settings';
import S from '../store/Store';
import { HashRouter as Router, Route, Link } from 'react-router-dom';

const { ipcRenderer } = window.require('electron');

class App extends PureComponent {
    state = {
        darkTheme: false
    };

    defaultAutoLock = {
        enabled: true,
        timeout: 5
    };

    constructor(props) {
        super(props);
        const theme = S.get('settings.theme', null, true);
        if (theme) {
            this.state.darkTheme = theme.dark === true;
        }
        this.autoLockChanged = this.autoLockChanged.bind(this);
        this.themeChanged = this.themeChanged.bind(this);
        this.updateTimer = this.updateTimer.bind(this);
        this.lockDatabase = this.lockDatabase.bind(this);
        this.autoLock = Object.assign({}, this.defaultAutoLock);
        this.onStorageGet = this.onStorageGet.bind(this);
        this.respond = this.respond.bind(this);
        this.doSearch = this.doSearch.bind(this);
    }

    componentDidMount() {
        S.on('set.settings.autolock', this.autoLockChanged);
        S.on('set.settings.theme', this.themeChanged);
        ipcRenderer.on('store-get-reply', this.onStorageGet);
        ipcRenderer.on('ironclad-reply', this.respond);
        ipcRenderer.on('search-reply', this.doSearch);
        ipcRenderer.send('ironclad', ['config', 'timeout', 0]);
        ipcRenderer.send('store-get');
    }

    componentWillUnmount() {
        S.removeListener('set.settings.autolock', this.autoLockChanged);
        S.removeListener('set.settings.theme', this.themeChanged);
        ipcRenderer.removeListener('store-get-reply', this.onStorageGet);
        ipcRenderer.removeListener('ironclad-reply', this.respond);
        ipcRenderer.removeListener('search-reply', this.doSearch);
    }

    themeChanged(theme) {
        const op = theme.dark ? 'add' : 'remove';
        document.body.classList[op]('dark');
        this.setState({
            darkTheme: theme.dark
        });
    }

    theme() {
        const { darkTheme } = this.state,
            settings = {};
        if (darkTheme) {
            Object.assign(settings, darkBaseTheme);
            Object.assign(settings.palette, {
                primary1Color: lightBlue300,
                primary2Color: lightBlue400,
                pickerHeaderColor: lightBlue400
            });
        } else {
            Object.assign(settings, {
                palette: {
                    primary1Color: lightBlue800,
                    primary2Color: lightBlue900,
                    pickerHeaderColor: lightBlue800
                }
            });
        }
        Object.assign(settings, {
            fontFamily: 'Lato, sans-serif'
        });
        const muiTheme = getMuiTheme(settings);
        return muiTheme;
    }

    lockDatabase() {
        S.set('database.locked', true);
    }

    autoLockChanged(autoLock) {
        this.autoLock = Object.assign({}, this.defaultAutoLock, autoLock);
        this.updateTimer();
    }

    updateTimer() {
        const { autoLock, lockTimeout } = this;
        if (lockTimeout) {
            clearTimeout(lockTimeout);
            this.lockTimout = null;
        }
        if (autoLock.enabled) {
            if (autoLock.timeout > 0) {
                const timeout = 1000 * 60 * autoLock.timeout;
                this.lockTimeout = setTimeout(this.lockDatabase, timeout);
            }
        }
    }

    onStorageGet(e, reply) {
        const { code, err, data } = reply;
        if (code === 0) {
            const { autoLock, theme } = data;
            if (autoLock) {
                S.set('settings.autolock', autoLock);
                this.autoLock = Object.assign(
                    {},
                    this.defaultAutoLock,
                    autoLock
                );
            } else {
                this.autoLock = Object.assign({}, this.defaultAutoLock);
            }
            if (theme) {
                S.set('settings.theme', theme, true);
            }
        } else {
            this.autoLock = Object.assign({}, this.defaultAutoLock);
        }
        this.updateTimer();
    }

    matchSomeQueryFilter(e) {
        return this.indexOf(e.id) !== -1;
    }

    querySortPredicate(a, b) {
        const sa = this['' + a.id],
            sb = this['' + b.id];
        if (sa > sb) return -1;
        if (sa < sb) return 1;
        return 0;
    }

    doSearch(ev, payload) {
        const refs = payload.map(function(m) {
            return parseInt(m.ref, 10);
        });
        const scores = payload.reduce(function(acc, m) {
            acc[m.ref] = m.score;
            return acc;
        }, {});
        S.set('entries.query.filter', this.matchSomeQueryFilter.bind(refs));
        S.set('entries.query.sort', this.querySortPredicate.bind(scores));
    }

    respond(e, payload) {
        const cmd = payload.cmd,
            status = payload.code === 0 ? 'ok' : 'fail',
            fun = `${cmd}_cmd_${status}`,
            handler = this[fun];
        if (handler) {
            handler.call(this, payload);
        }
    }

    init_cmd_ok(payload) {
        S.set('config', {
            file: payload.args[1]
        });
    }

    dump_cmd_ok(payload) {
        const { entries } = payload.data;
        S.set('entries', entries);
    }

    config_cmd_ok(payload) {
        if (payload.args.length === 1) {
            S.set('config', payload.data);
        } else if (payload.args.length === 3) {
            const [command, prop, val] = payload.args;
            if (prop === 'file') {
                S.set('config', {
                    file: val
                });
            }
        }
    }

    bottomnav({ match, history, ...rest }) {
        return match === null ? <BottomNav history={history} /> : <div />;
    }

    render() {
        return (
            <MuiThemeProvider muiTheme={this.theme()}>
                <Router>
                    <div
                        onKeyPress={this.updateTimer}
                        onMouseMove={this.updateTimer}>
                        <Route component={MainMenu} />
                        <Route component={MainBar} />
                        <Route component={MainDialog} />
                        <div id="content">
                            <Route exact path="/" component={Database} />
                            <Route exact path="/entries" component={Entries} />
                            <Route exact path="/bin" component={Bin} />
                            <Route exact path="/add" component={Add} />
                            <Route
                                exact
                                path="/details/:id"
                                component={Details}
                            />
                            <Route exact path="/edit/:id" component={Edit} />
                            <Route
                                exact
                                path="/edit/:id/:from"
                                component={Edit}
                            />
                            <Route path="/settings" component={Settings} />
                            <Route path="/topics" component={Topics} />
                        </div>
                        <div id="footer">
                            <Route
                                exact
                                path="/"
                                children={this.bottomnav.bind(this)}
                            />
                        </div>
                    </div>
                </Router>
            </MuiThemeProvider>
        );
    }
}

const Topics = ({ match }) =>
    <div>
        <h2>Topics</h2>
        <ul>
            <li>
                <Link to={`${match.url}/rendering`}>Rendering with React</Link>
            </li>
            <li>
                <Link to={`${match.url}/components`}>Components</Link>
            </li>
            <li>
                <Link to={`${match.url}/props-v-state`}>Props v. State</Link>
            </li>
        </ul>
        <Route path={`${match.url}/:topicId`} component={Topic} />
        <Route
            exact
            path={match.url}
            render={() => <h3>Please select a topic.</h3>}
        />
    </div>;

const Topic = ({ match }) =>
    <div>
        <h3>
            {match.params.topicId}
        </h3>
    </div>;

export default App;
