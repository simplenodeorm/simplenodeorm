/*
 * Copyright (c) 2019  simplenodeorm.org
 */

"use strict";

const Model = require('../../../main/Model');

class FilmText extends Model {
    constructor(metaData) {
        super(metaData);
    }

    async getFilmId() { return await this.__getFieldValue("filmId"); }
    setFilmId(value) { this.__setFieldValue("filmId", value); }

    async getTitle() { return await this.__getFieldValue("title"); }
    setTitle(value) { this.__setFieldValue("title", value); }

    async getDescription() { return await this.__getFieldValue("description"); }
    setDescription(value) { this.__setFieldValue("description", value); }
}

module.exports = function(metaData) {
    return new FilmText(metaData);
};
