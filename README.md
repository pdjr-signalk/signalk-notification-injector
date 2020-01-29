# signalk-notification-injector

Insert arbitrary keys into a Signal K notification tree.

This project implements a plugin for the [Signal K Node server](https://github.com/SignalK/signalk-server-node).

Reading the [Alarm, alert and notification handling](http://signalk.org/specification/1.0.0/doc/notifications.html)
section of the Signal K documentation may provide helpful orientation.

## Principle of operation

__signalk-notification-injector__ parses messages received on a named pipe
(FIFO) into keys in the host server's ```vessels.self.notifications``` tree.
Any process which is able to write an appropriately formatted text message
to the named pipe has access to the injection process.

Signal K places no arbitrary restrictions on the semantics or processing of
notification keys and Signal K processes can interpret and use notification key
values as they see fit. 

On my vessel, I use __signalk-notification-injector__ as part of an SMS based
remote control system in which the presence or absence of a particular key or
keys is used to influence virtual or real-world systems.  For example, if I
send the text "heating on" to my ship's GSM number the plugin inserts the key
```vessels.self.notifications.remote.heating``` into the server state.  The
presence of this key is detected by my control system which responds by
switching on the ship's central heating system.

## Message format ##

Messages written to the FIFO must conform to the following pattern (those that
do not will be silently ignored):

_password_:_key_ {{__on__|_duration_}[:_description_]|__off__}

_password_ is a plaintext token which will be checked against a collection of
allowed tokens defined in the plugin configuration.  In my SMS control system
_password_ is set by the SMS receiver to the originating caller-id: in this
way, only SMS messages from authorised callers are accepted.

_key_ is the key which should be inserted into the server's notification tree.
If _key_ includes a path, then the value of _key_ will be used as-is; if _key_
is simply a token, then the default notification path defined in the plugin
configuration will be prepended.

__on__ says create _key_.

__off__ says delete _key_.

_duration_ says create _key_, but automatically delete it after a specified
 time.  _duration_ must be an integer value and is taken to specify a number
of minutes (optionally _duration_ can be suffixed by 's', 'm' or 'h' to
explicitly specify seconds, minutes and hours).

_description_ is arbitrary text which will be used as the descriptive contents
of new notifications.
## System requirements

__signalk-notification-injector__ has no special system requirements that must
be met prior to installation.
## Installation

Download and install __signalk-notification-injector__ using the _Appstore_
link in your Signal K Node server console.
The plugin can also be obtained from the 
[project homepage](https://github.com/preeve9534/signalk-notification-injector)
and installed using
[these instructions](https://github.com/SignalK/signalk-server-node/blob/master/SERVERPLUGINS.md).
## Usage

__signalk-notification-injector__ is confugured through the Signal K
Node server plugin configuration interface.
Navigate to _Server->Plugin config_ and select the _Notification injector_ tab.

![Plugin configuration screen](readme/screenshot.png)

The _Active_ checkbox tells the Signal K Node server whether or not to run the
plugin: on first execution you should check this, before reviewing and
amending the configuration options discussed below.
Changes you make will only be saved and applied when you finally click the
_Submit_ button.

The plugin configuration pane has just three entries:

### FIFO path

This specifies the filename of the named pipe or FIFO.  When the plugin
starts it will check for the presence of this file and, if necessary,
attempt to create it by a call to mkfifo(1).

The default value is ```/var/signalk-injector```.

### Passwords

This is a whitespace delimited list of password tokens that will allow
processing of an incoming message.

The default value is "letmein 0000".  You should change this.

### Default notification path

If a message doesn't specify a key path, then the requested key will be
created under the path specified here.  The specified path must begin
with "notifications.".

The default value is "notifications.injector." which means that simple
keys will be placed under the path ```vessels.self.notifications.injector.```. 
