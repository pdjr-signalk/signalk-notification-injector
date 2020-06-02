# signalk-notification-injector

Insert arbitrary keys into a Signal K notification tree.

This project implements a plugin for the [Signal K Node server](https://github.com/SignalK/signalk-server-node).

Reading the [Alarm, alert and notification handling](http://signalk.org/specification/1.0.0/doc/notifications.html)
section of the Signal K documentation may provide helpful orientation.

## Principle of operation

__signalk-notification-injector__ parses messages arriving on a named pipe
(FIFO), UDP port or TCP websocket into keys in the Signal K  host server's
```vessels.self.notifications``` tree.

Messages are single lines of text which conform to some simple formatting and
security rules.

Processes on the Signal K host which are able to write to the named pipe can
create a notification very simply:
```
$> echo "heating:alert Heating system fuel level < 10%" > /var/signalk-injector
```

Remote processes or network applications can achieve the same result by 
writing to the injector's UDP port or by making a TCP websocket connection.

Signal K places no arbitrary restrictions on the semantics of notification keys
and it is a straightforward task to implement plugins which react to the
server's notification state.

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
## Configuration

__signalk-notification-injector__ is configured through the Signal K
Node server plugin configuration interface.
Navigate to _Server->Plugin config_ and select the _Notification injector_ tab.

![Plugin configuration screen](readme/screenshot.png)

The _Active_ checkbox tells the Signal K Node server whether or not to run the
plugin: on first execution you should check this, before reviewing and
amending the configuration options discussed below.
Changes you make will only be saved and applied when you finally click the
_Submit_ button.

The plugin configuration properties are organised under three collapsible tabs.

### Service interfaces

These settings define which, if any, of the implemented interfaces to the
plugin are enabled and provides configuration details for each interface.

#### FIFO named pipe

__Enabled?__ specifies whether or not to create and monitor a local named pipe.
Required.
Default is checked (create and monitor the named pipe).

__Password protected?__ specifies whether or not messages to this interface
must include a password in order to use the plugin.
Required.
Default is not checked (do not require a password).

__Pathname__ specifies the absolute filesystem path of the named pipe.
Required.
Default is '/var/signalk-injector'.

#### UDP port

__Enabled?__ specifies whether or not to provide service on a local UDP port.
Required.
Default is not checked (do not provide a UDP service).

__Password protected?__ specifies whether or not messages to this interface
must include a password in order to use the plugin.
Required.
Default is checked (require a password).

__Port__ specifies the UDP port number on which to listen for connections.
Required.
Default is 6543.

#### TCP websocket

__Enabled?__ specifies whether or not to provide a websocket service on a
local TCP port.
Required.
Default is not checked (do not provide a websocket service).

__Password protected?__ specifies whether or not messages to this interface
must include a password in order to use the plugin.
Required.
Default is checked (require a password).

__Port__ specifies the TCP port number on which to listen for websocket
connections.
Required.
Default is 6543.

### Default notification properties

These settings define default values which will be used by the plugin when it
constructs a notification from a received message.
Setting defaults can be a way of simplifying the content of incoming messages.
Defaults can always be over-ridden on a per-message basis.

__Default notification path__ specifies the root in the Signal K data  tree
where the plugin will place notifications derived from messages which do not
themselves specify an absolute notification key (that is a key which begins
with 'notifications...').
The supplied path must be absolute (i.e. must begin with 'notifications.').
Required.
Default is 'notifications.injector'.

__Default notification state__ specifies the value to be used for the
state property of notifications derived from messages which do not themselves
specify a notification state.
Required.
Default value is 'alert'.

__Default notification methods__ specifies the values to be used for thes
method property of notifications derived from messages which do not
themselves specify a notication method or methods.
Required.
The default value is to specify no methods.

### Security settings

These settings configure the security measures which can be applied to the
various plugin service interfaces.

__Allowed network client addresses__ specifies a space separated list of
client IP addresses from which connections to the UDP and TCP interfaces will
be accepted.
The wildcard '\*' can be used in any part of an address.
Required.
The default value is '*.*.*.*' which allows connection from all clients.

__Access passwords__ specifies a space separated collection of passwords,
one of which must be included in messages presented to plugin interfaces on
which password protection is enabled.
Required.
Default value is 'letmein 0000'.  

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
server address in a url of the following form and reviewing browser output.
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
(or delete) any existing notification.

The optional _password_ field is required if the interface used to deliver
the message has its _Protected?_ configuration property enabled.
In this case, messages will only be processed if the supplied _password_ has a
value which is defined in the plugin's list of security keywords.
If the interface being used is not protected, then _password_ is optional and
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

## Use cases

### SMS control interface

On _Beatrice_ I use __signalk-notification-injector__ as part of an SMS based
remote control system which allows me to do things like turn on lights and
heating and so on.

_Beatrice_'s cellular network interface is implemented by ```gammu-smsd```(1)
which periodically polls an attached GSM modem and acquires incoming texts.
Received texts are passed by ```gammu-smsd``` to a simple shell script which
parses the content into a message suitable for consumption by
__signalk-notification-injector__.

The ```[smsd]``` stanza of my ```gammu-smsd``` configuration file includes thes
 line:
```
RunOnReceive = /usr/local/bin/signalk-inject
```
which refers to the following ```bash```(1) script.
```
#!/bin/bash
# signalk-inject
FIFO=/var/signalk-injector
PROGRAM=/bin/echo

for i in `seq ${SMS_MESSAGES}` ; do
    eval "$PROGRAM \"\${SMS_${i}_NUMBER}\"@\"\${SMS_${i}_TEXT}\"" > ${FIFO}
done

```
