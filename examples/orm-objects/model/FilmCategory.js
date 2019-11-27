/*
 * Copyright (c) 2019  simplenodeorm.org
 */

"use strict";

const Model = require('../../../main/Model');

class FilmCategory extends Model {
    constructor(metaData) {
        super(metaData);
    }

    async getFilmId() { return await this.__getFieldValue("filmId"); }
    setFilmId(value) { this.__setFieldValue("filmId", value); }

    async getCategoryId() { return await this.__getFieldValue("categoryId"); }
    setCategoryId(value) { this.__setFieldValue("categoryId", value); }

    async getLastUpdate() { return await this.__getFieldValue("lastUpdate"); }
    setLastUpdate(value) { this.__setFieldValue("lastUpdate", value); }

    async getCategory() { return await this.__getFieldValue("category"); }
    setCategory(value) { this.__setFieldValue("category", value); }

    async getFilms() { return await this.__getFieldValue("films"); }
    setFilms(value) { this.__setFieldValue("films", value); }
}

module.exports = function(metaData) {
    return new FilmCategory(metaData);
};
