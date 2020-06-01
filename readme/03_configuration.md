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

These properties define which, if any, of the possible plugin interfaces are
enabled and provide configuration details for each interface.
There are two sub-sections.

__FIFO named pipe -> Enabled?__ defines whether or not the local named pipe
will be monitored by the plugin.
Required.
Default is checked (monitor the named pipe).

__FIFO named pipe -> Path__ defines the absolute path of the named pipe.
Required.
Default is '/var/signalk-injector'.

__WebSocket -> Enabled?__ defines whether or not the plugin will accept TCP
websocket connections. 
Required.
Default is un-checked (do not accept websocket connections).

__Websocket -> Port__ defines the port number on which the plugin will listen.
Required.
Default is 6543.

### Notification defaults

These properties define what default values will be used by the plugin when it
constructs a notification from a received message.
Setting defaults is a way of simplifying the content of most incoming messages.
Defaults can always be over-ridden on a per-message basis.

__Default path__ defines the root in the notifications tree where the plugin
will place notifications which do not specify an absolute notification key
(that is a key which begins with 'notifications...').
The supplied path must be absolute (i.e. must begin with 'notifications.').
Required.
Default is 'notifications.injector'.

__Default state__ defines the value to be used for the notification state
field if no state is specified in a message.
Required.
Default value is 'alert'.

__Default method__ defines the values to be used for the notification method
field if no values are specified in a message.
Required.
The default value is to specify no methods.

### Access security

These properties define whether or not a simple keyword-based security check
should be applied to incoming messages.

__Perform access check on__ defines which communication interfaces will have a
security chcek applied to their incoming messages.
Required.
Default is to apply security checks to all interfaces.

__Passwords__ defines a space separated collection of keywords, one of which
must be included in messages presented to interfaces on which access checking
is enabled.
Required.
Default value is 'letmein 0000' and you should change this.  

