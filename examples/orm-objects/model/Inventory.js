"use strict";

const Model = require('../../../main/Model');

class Inventory extends Model {
    constructor(metaData) {
        super(metaData);
    }
    
    getInventoryId() { return this.getFieldValue("inventoryId"); }
    setInventoryId(value) { this.setFieldValue("inventoryId", value); }
    
    getFilmId() { return this.getFieldValue("filmId"); }
    setFilmId(value) { this.setFieldValue("filmId", value); }
    
    getStoreId() { return this.getFieldValue("storeId"); }
    setStoreId(value) { this.setFieldValue("storeId", value); }
    
    getLastUpdate() { return this.getFieldValue("lastUpdate"); }
    setLastUpdate(value) { this.setFieldValue("lastUpdate", value); }
    
    getFilm() { return this.getFieldValue("film"); }
    setFilm(value) { this.setFieldValue("film", value); }
    
    getStore() { return this.getFieldValue("store"); }
    setStore(value) { this.setFieldValue("store", value); }
}

module.exports = function(metaData) {
    return new Inventory(metaData);
};
