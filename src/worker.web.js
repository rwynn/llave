'use strict';

const lunr = require('lunr');

let index;

const indexDocs = function() {
    const data = this;
    index = lunr(function() {
        // setup pipelines
        this.pipeline = new lunr.Pipeline();
        this.pipeline.add(lunr.stopWordFilter);
        this.searchPipeline = new lunr.Pipeline();
        this.ref('id');
        this.field('title');
        this.field('tags');
        this.field('url');
        this.field('username');
        this.field('email');
        this.field('notes');
        data.map(d => {
            const indexed = Object.assign({}, d);
            indexed.active = null;
            indexed.passwords = null;
            return indexed;
        }).forEach(this.add, this);
    });
};

const queryBuilder = function(terms, query) {
    const termParts = terms.toLowerCase().split(' ');
    termParts
        .filter(term => !!term)
        .forEach(term => {
            const wildcard =
                term.length > 1
                    ? lunr.Query.wildcard.LEADING | lunr.Query.wildcard.TRAILING
                    : lunr.Query.wildcard.TRAILING;
            query.clause({
                term: term,
                boost: 1,
                usePipeline: false,
                wildcard: wildcard
            });
            query.clause({
                term: term,
                boost: 5,
                usePipeline: false
            });
            query.clause({
                fields: ['title'],
                term: term,
                boost: 10,
                usePipeline: false
            });
        });
    return query;
};

const searchDocs = function(terms) {
    return index ? index.query(queryBuilder.bind(this, terms)) : [];
};

addEventListener(
    'message',
    function(e) {
        const data = e.data;
        switch (data.cmd) {
            case 'index':
                indexDocs.bind(data.docs).call();
                break;
            case 'query':
                const results = searchDocs(data.terms);
                const reply = JSON.stringify({
                    cmd: data.cmd,
                    results: results
                });
                postMessage(reply);
                break;
        }
    },
    false
);
