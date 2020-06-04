# signalk-notification-injector

Signal K notification tree message interface.

This project implements a plugin for the [Signal K Node server](https://github.com/SignalK/signalk-server-node).

Reading the [Alarm, alert and notification handling](http://signalk.org/specification/1.0.0/doc/notifications.html)
section of the Signal K documentation may provide helpful orientation.

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
For example, on a remote Linux client, the something like this could be used
to send a message to the plugin's UDP interface.
```
$> echo "letmein@heating:alert Heating system fuel level < 10%" > /dev/udp/192.168.1.1:6543
```
