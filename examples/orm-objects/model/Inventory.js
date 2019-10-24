/*
 * Copyright (c) 2019  simplenodeorm.org
 */

"use strict";

const Model = require('../../../main/Model');

class Inventory extends Model {
    constructor(metaData) {
        super(metaData);
    }
    
    getInventoryId() { return this.__getFieldValue("inventoryId"); }
    setInventoryId(value) { this.__setFieldValue("inventoryId", value); }
    
    getFilmId() { return this.__getFieldValue("filmId"); }
    setFilmId(value) { this.__setFieldValue("filmId", value); }
    
    getStoreId() { return this.__getFieldValue("storeId"); }
    setStoreId(value) { this.__setFieldValue("storeId", value); }
    
    getLastUpdate() { return this.__getFieldValue("lastUpdate"); }
    setLastUpdate(value) { this.__setFieldValue("lastUpdate", value); }
    
    getFilm() { return this.__getFieldValue("film"); }
    setFilm(value) { this.__setFieldValue("film", value); }
    
    getStore() { return this.__getFieldValue("store"); }
    setStore(value) { this.__setFieldValue("store", value); }
}

module.exports = function(metaData) {
    return new Inventory(metaData);
};
