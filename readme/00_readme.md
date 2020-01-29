# signalk-notification-injector

Insert arbitrary keys into a Signal K notification tree.

This project implements a plugin for the [Signal K Node server](https://github.com/SignalK/signalk-server-node).

Reading the [Alarm, alert and notification handling](http://signalk.org/specification/1.0.0/doc/notifications.html)
section of the Signal K documentation may provide helpful orientation.

## Principle of operation

__signalk-notification-injector__ parses messages received on a named pipe
(FIFO) into keys in the host server's ```vessels.self.notifications``` tree.

Messages written to the FIFO consist of single lines of text and must conform
to some simple formatting and security rules or they will be silently ignored.

Any process which is able to write to the named pipe has access to the
injection process.  
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
