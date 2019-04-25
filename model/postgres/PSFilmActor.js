"use strict";

const Model = require('../../main/Model.js');

class PSFilmActor extends Model {
    constructor(metaData) {
        super(metaData);
    }
    
    getActorId() { return this.getFieldValue("actorId"); }
    setActorId(value) { this.setFieldValue("actorId", value); }
    
    getFilmId() { return this.getFieldValue("filmId"); }
    setFilmId(value) { this.setFieldValue("filmId", value); }
    
    getLastUpdate() { return this.getFieldValue("lastUpdate"); }
    setLastUpdate(value) { this.setFieldValue("lastUpdate", value); }
    
    getActor() { return this.getFieldValue("actor"); }
    setActor(value) { this.setFieldValue("actor", value); }
    
    getFilms() { return this.getFieldValue("films"); }
    setFilms(value) { this.setFieldValue("films", value); }
}

module.exports = function(metaData) {
    return new PSFilmActor(metaData);
};
