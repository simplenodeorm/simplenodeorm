/*
 * Copyright (c) 2019  simplenodeorm.org
 */

"use strict";

const Model = require('../../../main/Model');

class FilmActor extends Model {
    constructor(metaData) {
        super(metaData);
    }
    
    getActorId() { return this.__getFieldValue("actorId"); }
    setActorId(value) { this.__setFieldValue("actorId", value); }
    
    getFilmId() { return this.__getFieldValue("filmId"); }
    setFilmId(value) { this.__setFieldValue("filmId", value); }
    
    getLastUpdate() { return this.__getFieldValue("lastUpdate"); }
    setLastUpdate(value) { this.__setFieldValue("lastUpdate", value); }
    
    getActor() { return this.__getFieldValue("actor"); }
    setActor(value) { this.__setFieldValue("actor", value); }
    
    getFilms() { return this.__getFieldValue("films"); }
    setFilms(value) { this.__setFieldValue("films", value); }
}

module.exports = function(metaData) {
    return new FilmActor(metaData);
};
