## Installation

Download and install __signalk-notification-injector__ using the _Appstore_
link in your Signal K Node server console.

The plugin can also be obtained from the 
[project homepage](https://github.com/preeve9534/signalk-notification-injector)
and installed using
```
$> cd ~/.signalk/node_modules
$> git clone --install-submodules https://github.com/preeve9534/signalk-notification-injector.git
$>
$> systemctl restart signalk.service
```

If the server complains about a missing 'ws' library required by this
plugin, you can install a local copy with:
```
$> cd ~/.signalk/node_modules/signalk-notification-injector
$> npm install ws
$> systemctl restart signalk.service
```

I have seen occasions where an installation triggered by the Signal K
_Appstore_ link fails to recover all the required submodules.
If you get complaints about missing libraries in the plugin's ```lib/```
directory, then you can correct this with:
```
$> cd ~/.signalk/node_modules/signalk-notification-injector
$> git submodules update --remote
$> systemctl restart signalk.service
```
