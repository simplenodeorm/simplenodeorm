"use strict";

const Model = require('@simplenodeorm/simplenodeorm/main/Model');

class Actor extends Model {
    constructor(metaData) {
        super(metaData);
    }
    
    getActorId() { return this.getFieldValue("actorId"); }
    setActorId(value) { this.setFieldValue("actorId", value); }
    
    getFirstName() { return this.getFieldValue("firstName"); }
    setFirstName(value) { this.setFieldValue("firstName", value); }
    
    getLastName() { return this.getFieldValue("lastName"); }
    setLastName(value) { this.setFieldValue("lastName", value); }
    
    getLastUpdate() { return this.getFieldValue("lastUpdate"); }
    setLastUpdate(value) { this.setFieldValue("lastUpdate", value); }
}

module.exports = function(metaData) {
    return new Actor(metaData);
};
