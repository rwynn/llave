import React, { Component, PureComponent } from 'react';
import Subheader from 'material-ui/Subheader';
import Slider from 'material-ui/Slider';
import S from '../store/Store';

class PasswordLength extends PureComponent {
    state = {
        len: 24
    };

    sliderStyle = {
        maxWidth: '400px',
        margin: '0px 0px 0px 15px'
    };

    subheaderStyle = {
        color: 'rgba(0, 0, 0, 0.870588)',
        fontSize: '16px',
        lineHeight: '1',
        marginBottom: '12px',
        marginTop: '12px'
    };

    constructor(props) {
        super(props);
        this.onChange = this.onChange.bind(this);
        this.state.len = props.len;
    }

    componentWillReceiveProps(props) {
        const { len } = this.state;
        if (props.len !== len) {
            this.setState({
                len: props.len
            });
        }
    }

    onChange(e, len) {
        this.setState({
            len: len
        });
        if (this.props.onChange) {
            this.props.onChange(e, len);
        }
    }

    render() {
        return (
            <div>
                <Subheader style={this.subheaderStyle}>
                    Password Length ({this.state.len} chars)
                </Subheader>
                <Slider
                    onChange={this.onChange}
                    sliderStyle={this.sliderStyle}
                    min={8}
                    max={100}
                    step={1}
                    value={this.state.len}
                />
            </div>
        );
    }
}

export default PasswordLength;
