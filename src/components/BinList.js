import EntriesList from './EntriesList';

class BinList extends EntriesList {
    activeFilter(e) {
        return !e.active;
    }
}

export default BinList;
