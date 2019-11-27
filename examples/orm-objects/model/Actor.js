/*
 * Copyright (c) 2019  simplenodeorm.org
 */

"use strict";

const Model = require('../../../main/Model');

class Actor extends Model {
    constructor(metaData) {
        super(metaData);
    }
    
    async getActorId() { return await this.__getFieldValue("actorId"); }
    setActorId(value) { this.__setFieldValue("actorId", value); }
    
    async getFirstName() { return await this.__getFieldValue("firstName"); }
    setFirstName(value) { this.__setFieldValue("firstName", value); }
    
    async getLastName() { return await this.__getFieldValue("lastName"); }
    setLastName(value) { this.__setFieldValue("lastName", value); }
    
    async getLastUpdate() { return await this.__getFieldValue("lastUpdate"); }
    setLastUpdate(value) { this.__setFieldValue("lastUpdate", value); }
}

module.exports = function(metaData) {
    return new Actor(metaData);
};
