"use strict";

const Model = require('../../../main/Model');

class Actor extends Model {
    constructor(metaData) {
        super(metaData);
    }
    
    getActorId() { return this.__getFieldValue("actorId"); }
    setActorId(value) { this.__setFieldValue("actorId", value); }
    
    getFirstName() { return this.__getFieldValue("firstName"); }
    setFirstName(value) { this.__setFieldValue("firstName", value); }
    
    getLastName() { return this.__getFieldValue("lastName"); }
    setLastName(value) { this.__setFieldValue("lastName", value); }
    
    getLastUpdate() { return this.__getFieldValue("lastUpdate"); }
    setLastUpdate(value) { this.__setFieldValue("lastUpdate", value); }
}

module.exports = function(metaData) {
    return new Actor(metaData);
};
