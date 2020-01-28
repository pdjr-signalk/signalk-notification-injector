module.exports = class Log {

    constructor(fstat, ferr, prefix) {
        this.fstat = fstat;
        this.ferr = ferr;
        this.prefix = prefix;
    }

    N(message, toConsole) {
        this.log(message, (toConsole === undefined)?true:toConsole);
    }

    W(message, toConsole) {
        this.log(message, (toConsole === undefined)?true:toConsole);
    }

    E(message, toConsole) {
        this.log(message, (toConsole === undefined)?true:toConsole, true);
    }

    log(message, toConsole, toError) {
        if (message !== undefined) {
            // Always write message to syslog
	        if (this.prefix !== undefined) console.log("%s: %s", this.prefix, message);
    
            if (toConsole) {
                message = message.charAt(0).toUpperCase() + message.slice(1);
	            if ((toError === undefined) || (!toError)) { this.fstat(message); } else { this.ferr(message); }
            }
        }
    }
}
