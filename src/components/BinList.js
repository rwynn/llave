import { EntriesList } from './EntriesList';
import muiThemeable from 'material-ui/styles/muiThemeable';

class BinList extends EntriesList {
    activeFilter(e) {
        return !e.active;
    }
}

export default muiThemeable()(BinList);
