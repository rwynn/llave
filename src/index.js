import React from 'react';
import { render } from 'react-dom';
import App from './components/App';
import injectTapEventPlugin from 'react-tap-event-plugin';

injectTapEventPlugin();

render(<App name="World" />, document.getElementById('root'));
