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

__Default notification methods__ specifies the values to be used for the
method property of notifications derived from messages which do not
themselves specify a notication method or methods.
Required.
The default is not to specify any methods.

### Security settings

These settings configure the security measures which can be applied to the
various plugin service interfaces.

__Allowed network client addresses__ specifies a space separated list of
client IP addresses from which connections to the UDP and TCP interfaces will
be accepted.
The wildcard '\*' can be used in any part of an address.
Required.
Default value is '127.0.0.1' which will only allow access from the Signal K
host.
You should change this to reflect your local requirement: something like
'127.0.0.1 192.168.\*.\*' will satisfy most use cases.

__Access passwords__ specifies a space separated collection of passwords,
one of which must be included in messages presented to plugin interfaces on
which password protection is enabled.
Required.
Default value is 'letmein 0000'.  
You may want to change this to reflect your local requirement.

### Production example

The configuration used on my production system looks like this.
```
{
  "enabled": true,
  "enableLogging": false,
  "configuration": {
    "interfaces": {
      "fifo": {
        "enabled": true,
        "protected": false,
        "path": "/var/signalk-injector"
      },
      "udp": {
        "enabled": true,
        "protected": true,
        "port": 6543
      },
      "ws": {
        "enabled": true,
        "protected": true,
        "port": 6543
      }
    },
    "notification": {
      "defaultpath": "notifications.injected",
      "defaultstate": "alert",
      "defaultmethods": []
    },
    "security": {
      "clients": "127.0.0.1 192.168.1.*",
      "passwords": "flashbang 1958 447786123456"
    }
  }
}
```
