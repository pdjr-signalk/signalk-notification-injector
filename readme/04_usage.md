## Usage

Once __signalk-notification-injector__ is configured and activated, you can
inject a notification into the Signal K notification tree by writing a message
to one or other of the configured interfaces.

Assuming that the default plugin configuration is unchanged, then the command:
```
$> echo "test:alert" > /var/signalk-injector
```
will issue an 'alert' notification on the key ```notifications.injected.test```.

Similarly, the command:
```
$> echo "letmein@test:cancel" > /var/signalk-injector
```
will cancel this notification.

You can check this behaviour on your Signal K server by substituting your
server address in a URL of the following form and reviewing browser output.
```
http://192.168.1.1:3000/signalk/v1/api/vessels/self/notifications/injected/
```

The examples above are an example of the minimum needed to trigger a plugin
response.
More generally, a message to the plugin must consist of a single line of text
conforming to the formatting constraints described below.

### Message format

Messages sent to the plugin must conform to one of the following patterns:

[*password*__@__]*key*[__:__[*state*][__:__[*method*]]] *description*

[*password*__@__]*key*__:__{__off__|__cancel__}

The first form is used to issue a notification, the second form to cancel
(delete) any existing notification.

The optional _password_ field is required if the interface used to deliver
the message has its _Protected?_ configuration property enabled.
In this case, messages will only be processed if the supplied _password_ has a
value which is defined in the plugin's _Access passwords_ configuration setting.
If the interface being used is not protected, then _password_ is optional and
if a value is supplied it will be discarded.

_key_ is the notification key to which the message applies and it should
take the form of a simple name or a dotted pathname.
If _key_ includes an absolute notification path (i.e. one that begins
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

