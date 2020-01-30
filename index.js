/*
 * Copyright 2018 Paul Reeve <paul@pdjr.eu>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0

 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const fs = require('fs');
const child_process = require('child_process');
const Schema = require("./lib/schema.js");
const Log = require("./lib/log.js");

const PLUGIN_SCHEMA_FILE = __dirname + "/schema.json";
const PLUGIN_UISCHEMA_FILE = __dirname + "/uischema.json";
const DEBUG = false;

module.exports = function(app) {
	var plugin = {};

	plugin.id = "notification-injector";
	plugin.name = "Notification injector";
	plugin.description = "Inject notifications into the Signal K alert tree";

    const log = new Log(app.setProviderStatus, app.setProviderError, plugin.id);

    /**
     * Load plugin schema from disk file and add a default list of notifiers
     * garnered from the plugin script directory.  The names of these
     * notifiers are saved so that they can be added as checkbox options to
     * subsequently identified notification paths.
     */
	plugin.schema = function() {
        if (DEBUG) log.N("plugin.schema()...", false);
        var schema = Schema.createSchema(PLUGIN_SCHEMA_FILE);
        return(schema.getSchema());
    };
 
	plugin.uiSchema = function() {
        if (DEBUG) log.N("plugin.uiSchema()...", false);
        var schema = Schema.createSchema(PLUGIN_UISCHEMA_FILE);
        return(schema.getSchema());
    }

	plugin.start = function(options) {
        if (DEBUG) log.N("plugin.start(" + JSON.stringify(options) + ")...", false);
		try {
            if (!fs.existsSync(options.fifo)) child_process.spawnSync('mkfifo', [ options.fifo ]);
            if (fs.lstatSync(options.fifo).isFIFO()) {
                fs.open(options.fifo, fs.constants.O_RDWR, (err, pipeHandle) => {
                    log.N("Listening on " + options.fifo);
                    let stream = fs.createReadStream(null, { fd: pipeHandle, autoClose: false });
                    stream.on('data', d => processMessage(String(d).trim(), options));
                });
            } else {
                log.E("Configured FIFO (" + options.fifo + ") does not exist or is not a named pipe");
                return;
            }
		} catch(e) {
			log.E("Failed: " + e);
			return;
		}
	}

	plugin.stop = function() {
        if (DEBUG) log.N("plugin.stop()...", false);
	}

    /**
     * Parses a message of the form "password:text {on|off}" and if password is a member
     * of the passwords array then 
     */
    function processMessage(message, options) {
        if (DEBUG) log.N("processMessage(" + message + "," + JSON.stringify(options) + ")...", false);
        let parts  = message.split(":");
        let password = (parts.length > 0)?parts[0].trim():null;
        let key = (parts.length > 1)?parts[1].trim():null;
        let description = ((parts.length > 2)?parts[2]:"").trim();
        let state = ((parts.length > 3)?parts[3]:options.defaultstate).trim();
        let method = ((parts.length > 4)?parts[4]:options.defaultmethod).trim().split(" ");
        if ((password != null) && (key != null)) {
            if (options.passwords.split(" ").includes(password)) {
                if (key.match(/ on$/i)) {
                    if ((key = getCanonicalKey(key.slice(0,-3), options.defaultpath)) !== null) issueNotification(key, description, state, method);
                } else if (key.match(/ off$/i)) {
                    if ((key = getCanonicalKey(key.slice(0,-4), options.defaultpath)) !== null) cancelNotification(key);
                } else {
                    log.N("ignoring malformed request");
                }
            } else {
                log.N("request could not be authenticated");
            }
        } else {
            log.N("ignoring malformed request");
        }
    }

    function getCanonicalKey(key, defaultpath) {
        if (DEBUG) log.N("getCanonicalKey(" + key + "," + defaultpath + ")...", false);
        var retval = null;
        if (key) {
            if (defaultpath.match(/^notifications\.*/)) {
                defaultpath += ((defaultpath.charAt(defaultpath.length - 1) != '.')?".":"");
                while (key.charAt[0] == '.') key = key.slice(1);
                while (key.charAt[key.length - 1] == '.') key = key.slice(0,-1);
                if (key.length > 0) retval = defaultpath + key;
            }
        }
        return(retval);
    }

    function cancelNotification(key) {
        if (DEBUG) log.N("cancelNotification(" + key + ")...", false);
		var delta = { "context": "vessels." + app.selfId, "updates": [ { "source": { "label": "self.notificationhandler" }, "values": [ { "path": key, "value": null } ] } ] };
        log.N("Deleting notification: " + key);
		app.handleMessage(plugin.id, delta);
        return;
    }

	function issueNotification(key, message, state, method) {
        if (DEBUG) log.N("issueNotification(" + key + "," + message + ")...", false);
		var delta = { "context": "vessels." + app.selfId, "updates": [ { "source": { "label": "self.notificationhandler" }, "values": [ { "path": key, "value": null } ] } ] };
        delta.updates[0].values[0].value = { "state": state, "message": message, "method": method, "timestamp": (new Date()).toISOString() };
        log.N("Creating notification: " + key);
		app.handleMessage(plugin.id, delta);
        return;
	}

	return plugin;
}
