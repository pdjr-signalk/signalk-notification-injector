## Usage

Once __signalk-notification-injector__ is configured, you can inject a key
into the Signal K notification tree by writing a line of text to the FIFO
or UDP port (if configured).
If configuration defaults are used, then:
```
$> echo "letmein:test on:This is a remotely injected test notification" > /var/signalk-injector
```
will insert the key ```notifications.injected.test```.

The notification can be cancelled by:
```
$> echo "letmein:test off" > /var/signalk-injector
```
Note that in Signal K world, cancelling a notification does not necessarily
result in removal of the associated key, but it does set the key value to
null.

You can check the Signal K server's notification state at any time by
substituting your server address in a url of the form:
```
http://192.168.1.1:3000/signalk/v1/api/vessels/self/notifications/
```

Each line of text received by the plugin will be parsed into a notification
as long as it conforms to some simple formatting rules and will otherwise be
silently ignored.  It is convenient to think of each text line as a message,
and the rules of message formatting are described below.

## Message format

Messages sent to the plugin must conform to the following pattern (those that
do not will be silently ignored):

_password_:_key_ {{__on__|_duration_}[:_description_][:_state_][:_methods_]|__off__}

_password_ is a plaintext token which will be checked against a collection of
allowed tokens defined in the plugin configuration.  In my SMS control system
_password_ is set by the SMS receiver to the originating caller-id: in this
way, only SMS messages from authorised callers are accepted.

_key_ is the key which should be inserted into the server's notification tree.
If _key_ includes a path, then the value of _key_ will be used as-is; if _key_
is simply a token, then the default notification path defined in the plugin
configuration will be prepended.

__on__ says create _key_.

__off__ says delete _key_ value.

_duration_ says create _key_, but automatically delete it after a specified
 time.  _duration_ must be an integer value and is taken to specify a number
of minutes (optionally _duration_ can be suffixed by 's', 'm' or 'h' to
explicitly specify seconds, minutes and hours).

_state_ defines the value of the new notification's state field.

_methods_ is a space-delimited list of values which will be used to define
the new notification's methods field.

_description_ is arbitrary text which will be used as the descriptive contents
of new notifications.

