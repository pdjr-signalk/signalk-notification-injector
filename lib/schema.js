const fs = require("fs");

/**
 * Schema provides a wrapper class for interpolating values into an arbitrary
 * JSON object. The class was developed to assist in processing react:json
 * schema files and is less general than it might otherwise be.
 *
 * The createSchema() factory is the normal way of wrapping a JSON file. The
 * 
 * 2018 (c) Paul Reeve <preeve@pdjr.eu>
 */

module.exports = class Schema {

    /**
     * Returns a new Schema object containing the JSON schema derived from
     * filename but processed with a simple variable interpolator which
     * assigns values from some dictionary into placeholders written into the
     * JSON schema.  A variable placeholder is a string of the form
     * "%%_name_%%"
     */

    static createSchema(filename, dictionary) {
        //console.log("createSchema(" + filename + "," + JSON.stringify(dictionary) + ")...");
        var content = undefined;
        try {
            var filecontent = fs.readFileSync(filename);
		    if (dictionary !== undefined) {
		        content = JSON.parse(filecontent, (key, value) => {
		            var a, k, v = value;
		            if ((a = value.toString().match(/^\%\%_(.*)_\%\%$/)) != null) {
		                if (a[1] in dictionary) v = dictionary[a[1]];
		            } else if ((a = value.toString().match(/(\$\$_.*?_\$\$)/)) != null) {
		                v = value.toString();
		                while ((a = v.match(/(\$\$_.*?_\$\$)/)) != null) {
		                    if (a !== undefined) {
		                        k = a[1].substr(3, (a[1].length - 6));
		                        v = (k in dictionary)?v.replace(a[1], dictionary[k]):"(undefined)";
		                    }
	                    }
	                }   
	                return(v);
	            });
	        } else {
	            content = JSON.parse(fs.readFileSync(filename));
	        }
        } catch(err) {
            content = undefined;
        }
        return(new Schema(content));
    }

    constructor(content) {
        this.content = content;
    }

    getSchema() {
        return((this.content == undefined)?{}:this.content);
    }

    putSchema(content) {
        this.content = content;
        return(this);
    }

    insertValue(keystring, value) {
        keystring = keystring.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
        keystring = keystring.replace(/^\./, '');           // strip a leading dot
        var keys = keystring.split('.');
        var o = this.content;
        for (var i = 0, n = keys.length; i < (n - 1); ++i) {
            o = ((o === Object(o)) && (keys[i] in o))?o[keys[i]]:undefined;
        }
        if (o !== undefined) o[keys[keys.length - 1]] = value; 
    }

}
