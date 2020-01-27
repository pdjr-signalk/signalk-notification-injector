# signalk-notification-injector

SignalK application which injects arbitrary text into the notification tree.

The injector opens a FIFO channel on a configured path.  Data written to the FIFO which conforms to the format:

password notification_text

Password is a plaintext authentication string which is checked against a user-defined collection of authentication passwords.  If the supplied password exists in the collection, then a new notification message is placed in the SignalK notification structure.

