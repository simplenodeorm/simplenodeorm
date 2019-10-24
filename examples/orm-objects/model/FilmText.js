/*
 * Copyright (c) 2019  simplenodeorm.org
 */

"use strict";

const Model = require('../../../main/Model');

class FilmText extends Model {
    constructor(metaData) {
        super(metaData);
    }
    
    getFilmId() { return this.__getFieldValue("filmId"); }
    setFilmId(value) { this.__setFieldValue("filmId", value); }
    
    getTitle() { return this.__getFieldValue("title"); }
    setTitle(value) { this.__setFieldValue("title", value); }
    
    getDescription() { return this.__getFieldValue("description"); }
    setDescription(value) { this.__setFieldValue("description", value); }
}

module.exports = function(metaData) {
    return new FilmText(metaData);
};
