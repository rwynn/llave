import React from 'react';
import { render } from 'react-dom';
import WebShim from './components/web/WebShim';
import App from './components/web/App';
import injectTapEventPlugin from 'react-tap-event-plugin';

injectTapEventPlugin();

render(<App />, document.getElementById('root'));
