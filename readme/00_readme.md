# signalk-notification-injector

[Signal K Node server](https://github.com/SignalK/signalk-server-node)
plugin which injects arbitrary notifications into the host alert tree.

The plugin was developed as part of an SMS-based remote control system but may
have more general usefulness.  In my Signal K installation I pass the plugin
messages received from my ship's SMS interface and this allows me to remotely
control my heating by the simple expedient of sending "heating on" and
"heating off" messages to the vessel's GSM connection.

## Principle of operation

__signalk-notification-injector__ listens on a named pipe (FIFO) for
single-line text messages and attempts to use these messages to manage alarms
in the Signal K notification tree.

Messages must conform to the following pattern (those that do not will be
silently ignored):

```
_password_:_notification_ {{__on__|_duration_}[:_description_]|__off__}
```

_password_ is a plaintext token which will be checked against a collection of
allowed tokens defined in the plugin configuration.  In my SMS control system
_password_ is simply the SMS caller-id which is prepended to received text
messages by the SMS receiver script.

_notification_ is a plaintext token (optionally prepended by a path) which
names the notification which will be inserted into the Signal K data store.
If _notification_ does not include a path component then the default
notification path defined in the plugin configuration will be prepended
before further processing.

__on__ says insert the notification.

__off__ says delete the notification.

_duration_ says insert the notification and automatically delete it after
the specified time.  _duration_ must be an integer value optionally suffixed
by 's', 'm' or 'h', for seconds, minutes and hours (if no suffix is supplied
then 'm' is assumed).

_description_ is arbitrary text which will be used as the descriptive contents
of new notifications.
