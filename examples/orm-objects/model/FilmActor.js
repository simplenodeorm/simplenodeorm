/*
 * Copyright (c) 2019  simplenodeorm.org
 */

"use strict";

const Model = require('../../../main/Model');

class FilmActor extends Model {
    constructor(metaData) {
        super(metaData);
    }

    async getActorId() { return await this.__getFieldValue("actorId"); }
    setActorId(value) { this.__setFieldValue("actorId", value); }

    async getFilmId() { return await this.__getFieldValue("filmId"); }
    setFilmId(value) { this.__setFieldValue("filmId", value); }

    async getLastUpdate() { return await this.__getFieldValue("lastUpdate"); }
    setLastUpdate(value) { this.__setFieldValue("lastUpdate", value); }

    async getActor() { return await this.__getFieldValue("actor"); }
    setActor(value) { this.__setFieldValue("actor", value); }

    async getFilms() { return await this.__getFieldValue("films"); }
    setFilms(value) { this.__setFieldValue("films", value); }
}

module.exports = function(metaData) {
    return new FilmActor(metaData);
};
