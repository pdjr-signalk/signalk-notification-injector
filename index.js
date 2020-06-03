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
const WebSocket = require('ws');
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

    const log = new Log(plugin.id, { ncallback: app.setProviderStatus, ecallback: app.setProviderError });
    const notification = new Notification(app, plugin.id);

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

        // Make FIFO interface
        if (options.interfaces.fifo.enabled) {
		    try {
                if (!fs.existsSync(options.interfaces.fifo.path)) child_process.spawnSync('mkfifo', [ options.interfaces.fifo.path ]);
                if (fs.lstatSync(options.interfaces.fifo.path).isFIFO()) {
                    fs.open(options.interfaces.fifo.path, fs.constants.O_RDWR, (err, pipeHandle) => {
                        log.N("FIFO listener active on " + options.interfaces.fifo.path, false);
                        let stream = fs.createReadStream(null, { fd: pipeHandle, autoClose: false });
                        stream.on('data', (message) => processMessage(String(message).trim(), null, options.interfaces.fifo.protected, options));
                    });
                }
            } catch(e) {
                log.E("unable to create FIFO interface (" + e + ")");
            }
        } else {
            log.N("not starting FIFO interface (disabled by configuration)");
        }

        // Make UDP interface
        if (options.interfaces.udp.enabled) {
            try {
                const udpServer = dgram.createSocket('udp4');
                udpServer.on('listening', () => {
                    log.N("UDP listener active on port " + options.interfaces.udp.port);
                    udpServer.on('message', (message, rinfo) => processMessage(String(message).trim(), rinfo.address, options.interfaces.udp.protected, options));
                });
                udpServer.bind(options.interfaces.udp.port);
            } catch(e) {
                log.N("not starting UDP interface (disabled by configuration)");
            }
        }

        // Make TCP websocket interface
        if (options.interfaces.ws.enabled) {
            try {
                const server = new WebSocket.Server({ port: options.interfaces.ws.port });
                server.on('listening', () => {
                    log.N("TCP websocket listener active  on port " + options.interfaces.ws.port);
                    server.on('connection', (ws) => {
                        ws.on('message', (message) => processMessage(String(message).trim(), ws._socket.remoteAddress.substr(7), options.interfaces.ws.protected, options));
                    });
                });
		    } catch(e) {
                log.E("unable to create WebSocket interface (" + e + ")");
            }
        } else {
            log.N("not starting FIFO interface (disabled by configuration)");
		}
	}

	plugin.stop = function() {
        if (DEBUG) log.N("plugin.stop()...", false);
	}

    /**
     * Parses a message of the form "password@key:state:methods description".
     */
    function processMessage(message, clientAddress, checkPassword, options) {
        if (DEBUG) log.N("processMessage(" + message + "," + JSON.stringify(options) + ")...", false);

        var password = null;
        var key = null;
        var state = options.notification.defaultstate.trim();
        var methods = options.notification.defaultmethods;
        var description = "";

        var parts = message.split(' ', 2);
        // Get description
        if (parts.length > 1) description = parts[1].trim();
        // Get password
        if (parts[0].includes('@')) { [ password, message ] = parts[0].split('@'); } else { password = null; message = parts[0]; }
        var parts = message.split(':');
        // Get key, state, methods
        if (parts.length > 0) key = parts[0].trim();
        if (parts.length > 1) state = parts[1].trim();
        if (parts.length > 2) methods = parts[2].trim().split(',');

        if (key) {
            if (checkClientAddress(clientAddress, options.security.clients)) {
                if ((!checkPassword) || ((checkPassword) && (password) && options.security.passwords.split(" ").includes(password))) {
                    if ((key = getCanonicalKey(key, options.notification.defaultpath)) !== null) {
                        if (state.match(/on/i)) state = 'alert';
                        if (state.match(/off/i)) state = null;
                        if (state) {
                            log.N("issuing " + state + " notification on " + key);
                            notification.issue(key, description, { "state": state, "method": methods });
                        } else {
                            log.N("cancelling notification on " + key);
                            notification.cancel(key);
                        }
                    } else {
                        log.E("ignoring malformed request: " + message);
                    }
                } else {
                    log.N("rejecting request (password authenticaton failed)");
                }
            } else {
                log.N("rejecting request (unauthorised client IP address)");
            }
        } else {
            log.N("ignoring malformed request: " + message);
        }
    }

    function checkClientAddress(clientAddress, validAddressString) {
        var retval = true;
        if (clientAddress) {
            retval = validAddressString.split(' ').reduce((a,va) => { return(compareIPs(va, clientAddress) || a); }, false);
        }
        return(retval);

        function compareIPs(pattern, a) {
            if (pattern.match(/^.+\..+\..+\..+$/) && a.match(/^.+\..+\..+\..+$/)) {
                var pparts = pattern.split('.');
                var aparts = a.split('.');
                if ((pparts[0] == '*') || (pparts[0] == aparts[0])) {
                    if ((pparts[1] == '*') || (pparts[1] == aparts[1])) {
                        if ((pparts[2] == '*') || (pparts[2] == aparts[2])) {
                            if ((pparts[3] == '*') || (pparts[3] == aparts[3])) {
                                return(true);
                            }
                        }
                    }
                }
            }
            return(false);
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
