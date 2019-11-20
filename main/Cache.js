/*
 * Copyright (c) 2019  simplenodeorm.org
 */
const Redis = require("ioredis");

class Cache {
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
        if (config.redisClusterHost === "localhost") {
            this.islocal = true;
            this.client = new Map();
        } else {
            try {

                if (this.logger.isLogDebugEnabled()) {
                    this.logger.logDebug("in Cache() before client create");
                }
                this.client = new Redis(config.redisClusterPort, config.redisClusterHost);
                this.client.flushall();
                if (this.logger.isLogDebugEnabled()) {
                    this.logger.logDebug("in Cache() after client create");
                }
            }

            catch (e) {
                this.logger.logError("Redis create client exception", e);
            }
        }
    }

    set(key, value, ttl) {
        if (this.logger.isLogDebugEnabled()) {
            this.logger.logDebug("setting cache[" + key + "]=" + value + " with ttl " + ttl);
        }
        if (ttl) {
            this.client.set(key, value, 'EX', ttl);
        } else {
            this.client.set(key, value, 'EX', this.config.defaultCacheTimeout);
        }
    }

    setJson(key, value, ttl) {
        if (ttl) {
            this.client.set(key, JSON.stringify(value), 'EX', ttl);
        } else {
            this.client.set(key, JSON.stringify(value), 'EX', this.config.defaultCacheTimeout);
        }
    }

    async get(key) {
        let retval;
        if (this.logger.isLogDebugEnabled()) {
            this.logger.logDebug("attempting to get cached value for " + key);
        }
        if (this.islocal) {
            retval = this.client.get(key);
        } else {
            retval = await this.client.get(key);
        }
        if (this.logger.isLogDebugEnabled()) {
            this.logger.logDebug("found cache[" + key + "]=" + retval);
        }

        return retval;
    }

    async getJson(key) {
        let retval;
        if (this.islocal) {
            retval = this.client.get(key);
        } else {
            retval = await this.client.get(key);
        }

        if (retval) {
            return JSON.parse(retval);
        } else {
            return retval;
        }
    }

    del(key) {
        if (this.islocal) {
            this.client.delete(key);
        } else {
            this.client.del(key);
        }
    }

    async keys() {
        return await this.client.keys("*");
    }
}

module.exports = function(config, logger) {
    return new Cache(config, logger);
};

