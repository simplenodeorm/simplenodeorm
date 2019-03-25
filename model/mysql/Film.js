"use strict";

const Model = require('../../main/Model.js');

class Film extends Model {
    constructor(metaData) {
        super(metaData);
    }
    
    getFilmId() { return this.getFieldValue("filmId"); }
    setFilmId(value) { this.setFieldValue("filmId", value); }
    
    getTitle() { return this.getFieldValue("title"); }
    setTitle(value) { this.setFieldValue("title", value); }
    
    getDescription() { return this.getFieldValue("description"); }
    setDescription(value) { this.setFieldValue("description", value); }
    
    getReleaseYear() { return this.getFieldValue("releaseYear"); }
    setReleaseYear(value) { this.setFieldValue("releaseYear", value); }
    
    getLanguageId() { return this.getFieldValue("languageId"); }
    setLanguageId(value) { this.setFieldValue("languageId", value); }
    
    getRentalDuration() { return this.getFieldValue("rentalDuration"); }
    setRentalDuration(value) { this.setFieldValue("rentalDuration", value); }
    
    getRentalRate() { return this.getFieldValue("rentalRate"); }
    setRentalRate(value) { this.setFieldValue("rentalRate", value); }
    
    getLength() { return this.getFieldValue("length"); }
    setLength(value) { this.setFieldValue("length", value); }
    
    getReplacementCost() { return this.getFieldValue("replacementCost"); };
    setReplacementCost(value) { this.setFieldValue("replacementCost", value); };
    
    getRating() { return this.getFieldValue("rating"); };
    setRating(value) { this.setFieldValue("rating", value); };
    
    getSpecialFeatures() { return this.getFieldValue("specialFeatures"); };
    setSpecialFeatures(value) { this.setFieldValue("specialFeatures", value); };
    
    getLastUpdate() { return this.getFieldValue("lastUpdate"); };
    setLastUpdate(value) { this.setFieldValue("lastUpdate", value); };
    
    getLanguage() { return this.getFieldValue("language"); };
    setLanguage(value) { this.setFieldValue("language", value); };
    
    getOriginalLanguage() { return this.getFieldValue("originalLanguage"); };
    setOriginalLanguage(value) { this.setFieldValue("originalLanguage", value); };
}

module.exports = function(metaData) {
    return new Film(metaData);
};
