import React, { Component, PureComponent } from 'react';
import TextField from 'material-ui/TextField';
import Chip from 'material-ui/Chip';
import Subheader from 'material-ui/Subheader';
import FontIcon from 'material-ui/FontIcon';
import { grey500, transparent } from 'material-ui/styles/colors';
import { Card, CardActions, CardHeader, CardText } from 'material-ui/Card';
import { List, ListItem } from 'material-ui/List';

const bookmarkIcon = (
    <FontIcon
        color={grey500}
        style={{ fontSize: '36px' }}
        className="material-icons">
        bookmark
    </FontIcon>
);

class Tags extends PureComponent {
    chipStyles = {
        chip: {
            margin: 4,
            marginLeft: 0
        },
        wrapper: {
            margin: '20px 0px 0px 0px',
            display: 'flex',
            flexWrap: 'wrap'
        },
        wrapper_read: {
            display: 'flex',
            flexWrap: 'wrap'
        }
    };

    cardHeaderStyle = {
        paddingBottom: '0px'
    };

    cardTextStyle = {
        paddingTop: '0px'
    };

    constructor(props) {
        super(props);
        this.addTag = this.addTag.bind(this);
        this.tagKeyPress = this.tagKeyPress.bind(this);
    }

    tagKeyPress(e) {
        const { tagKeyPress } = this.props;
        if (tagKeyPress) {
            tagKeyPress(e);
        }
    }

    addTag(e) {
        const { onChange, tags } = this.props,
            target = e.target,
            tag = target.value;
        if (e.key === 'Enter') {
            if (tag) {
                if (tags.indexOf(tag) === -1) {
                    tags.push(tag);
                    onChange(tags);
                }
                target.value = '';
            } else {
                this.tagKeyPress(e);
            }
        }
    }

    deleteTag(i) {
        const { onChange, tags } = this.props;
        tags.splice(i, 1);
        onChange(tags);
    }

    showTags() {
        const { tags, readonly } = this.props;
        const items = tags.map((t, i) => {
            return (
                <Chip
                    style={this.chipStyles.chip}
                    key={t}
                    onKeyPress={this.tagKeyPress}
                    onRequestDelete={readonly ? null : () => this.deleteTag(i)}>
                    {t}
                </Chip>
            );
        });
        if (readonly && items.length === 0) {
            return <div style={{ fontSize: '14px' }}>None to Show</div>;
        }
        return items;
    }

    makeAddTag() {
        return (
            <TextField
                style={{ display: 'block' }}
                onKeyPress={this.addTag}
                fullWidth={true}
                floatingLabelText="Tag"
                hintText="Enter a tag to add"
            />
        );
    }

    render() {
        const { readonly } = this.props;
        if (readonly) {
            return (
                <List>
                    <Subheader>Tags</Subheader>
                    <ListItem hoverColor={transparent}>
                        <div style={this.chipStyles.wrapper_read}>
                            {this.showTags()}
                        </div>
                    </ListItem>
                </List>
            );
        } else {
            return (
                <Card initiallyExpanded={true}>
                    <CardHeader
                        avatar={bookmarkIcon}
                        title="Tags"
                        style={this.cardHeaderStyle}
                        subtitle={'Add some tags'}
                        actAsExpander={false}
                        children={this.makeAddTag()}
                        showExpandableButton={false}
                    />
                    <CardText style={this.cardTextStyle} expandable={false}>
                        <div style={this.chipStyles.wrapper}>
                            {this.showTags()}
                        </div>
                    </CardText>
                </Card>
            );
        }
    }
}

export default Tags;
