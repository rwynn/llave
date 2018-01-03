import React, { PureComponent } from 'react';

const imageURLBase = 'https://plus.google.com/_/favicon?domain_url=';

const Wrap = (url, style, onError) => {
    const favicon = url ? (
        <img
            style={style}
            onError={onError}
            src={imageURLBase + encodeURIComponent(url)}
        />
    ) : null;
    return favicon;
};

class Favicon extends PureComponent {
    state = {
        error: false
    };

    constructor(props) {
        super(props);
        this.onError = this.onError.bind(this);
    }

    onError() {
        this.setState({
            error: true
        });
    }

    render() {
        return this.state.error
            ? null
            : Wrap(this.props.url, this.props.style, this.onError);
    }
}

export default Favicon;
