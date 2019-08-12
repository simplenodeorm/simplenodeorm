"use strict";

const Model = require('@simplenodeorm/simplenodeorm/main/Model');

class FilmText extends Model {
    constructor(metaData) {
        super(metaData);
    }
    
    getFilmId() { return this.getFieldValue("filmId"); }
    setFilmId(value) { this.setFieldValue("filmId", value); }
    
    getTitle() { return this.getFieldValue("title"); }
    setTitle(value) { this.setFieldValue("title", value); }
    
    getDescription() { return this.getFieldValue("description"); }
    setDescription(value) { this.setFieldValue("description", value); }
}

module.exports = function(metaData) {
    return new FilmText(metaData);
};
