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
                this.client = new Redis(config.redisClusterPort, config.redisClusterHost);
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
            this.client.set(key, value, 'ex', ttl);
        } else {
            this.client.set(key, value, 'ex', this.config.defaultCacheTimeout);
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

    del(key) {
        if (this.islocal) {
            this.client.delete(key);
        } else {
            this.client.del(key);
        }
    }
}

module.exports = function(config) {
    return new Cache(config);
};

