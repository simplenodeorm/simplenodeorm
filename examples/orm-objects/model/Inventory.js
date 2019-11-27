/*
 * Copyright (c) 2019  simplenodeorm.org
 */

"use strict";

const Model = require('../../../main/Model');

class Inventory extends Model {
    constructor(metaData) {
        super(metaData);
    }

    async getInventoryId() { return await this.__getFieldValue("inventoryId"); }
    setInventoryId(value) { this.__setFieldValue("inventoryId", value); }

    async getFilmId() { return await this.__getFieldValue("filmId"); }
    setFilmId(value) { this.__setFieldValue("filmId", value); }

    async getStoreId() { return await this.__getFieldValue("storeId"); }
    setStoreId(value) { this.__setFieldValue("storeId", value); }

    async getLastUpdate() { return await this.__getFieldValue("lastUpdate"); }
    setLastUpdate(value) { this.__setFieldValue("lastUpdate", value); }

    async getFilm() { return await this.__getFieldValue("film"); }
    setFilm(value) { this.__setFieldValue("film", value); }

    async getStore() { return await this.__getFieldValue("store"); }
    setStore(value) { this.__setFieldValue("store", value); }
}

module.exports = function(metaData) {
    return new Inventory(metaData);
};
