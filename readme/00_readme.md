# signalk-notification-injector

Insert arbitrary keys into a Signal K notification tree.

This project implements a plugin for the [Signal K Node server](https://github.com/SignalK/signalk-server-node).

Reading the [Alarm, alert and notification handling](http://signalk.org/specification/1.0.0/doc/notifications.html)
section of the Signal K documentation may provide helpful orientation.

## Principle of operation

__signalk-notification-injector__ parses messages arriving on either a named
pipe (FIFO) or a websocket port into keys in the Signal K  host server's
```vessels.self.notifications``` tree.

Messages are single lines of text which conform to some simple formatting and
security rules.

Any process which is able to write to the named pipe has access to the
injection process and creating a notification can be as simple as:
```
$> echo "letmein@heating:on" > /var/signalk-injector
```

Remote processes or applications can achieve the same result by making a
WebSocket connection.

Signal K places no arbitrary restrictions on the semantics of notification keys
and it is a straightforward task to implement plugins which react to the
server's notification state.

