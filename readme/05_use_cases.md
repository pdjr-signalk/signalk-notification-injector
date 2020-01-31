## Use cases

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
    eval "$PROGRAM \"\${SMS_${i}_NUMBER}\":\"\${SMS_${i}_TEXT}\"" > ${FIFO}
done

```
