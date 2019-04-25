"use strict";

const Model = require('../../main/Model.js');

class PSFilmCategory extends Model {
    constructor(metaData) {
        super(metaData);
    }
    
    getFilmId() { return this.getFieldValue("filmId"); }
    setFilmId(value) { this.setFieldValue("filmId", value); }
    
    getCategoryId() { return this.getFieldValue("categoryId"); }
    setCategoryId(value) { this.setFieldValue("categoryId", value); }
    
    getLastUpdate() { return this.getFieldValue("lastUpdate"); }
    setLastUpdate(value) { this.setFieldValue("lastUpdate", value); }

    getCategory() { return this.getFieldValue("category"); }
    setCategory(value) { this.setFieldValue("category", value); }
    
    getFilms() { return this.getFieldValue("films"); }
    setFilms(value) { this.setFieldValue("films", value); }
}

module.exports = function(metaData) {
    return new PSFilmCategory(metaData);
};
