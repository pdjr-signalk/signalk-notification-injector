## Installation

You can download and install __signalk-notification-injector__ using the
_Appstore_ link in your Signal K Node server console.
Unfortunately, a limitation in the software packaging system means that the
downloaded module will have some missing submodules.
After the _Appstore_ dowload completes you can add these by:
```
$> cd ~/.signalk/node_modules/signalk-notification-plugin
$> git submodule update --remote
$> systemctl restart signalk.service
```

Alternatively, the plugin can be downloaded directly from its
[project homepage](https://github.com/preeve9534/signalk-notification-injector)
on
[github.com](https://github.com/):
```
$> cd ~/.signalk/node_modules
$> git clone --install-submodules https://github.com/preeve9534/signalk-notification-injector.git
$> systemctl restart signalk.service
```

If the server complains when restarted about a missing 'ws' library required
by this plugin, you can install a local copy with:
```
$> cd ~/.signalk/node_modules/signalk-notification-injector
$> npm install ws
$> systemctl restart signalk.service
```
