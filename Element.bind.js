;(function(window, undefined){
    /*
     * = isObject
     */
    function isObject(object){
        return Object.prototype.toString.call(object) == "[object Object]"
    }
    /*
     * = isArray
     */
    function isArray(object){
        return Object.prototype.toString.call(object) == "[object Array]"
    }
    /*
     * = path2Array
     */
    function path2Array(path){
        return path.replace(/\[/g,'.').replace(/\]/g,'').split('.');
    }
    /*
     * = parseItem
     */
    function parseItem(data){
        if(data == '$i'){
            //handle $i
            return 0;
        }else{
            return data;
        }
    }
    /*
     * = getObjectProperty
     */
    function getObjectProperty(object, path){
        var obj     = object,
            pathArr = path2Array(path),
            prop,item;

        prop        = parseItem(pathArr.pop());
        while(pathArr.length){
            obj = obj[parseItem(dataArr.shift())];
        }
        return {
            object  : obj,
            property    : prop
        }
    }
    function Bind(element, attribute, object, property){
        //this.bind   = function(){return 1}//userdefine
        return this.bind(element, attribute, object, property);
    };
    //console.log(Bind, new Bind, Bind())
    function BindPrototype(){
        this.bind   = function(element, attribute, object, property){//initial
            var defineProperty  = Object.defineProperty,
                objectProperty  = getObjectProperty(object, property),
                obj             = objectProperty.object,
                prop            = objectProperty.property;
            console.log(obj.prop)
            if(attribute == 'textContent'){
            }
        };
    };
    Bind.prototype  = new BindPrototype;
    window.Bind = Bind;
})(window)
