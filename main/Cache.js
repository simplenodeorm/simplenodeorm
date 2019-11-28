/*
 * Copyright (c) 2019  simplenodeorm.org
 */
const Redis = require("ioredis");
const NodeCache = require("node-cache");

class Cache {
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
        if (!config.redisCache) {
            this.client = new NodeCache( { stdTTL: config.defaultCacheTimeout, checkperiod: 120 } );
        } else {
            try {
                this.client = new Redis(config.redisClusterPort, config.redisClusterHost);
                this.client.flushall();
            }

            catch (e) {
                this.logger.logError("Redis create client exception", e);
            }
        }
    }

    set(key, value, ttl) {
        if (this.config.redisCache) {
            if (ttl) {
                this.client.set(key, value, 'EX', ttl);
            } else {
                this.client.set(key, value, 'EX', this.config.defaultCacheTimeout);
            }
        } else {
            if (ttl) {
                this.client.set(key, value, ttl);
            } else {
                this.client.set(key, value, this.config.defaultCacheTimeout);
            }
        }
    }

    setJson(key, value, ttl) {
        this.set(key, JSON.stringify(value), 'EX', ttl);
    }

    async get(key) {
        let retval;
        if (this.logger.isLogDebugEnabled()) {
            this.logger.logDebug("attempting to get cached value for " + key);
        }
        retval = await this.client.get(key);

        if (this.logger.isLogDebugEnabled()) {
            this.logger.logDebug("found cache[" + key + "]=" + retval);
        }

        return retval;
    }

    async getJson(key) {
        let retval = await this.get(key);

        if (retval) {
            return JSON.parse(retval);
        } else {
            return retval;
        }
    }

    del(key) {
        this.client.del(key);
    }

    async keys() {
        if (this.config.redisCache) {
            return await this.client.keys("*");
        } else {
            return await this.client.keys();
        }
    }
}

module.exports = function(config, logger) {
    return new Cache(config, logger);
};

