import { App as BaseApp } from '../App';
import React, { Component, PureComponent } from 'react';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import { HashRouter as Router, Route, Link } from 'react-router-dom';
import BottomNav from '../BottomNav';
import MainMenu from './MainMenu';
import MainBar from '../MainBar';
import MainDialog from '../MainDialog';
import Details from './Details';
import Database from './Database';
import Entries from './Entries';
import Settings from './Settings';

class App extends BaseApp {
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
                            <Route
                                exact
                                path="/details/:id"
                                component={Details}
                            />
                            <Route path="/settings" component={Settings} />
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

export default App;
