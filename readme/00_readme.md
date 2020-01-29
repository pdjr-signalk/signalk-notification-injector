# signalk-notification-injector

Insert arbitrary keys into a Signal K notification tree.

This project implements a plugin for the [Signal K Node server](https://github.com/SignalK/signalk-server-node).

Reading the [Alarm, alert and notification handling](http://signalk.org/specification/1.0.0/doc/notifications.html)
section of the Signal K documentation may provide helpful orientation.

## Principle of operation

__signalk-notification-injector__ parses messages received on a named pipe
(FIFO) into keys in the host server's ```vessels.self.notifications``` tree.

Messages written to the FIFO consist of single lines of text and must conform
to some simple formatting and security rules or they will be silently ignored.

Any process which is able to write to the named pipe has access to the
injection process and creating a notification can be as simple as:
```
$> echo "letmein:heating on" > /var/signalk-injector
```
Signal K places no arbitrary restrictions on the semantics of notification keys
and it is a straightforward task to implement plugins which react to the
server's notification state allowing the construction of a simple notification
based remote control system.
