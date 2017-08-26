import React, { Component, PureComponent } from 'react';
import { Entries as BaseEntries } from '../Entries';
import EntriesList from './EntriesList';
import EntriesAppBar from '../EntriesAppBar';

class Entries extends BaseEntries {
    entriesList() {
        return <EntriesList history={this.props.history} />;
    }

    focusSearch() {}

    appBar() {
        return (
            <EntriesAppBar handleToggle={this.handleToggle} handleAdd={null} />
        );
    }
}

export default Entries;
