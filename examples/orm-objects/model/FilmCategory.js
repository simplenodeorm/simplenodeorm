"use strict";

const Model = require('../../../main/Model');

class FilmCategory extends Model {
    constructor(metaData) {
        super(metaData);
    }
    
    getFilmId() { return this.__getFieldValue("filmId"); }
    setFilmId(value) { this.__setFieldValue("filmId", value); }
    
    getCategoryId() { return this.__getFieldValue("categoryId"); }
    setCategoryId(value) { this.__setFieldValue("categoryId", value); }
    
    getLastUpdate() { return this.__getFieldValue("lastUpdate"); }
    setLastUpdate(value) { this.__setFieldValue("lastUpdate", value); }

    getCategory() { return this.__getFieldValue("category"); }
    setCategory(value) { this.__setFieldValue("category", value); }
    
    getFilms() { return this.__getFieldValue("films"); }
    setFilms(value) { this.__setFieldValue("films", value); }
}

module.exports = function(metaData) {
    return new FilmCategory(metaData);
};
