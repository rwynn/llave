import React, { Component, PureComponent } from 'react';
import AppBar from 'material-ui/AppBar';
import { Card, CardActions, CardHeader, CardText } from 'material-ui/Card';
import DatabaseForm from './DatabaseForm';

class Database extends PureComponent {
    render() {
        return (
            <div>
                <AppBar
                    title="Database"
                    style={{ position: 'fixed', top: '0' }}
                    showMenuIconButton={false}
                />
                <div className="inner">
                    <br />
                    <Card initiallyExpanded={true}>
                        <CardText expandable={false}>
                            <DatabaseForm history={this.props.history} />
                        </CardText>
                    </Card>
                </div>
            </div>
        );
    }
}

export default Database;
