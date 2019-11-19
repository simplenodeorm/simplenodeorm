/*
 * Copyright (c) 2019  simplenodeorm.org
 */
const redis = require('redis');
const {promisify} = require('util');

class Cache {
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
        if (config.redisClusterHost === "localhost") {
            this.islocal = true;
            this.client = new Map();
        } else {
            try {
                this.client = redis.createClient(config.redisClusterPort, config.redisClusterHost);
                this.getAsync = promisify(this.client.get).bind(this.client);
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
            client.set('key', 'value!', 'EX', ttl);
        } else {
            client.set('key', 'value!', 'EX', this.config.defaultCacheTimeout);
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
            retval = await this.getAsync(key);
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

