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
const DEBUG = true;

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
        var schema = Schema.createSchema(PLUGIN_SCHEMA_FILE);
        return(schema.getSchema());
    };
 
	plugin.uiSchema = function() {
        var schema = Schema.createSchema(PLUGIN_UISCHEMA_FILE);
        return(schema.getSchema());
    }

	plugin.start = function(options) {
		try {
            if (!fs.existsSync(options.fifo)) child_process.spawnSync('mkfifo', [ options.fifo ]);
            if (fs.lstatSync(options.fifo).isFIFO()) {
                fs.open(options.fifo, fs.constants.O_RDWR, (err, pipeHandle) => {
                    log.N("Listening on " + options.fifo);
                    let stream = fs.createReadStream(null, { fd: pipeHandle, autoClose: false });
                    stream.on('data', d => processMessage(String(d).trim(), options.passwords.trim().split(" ")));
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
	}

    /**
     * Parses a message of the form "password:text {on|off}" and if password is a member
     * of the passwords array then 
     */
    function processMessage(message, passwords) {
        if (DEBUG) log.N("processMessage(" + message + "," + JSON.stringify(passwords) + ")...", false);
        let parts  = message.split(":", 2);
        if (parts.length == 2) {
            let [ password, text ] = parts;
            if (passwords.includes(password.trim())) {
                if (text.match(/ on$/i)) {
                    insertNotification(text.slice(0,-3));
                } else if (text.match(/ off$/i)) {
                    deleteNotification(text.slice(0,-4));
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

    function insertNotification(text) {
        if (DEBUG) log.N("insertNotification(" + text + ")...", false);
    }

	function deleteNotification(text) {
        if (DEBUG) log.N("deleteNotification(" + text + ")...", false);
	}

    function cancelNotification(npath) {
		var delta = { "context": "vessels." + app.selfId, "updates": [ { "source": { "label": "self.notificationhandler" }, "values": [ { "path": npath, "value": null } ] } ] };
		app.handleMessage(plugin.id, delta);
        return;
    }

	function issueNotificationUpdate(test, npath, message, lowthreshold, highthreshold) {
        var notificationValue = null;
        var date = (new Date()).toISOString();
		var delta = { "context": "vessels." + app.selfId, "updates": [ { "source": { "label": "self.notificationhandler" }, "values": [ { "path": npath, "value": notificationValue } ] } ] };
		var vessel = app.getSelfPath("name");
        var state = ((test == 1)?highthreshold:lowthreshold).state;
        var method = ((test == 1)?highthreshold:lowthreshold).method;
        var value = ((test == 1)?highthreshold:lowthreshold).actual;
        var threshold = ((test == 1)?highthreshold:lowthreshold).value;
		var comp = (test == 1)?"above":"below";
        var action = (state == "normal")?"stopping":"starting";
		message = (message)?eval("`" + message + "`"):"";
        notificationValue = { "state": state, "message": message, "method": method, "timestamp": date };
        delta.updates[0].values[0].value = notificationValue;
		app.handleMessage(plugin.id, delta);
        return;
	}

	return(plugin);
	return plugin;
}
