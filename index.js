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

const dgram = require('dgram');
const fs = require('fs');
const child_process = require('child_process');

const Schema = require("./lib/signalk-libschema/Schema.js");
const Log = require("./lib/signalk-liblog/Log.js");
const Notification = require("./lib/signalk-libnotification/Notification.js");

const PLUGIN_SCHEMA_FILE = __dirname + "/schema.json";
const PLUGIN_UISCHEMA_FILE = __dirname + "/uischema.json";
const DEBUG = false;

module.exports = function(app) {
	var plugin = {};

	plugin.id = "notification-injector";
	plugin.name = "Notification injector";
	plugin.description = "Inject notifications into the Signal K alert tree";

    const log = new Log(app.setProviderStatus, app.setProviderError, plugin.id);
    const notification = new Notification(app.handleMessage, app.selfId);

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
            if (options.fifo) { // Make local FIFO interface
                if (!fs.existsSync(options.fifo)) child_process.spawnSync('mkfifo', [ options.fifo ]);
                if (fs.lstatSync(options.fifo).isFIFO()) {
                    fs.open(options.fifo, fs.constants.O_RDWR, (err, pipeHandle) => {
                        log.N("listening on " + options.fifo);
                        let stream = fs.createReadStream(null, { fd: pipeHandle, autoClose: false });
                        stream.on('data', d => processMessage(String(d).trim(), options));
                    });
                    if (options.udp) { // Make UDP port interface
                        const server = dgram.createSocket('udp4');
                        server.on('listening', () => {
                            log.N("listening on " + options.fifo + " and " + server.address().address + ":" + server.address().port);
                        });
                        server.on('message', (msg, rinfo) => {
                            processMessage(String(msg).trim(), options);
                        });
                        server.on('error', (err) => {
                            log.E("error on UDP socket " + options.udp);
                            server.close();
                        });
                        server.bind(options.udp);
                    }
                } else {
                    log.E("Configured FIFO (" + options.fifo + ") does not exist or is not a named pipe");
                    return;
                }
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
                    if ((key = getCanonicalKey(key.slice(0,-3), options.defaultpath)) !== null) {
                        log.N("issueing " + state + " notification on " + key);
                        notification.issue(key, description, { "state": state, "method": method });
                    }
                } else if (key.match(/ off$/i)) {
                    if ((key = getCanonicalKey(key.slice(0,-4), options.defaultpath)) !== null) {
                        log.N("cancelling notification on " + key);
                        notification.cancel(key);
                    }
                } else {
                    log.N("ignoring malformed request: " + message);
                }
            } else {
                log.N("request could not be authenticated");
            }
        } else {
            log.N("ignoring malformed request: " + message);
        }
    }

    function getCanonicalKey(key, defaultpath) {
        if (DEBUG) log.N("getCanonicalKey(" + key + "," + defaultpath + ")...", false);
        var retval = null;
        if (key) {
            if (defaultpath.match(/^notifications\.*/)) {
                if (key.match(/^notifications\.*/)) {
                    retval = key;
                } else {
                    defaultpath += ((defaultpath.charAt(defaultpath.length - 1) != '.')?".":"");
                    while (key.charAt[0] == '.') key = key.slice(1);
                    while (key.charAt[key.length - 1] == '.') key = key.slice(0,-1);
                    if (key.length > 0) retval = defaultpath + key;
                }
            }
        }
        return(retval);
    }

	return plugin;
}
