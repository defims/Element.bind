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
        return path.replace(/^\[/g,'').replace(/\[/g,'.').replace(/\]/g,'').split('.');
    }
    /*
     * = parseItem
     */
    function parseItem(scope, data){
        //handle sign
        if(data == '$index'){
            return Number(scope.index);//todo
        }else{
            return data;
        }
    }
    /*
     * = getObjectProperty
     */
    function getObjectProperty(scope, obj, path){
        var pathArr = path2Array(path);
        var prop    = parseItem(scope, pathArr.pop());
        while(pathArr.length){
            obj     = obj[parseItem(scope, pathArr.shift())];
        }
        return {
            object      : obj,
            property    : prop
        }
    }
    /*
     * = handleElement
     */
    function handleElement(element, path, data){
        //console.log(data, path ,element)
        var pathArr     = path2Array(path);

        this.attribute[pathArr.shift()].call(element, path, pathArr, data);
    }
    /*
     * = getHandleFunctions
     */
    function getHandleFunctions(binding, value){
        //find handle function
        var len = binding.length,
            handle;
        while(len--){
            if(binding[len].key == value){
                handle  = binding[len].handle;
                break;
            }
        }
        //add handle function
        if(!handle){
            handle  = [];
            binding.push({
                key     : value,
                handle  : handle
            });
        }
        return handle
    }
    /*
     * = handle
     */
    function handle(handleFunctions, element, data){
        var len = handleFunctions.length;
        while(len--) handleFunctions[len](element, data);
    }
    /*
     * = watchPropertyChange
     */
    function watchPropertyChange(obj,prop,callback){
        //need multi watch
        //need unWatch
        //need array support
        var _value = obj[prop];
        Object.defineProperty(obj, prop, {
            get: function(){
                //console.log('get')
                return _value
            },
            set: function(data){
                //console.log('set')
                _value  = data;
                callback(data);
            }
        })
    }
    /*
     * = getScope
     */
    function getScope(element){
        while(element){
            ElementBindScope    = element.ElementBindScope;
            if(ElementBindScope && ElementBindScope.data){
                return ElementBindScope
            }
            element = element.parentElement;
        }
        return window
    }
    /*
     * = getElementPath
     */
    function getElementPath(element){
        var path = [],
            children,len,parent;
        while(parent = element.parentElement){
            ElementBindScope    = element.ElementBindScope;
            if(ElementBindScope && ElementBindScope.data){
                break;
            }
            children        = parent.children;
            len             = children.length;
            while(len--){
                if(children[len] == element){
                    path.unshift(len);
                }
            }
            element = parent;
        }
        return path;
    }
    /*
     * = hangToScope
     */
    function hangToScope(element, scope, attributePath, object, dataPath){
        //console.log(arguments)
        var childBinders,elementPath,has,childBind,len,_elementPath,pathLen,childBind;
        childBinders        = scope.childBinders;
        elementPath         = getElementPath(element);
        has                 = false;
        childBind           = {
            "elementPath"       : elementPath,
            "attributePath"     : attributePath,
            "object"            : object,
            "dataPath"          : dataPath
        }
        if(!childBinders){
            scope.childBinders  = [childBind];
        }else{
            len = childBinders.length;
            while(len--){
                _elementPath    = childBinders[len].elementPath;
                if(_elementPath){
                    pathLen = _elementPath;
                    while( pathLen-- ){//judge if elementPath equal
                        if(_elementPath[pathLen] != elementPath[pathLen]){
                            has = true;
                            childBind   = _elementPath[pathLen];
                            break;
                        }
                    }
                    if(!has) break;
                }
            }
            if(!has) scope.childBinders.push(childBind);
        }
    }
    /*
     * = bindChildren
     */
    function bindChildren(binders, element){
        var bindersLen,pathLen;
        if(binders){
            bindersLen  = binders.length;
            while(bindersLen--){
                binder          = binders[bindersLen];
                elementPath     = binder.elementPath;
                pathLen         = elementPath.length;
                while(pathLen--) element  = element.children[elementPath[pathLen]];
                //console.log(element, binder)
                if(elementPath.length > 0){
                    ElementBind(element, binder.attributePath, binder.object, binder.dataPath)
                }else{//nest bind
                }
            }
        }
    }
    /*function ElementBind(element, attribute, object, property){
        return new ElementBind.fn.init(element, attribute, object, property)
    }
    ElementBind.fn  = ElementBind.prototype;
    ElementBind.fn.init = function(){
        return this;
    }
    ElementBind.fn.bind   = function(){
        console.log('prototype');
    }
    //ElementBind.fn.init.prototype    = ElementBind.prototype;
    ElementBind.fn.init.prototype    = ElementBind.fn;*/
    function bind(elements, attributePath, object, dataPath){
        var self    = this,
            len,objectProperty,obj,prop,element,value,handleFunctions,element;

        if(elements.length == undefined) elements = [elements];

        len = elements.length;
        while(len--){
            element = elements[len];
            scope   = getScope(element);
            hangToScope.call(self, element, scope, attributePath, object, dataPath);
            //relative object property
            objectProperty  = dataPath ?
                getObjectProperty(scope, object, dataPath) :
                getObjectProperty(scope, scope.data, object);
            obj             = objectProperty.object;
            prop            = objectProperty.property;
            value           = obj[prop];
            handleFunctions = getHandleFunctions(self.binding, value);
            /*
            //use getter setter chain for multi element binding
            var _obj    = {}
            defineProperty(_obj, prop, Object.getOwnPropertyDescriptor(obj, prop))
                    //modify
            defineProperty(obj, prop, {
                get: function(){
                    //console.log('get')
                    return _obj[prop]
                },
                set: function(data){
                    //console.log('set')
                    handleElement.call(self, element, attributePath, data);
                    _obj[prop]  = data;
                }
            })
            */
            handleFunctions.push(function(element, data){
                handleElement.call(self, element, attributePath, data)
            });
            //first time call handleFuncitons
            handle(handleFunctions, element, value)
            //if obj[prop] change call handleFunctions
            watchPropertyChange(obj,prop,(function(handleFunctions, element){
                return function(value){
                    handle(handleFunctions, element, value)
                }
            })(handleFunctions, element))
            console.log(handleFunctions)
        }
    }

    function Attribute(){}
    function AttributePrototype(){
        var self    = this;
        //textContent
        self.textContent    = function(path, pathArr, data){
            console.log(arguments)
            if(typeof(data) == 'object'){
                data = JSON.stringify(data);
            }
            //need ie <8 fixed
            this.textContent    = data
        }
        //attributes
        //compatable table http://quirksmode.org/dom/core/#attributes
        self.attributes     = function(path, pathArr, data){
            var element     = this,
                firstItem   = pathArr[0];
            if(!element) return
            if(firstItem == 'id'){//id
                element.id  = JSON.stringify(data);
            }else if(firstItem == 'class'){//class
                if(isArray(data)){
                    data = data.join(' ');
                }
                element.className  = data;
            }else if(firstItem == 'style'){//style
                var len = pathArr.length;
                if(len == 1){//style = {top: 1em}
                    if(isObject(data)){
                        var key;
                        for(key in data) element.style[key]  = data[key];
                    }
                }else{//style.top = '1em'
                    element.style[pathArr[1]]   = data;
                }
            }else{//other
                var attr    = element.attributes,
                    prop    = pathArr.pop(),
                    len     = pathArr.length,
                    item;
                while(len--){
                    item    = pathArr.shift();
                    if(!attr[item])  attr[item] = {};
                    attr = attr[item];
                }
                if(!attr[prop]) attr[prop] = {};
                attr[prop]  = data;
            }
        }
        //dataset
        self.dataset        = function(path, pathArr, data){
            var attr    = pathArr.shift(),
                len     = pathArr.length,
                word;
            while(len--){
                word    = pathArr.shift();
                attr    += word.substring(0,1).toUpperCase() + word.substring(1);
            }
            this.dataset[attr]  = data;
        }
        self.event          = function(){}
        self.scope          = function(path, pathArr, data){
            var element = this;
            if(!element.ElementBindScope) element.ElementBindScope = {};
            element.ElementBindScope.data   = data;
        }
        /*
         * repeat
         * repeat the dom and bind child
         * */
        self.repeat         = function(path, pathArr, data){
            var len                 = data.length,
                element             = this,
                lastInstance        = element,
                ElementBindScope    = element.ElementBindScope,
                tempElement,instances,i,childElement,childBindersLen,childBinding,pathLen,i;
            if(!ElementBindScope){//first time
                element.ElementBindScope = {
                    "data"      : data,
                    "instances" : [],
                    "index"     : 0
                };
                ElementBindScope    = element.ElementBindScope;
            }else{//other time
                scopeData   = ElementBindScope.data;
                for(i=0; i<len; i++) scopeData[i] = data[i]
                data    = scopeData;
            }
            instances               = ElementBindScope.instances;
            for(i=1; i<len; i++){
                if(instances[i-1]){
                    console.log(instances[i-1])
                    lastInstance        = instances[i-1];
                    lastInstance.ElementBindScope.data   = data;
                }else{
                    tempElement = element.cloneNode(true);
                    tempElement.ElementBindScope = {
                        "data"      : data,
                        "prototype" : element,
                        "index"     : i
                    }
                    element.parentNode.insertBefore(tempElement, lastInstance.nextSibling);
                    lastInstance    = tempElement;
                    instances.push(tempElement);
                    bindChildren( ElementBindScope.childBinders, tempElement );
                }
            }
        }
        self.handle         = function(path, pathArr, data){}
    }
    Attribute.prototype = new AttributePrototype;

    function Sign(){}
    function SignPrototype(){
        var self    = this;
        self.$index = function(){}
    }
    Sign.prototype      = new SignPrototype;

    function Config(){//userdefine
        //this.bind   = function(){
        //    console.log('a')
        //}
    }
    function ConfigPrototype(){
        this.bind       = bind;
        this.binding    = [];
        this.sign       = new Sign;
        this.attribute  = new Attribute;
    }
    Config.prototype    = new ConfigPrototype;


    function ElementBind(){
        ElementBind.config.bind.apply(ElementBind.config, arguments)
    }
    ElementBind.config  = new Config;
    //console.log(ElementBind)
    //console.log(ElementBind.config)

    window.ElementBind = ElementBind;
})(window)
