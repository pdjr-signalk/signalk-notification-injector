## Usage

Once __signalk-notification-injector__ is configured and activated, you can
inject a notification into the Signal K notification tree by writing a message
to one or other of the configured interfaces.

If the FIFO interface is enabled on its default path, then:
```
$> echo "letmein@:test:on This is a remotely injected test notification" > /var/signalk-injector
```
will issue an 'alert' notification on the key ```notifications.injected.test```.

This notification can be cancelled (in fact, deleted) by:
```
$> echo "letmein@test:off" > /var/signalk-injector
```

You can check this behaviour on your Signal K server by substituting your
server address in a url of the form:
```
http://192.168.1.1:3000/signalk/v1/api/vessels/self/notifications/injected/
```

A message to the plugin must consist of a single line of text conforming to
the formatting constraints described below.

### Message format

Messages sent to the plugin must conform to one of the following patterns:

[*password*__@__]*key*__[__:__[*state*][__:__[*method*]]] description
[*password*__@__]*key*__:__{__off__|__cancel__}

The first form is used to issue a notification, the second form to cancel
(or delete) any existing notification.

If the interface being used to deliver the message is configured as protected,
then _password_ must be supplied and it must have a value which is defined in
the plugin's list of security keywords for notification generation to be
permitted.
If the interface being used is not protected, then *password* is optional and
if a value is supplied it will be discarded.

_key_ is the notification key to which the message applies and it should
take the form of a simple name or a dotted pathname.
If _key_ includes an absolute notificatiom path (i.e. one that begins
'.notifications.'), then the value of _key_ will be used as-is; otherwise,
the _Default notification path_ defined in the plugin configuration will be
prepended to _key_.

The optional _state_ field sets the state property of an issued notification.
If _state_ is omitted or left blank, then the _Default notification state_
defined in the plugin configuration will be used.
If _state_ is supplied, then it should be one of the standard values defined
in Signal K ('normal', 'alert', 'alarm' and 'emergency') or the special plugin
value 'on' which is simply an alias for 'alert'.

The optional _method_ field sets the method property of an issued notification.
If _method_ is omitted, then the _Default notification method_ defined in the
plugin configuration will be used.
If _method_ is left blank, then no method will be specified in the generated
notification.
The supplied value must be a comma-delimited list of notification methods
(the standard methods in Signal K are 'visual' and 'sound').

_description_ is arbitrary text which will be used as the descriptive contents
of the issued notification.

