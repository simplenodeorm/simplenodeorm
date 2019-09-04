"use strict";

const Model = require('../../../main/Model');

class Film extends Model {
    constructor(metaData) {
        super(metaData);
    }
    
    getFilmId() { return this.__getFieldValue("filmId"); }
    setFilmId(value) { this.__setFieldValue("filmId", value); }
    
    getTitle() { return this.__getFieldValue("title"); }
    setTitle(value) { this.__setFieldValue("title", value); }
    
    getDescription() { return this.__getFieldValue("description"); }
    setDescription(value) { this.__setFieldValue("description", value); }
    
    getReleaseYear() { return this.__getFieldValue("releaseYear"); }
    setReleaseYear(value) { this.__setFieldValue("releaseYear", value); }
    
    getLanguageId() { return this.__getFieldValue("languageId"); }
    setLanguageId(value) { this.__setFieldValue("languageId", value); }
    
    getOriginalLanguageId() { return this.__getFieldValue("originalLanguageId"); }
    setOriginalLanguageId(value) { this.__setFieldValue("originalLanguageId", value); }
    
    getRentalDuration() { return this.__getFieldValue("rentalDuration"); }
    setRentalDuration(value) { this.__setFieldValue("rentalDuration", value); }
    
    getRentalRate() { return this.__getFieldValue("rentalRate"); }
    setRentalRate(value) { this.__setFieldValue("rentalRate", value); }
    
    getLength() { return this.__getFieldValue("length"); }
    setLength(value) { this.__setFieldValue("length", value); }
    
    getReplacementCost() { return this.__getFieldValue("replacementCost"); };
    setReplacementCost(value) { this.__setFieldValue("replacementCost", value); };
    
    getRating() { return this.__getFieldValue("rating"); };
    setRating(value) { this.__setFieldValue("rating", value); };
    
    getSpecialFeatures() { return this.__getFieldValue("specialFeatures"); };
    setSpecialFeatures(value) { this.__setFieldValue("specialFeatures", value); };
    
    getLastUpdate() { return this.__getFieldValue("lastUpdate"); };
    setLastUpdate(value) { this.__setFieldValue("lastUpdate", value); };
    
    getLanguage() { return this.__getFieldValue("language"); };
    setLanguage(value) { this.__setFieldValue("language", value); };
    
    getOriginalLanguage() { return this.__getFieldValue("originalLanguage"); };
    setOriginalLanguage(value) { this.__setFieldValue("originalLanguage", value); };
}

module.exports = function(metaData) {
    return new Film(metaData);
};
