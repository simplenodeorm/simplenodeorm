/*
 * Copyright (c) 2019  simplenodeorm.org
 */

"use strict";

const Model = require('../../../main/Model');

class Film extends Model {
    constructor(metaData) {
        super(metaData);
    }

    async getFilmId() { return await this.__getFieldValue("filmId"); }
    setFilmId(value) { this.__setFieldValue("filmId", value); }

    async getTitle() { return await this.__getFieldValue("title"); }
    setTitle(value) { this.__setFieldValue("title", value); }

    async getDescription() { return await this.__getFieldValue("description"); }
    setDescription(value) { this.__setFieldValue("description", value); }

    async getReleaseYear() { return await this.__getFieldValue("releaseYear"); }
    setReleaseYear(value) { this.__setFieldValue("releaseYear", value); }

    async getLanguageId() { return await this.__getFieldValue("languageId"); }
    setLanguageId(value) { this.__setFieldValue("languageId", value); }

    async getOriginalLanguageId() { return await this.__getFieldValue("originalLanguageId"); }
    setOriginalLanguageId(value) { this.__setFieldValue("originalLanguageId", value); }

    async getRentalDuration() { return await this.__getFieldValue("rentalDuration"); }
    setRentalDuration(value) { this.__setFieldValue("rentalDuration", value); }

    async getRentalRate() { return await this.__getFieldValue("rentalRate"); }
    setRentalRate(value) { this.__setFieldValue("rentalRate", value); }

    async getLength() { return await this.__getFieldValue("length"); }
    setLength(value) { this.__setFieldValue("length", value); }

    async getReplacementCost() { return await this.__getFieldValue("replacementCost"); };
    setReplacementCost(value) { this.__setFieldValue("replacementCost", value); };

    async getRating() { return await this.__getFieldValue("rating"); };
    setRating(value) { this.__setFieldValue("rating", value); };

    async getSpecialFeatures() { return await this.__getFieldValue("specialFeatures"); };
    setSpecialFeatures(value) { this.__setFieldValue("specialFeatures", value); };

    async getLastUpdate() { return await this.__getFieldValue("lastUpdate"); };
    setLastUpdate(value) { this.__setFieldValue("lastUpdate", value); };

    async getLanguage() { return await this.__getFieldValue("language"); };
    setLanguage(value) { this.__setFieldValue("language", value); };

    async getOriginalLanguage() { return await this.__getFieldValue("originalLanguage"); };
    setOriginalLanguage(value) { this.__setFieldValue("originalLanguage", value); };
}

module.exports = function(metaData) {
    return new Film(metaData);
};
