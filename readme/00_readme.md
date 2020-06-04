# signalk-notification-injector

Signal K notification tree message interface.

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

