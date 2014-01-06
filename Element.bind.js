;(function(window, document, undefined){
/*
 *  =scope use to storage binding information
 *  @method get return
 * *
function scope(){
    this.storage    = [];
}
scope.prototype.get = function(element){
    var storage = this.storage,
        len     = storage.length,
        item;
    while(len--){
        item    = storage[len];
        if(item.element = element){
            return item;
            break;
        }
    }
}
scope.prototype.set = function(element, value){
    var item            = this.get(element),
        data            = value.data,
        childBinders    = value.childBinders,
        index           = value.index,
        instances       = value.instances,
        prototype       = value.prototype;

    if(!item){
        item = {
            element : element
        };
        this.storage.push(item);
    }
    if(data) item.data = data;
    if(childBinders) item.childBinders = childBinders;
    if(index) item.index = index;
    if(instances) item.instances = instances;
    if(prototype) item.ptototype = ptototype;
}
var scope   = new scope();
/**/
/*
 *  =watchElementModel
 *  @element    {dom}
 * *
function watchElementModel(element, callback){
    var value;
    Object.defineProperty(element, 'model', {
        get: function(){
            //console.log('get')
            return value;
        },
        set: function(newValue){
            //console.log('set')
            //this point to element
            callback.call(this);
            value   = newValue;
        }
    })
}
/*
 *  = walkDocumentTree
 *  @callback   {function}
 * *
function walkDocumentTree(callback){
    var allElements =   'all' in document ?
                        document.all :
                        allElements = document.getElementByTagName('*'),
        len         = allElements.length;
    while(len--) callback(allElements[len]);
}
/**/

/*
 * = addPropertyChangeListener
 * */
ElementBind.watchList   = [];
function addPropertyChangeListener(obj, prop, callback){
    var watchList   = ElementBind.watchList,
        len         = watchList.length,
        item,watcher,subscribers;
    //find
    while(len--){
        item    = watchList[len];
        if(typeof(item) == 'object' && item.obj == obj && item.prop == prop){
            watcher = item;
        }
    }
    if(!watcher){
        watcher = {
            "obj"           : obj,
            "prop"          : prop,
            "subscribers"   : []
        }
        watchList.push(watcher);
    }
    subscribers = watcher.subscribers;
    subscribers.push(callback);

    if(obj && prop != undefined){
        var _obj    = {};
        _obj[prop]  = obj[prop];
        try{
            Object.defineProperty(_obj,prop,Object.getOwnPropertyDescriptor(obj, prop));
        }catch(e){}
        Object.defineProperty(obj, prop, {
            get : function(){
                return _obj[prop];
            },
            set : function(value){
                _obj[prop] = value;
                if( Object.prototype.toString.call( value ) === '[object Array]' ){//watch array
                    ArrayObserve(obj, prop, function(change){//detect change obj[prop].* = *
                        len     = subscribers.length;
                        while(len-->0) subscribers[len].call(this);
                    })
                }
                len     = subscribers.length;
                while(len-->0) subscribers[len].call(this);
            }
        })
        //first array watch
        if( Object.prototype.toString.call(obj[prop]) === '[object Array]' ){//watch array
            //replace obj[prop] with observable array will cause a obj[prop] set
            ArrayObserve(obj, prop, function(change){//detect change obj[prop].* = *
                len     = subscribers.length;
                while(len-->0) subscribers[len].call(this);
            });
        }
    }
}
/**/

/*
 *  = getScopeElementPathArray   get scope and element path array
 *  @param  element            {Element}
 *  @return scopeElementPath   {Object}
 * */
function getScopeElementPathArray(element){//search dom tree then search scope or search scope then search dom tree? or use dom to storage scope
    var pathArr = [],
        win     = window,
        ElementBindScope,scope,children,parent;
    //get scope and elementPath
    while(element){
        ElementBindScope    = element.ElementBindScope;
        if(ElementBindScope && ElementBindScope.model){//if find scope , jump out
            scope   = ElementBindScope;
            break;
        }
        parent  = element.parentElement;
        if(parent){//elementPathArray
            children    = parent.children;
            len         = children.length;
            while(len--)
                if(children[len] == element)
                    pathArr.unshift(len);
        }
        element = parent;
    }
    //root scope
    if(!scope){
        scope = { model : win };
        win.ElementBindScope = scope;
    }
    return {
        scope       : scope,
        elementPath : pathArr
    }
}
/*
 *  = hang2Scope
 *  @param  elementPathArray    {Array}
 *  @param  attributePathArray  {Array}
 *  @param  object              {Object}
 *  @param  property            {String}
 *  @this   scope               {Scope}
 *  @return
 * */
function hang2Scope( scope, elementPath, binding ){
    var element = this,
        isNewBinder = true,
        childBinders,childBinder,len;
    if(!scope.childBinders) scope.childBinders  = [];
    childBinders    = scope.childBinders;
    while(len--){
        childBinder = childBinders[len];
        if( childBinder.element == element && childBinder.type == binding.type ){
            childBinder.elementPath = elementPath;
            childBinder.template    = binding.template;
            childBinder.directive   = binding.directive;
            isNewBinder               = false;
        }
    }
    if(isNewBinder){
        childBinders.push({
            "elementPath"   : elementPath,
            "template"      : binding.template,
            "directiveType" : binding.directiveType,
            "directiveInfo" : binding.directiveInfo
        });
    }
}
/*
 *  = path2Array
 *  @param  path        {String}
 *  @return pathArray   {Array}
 * */
function path2Array(path){
    return path.replace(/^\[/g,'').replace(/\[/g,'.').replace(/\]/g,'').split('.');
}
/*
 *  = parsePropertyPathItem
 *  @param data {String}
 *  @return
 * */
function parsePropertyPathItem(scope, item){
    //handle sign
    if(item == '$index'){
        return Number(scope.index);//todo
    }else{
        return item;
    }
}
/*
 *  = getObjectProperty
 *  @param  object          {Object}
 *  @param  path            {String}
 *  @this   element         {Element}
 *  @return objectProperty  {Object}
 * */
function getObjectProperty( scope, object, path ){
    var pathArr = path2Array(path),
        prop    = parsePropertyPathItem(scope, pathArr.pop());
    while(pathArr.length) object  = object[parsePropertyPathItem(scope, pathArr.shift())];
    return {
        object      : object,
        property    : prop
    }
}
/*
 * = TemplateItem
 * @param   str             {String}
 * @return  templateItem    {Object}
 * */
function TemplateItem(str){
    return {
        isTemplateItem  : true,
        template        : str,
        value           : ''
    }
}
/*
 * = Template Constructor
 * @param   str     {String}
 * @member  origin  {String}
 * @member  data    {Array}
 * */
function Template(str){
    this.origin = str;

    var len     = str.length,
        parsed  = [],
        item    = '',
        isIn    = false,
        letter;
    while(len--){
        letter  = str[len];
        if(isIn && letter == '{' && str[len-1] == '{'){//out
            len--;
            if(item) parsed.unshift( new TemplateItem(item) );
            item    = '';
            isIn    = false;
        }else if(!isIn && letter == '}' && str[len-1] == '}'){//in
            len--;
            if(item) parsed.unshift(item);
            item    = '';
            isIn    = true;
        }else{
            item    = letter + item;
        }
    }
    this.parsed  = parsed;
}
//console.log(new Template('{{hi}} i am {{name}}'));
/*
 * =ElementBindCore
 * */
function ElementBindCore(element, binding, scope){
    if(!element.nodeType) { throw "binding element is empty"; return }
    if(element.nodeType != 1) { throw "binding element is not an element"; return }
    var render,addAttributeChangeListener,syncData,tplArr,tplLen,item,objProp,obj,prop,directive,model;
    //core need binding, scope, object, element,
    //directive function
    directive                   = ElementBind.directives[binding.directiveType];
    if(!directive) { throw "directive "+binding.directiveType+" does not exist, try to create it"; return }
    render                      = directive.render || function(){};
    addAttributeChangeListener  = directive.addAttributeChangeListener || function(){};
    syncData                    = directive.syncData || function(){};
    model       = binding.model;
    //handle template
    tplArr      = binding.template.parsed;
    tplLen      = tplArr.length;
    while(tplLen--){
        item    = tplArr[tplLen];
        if(item.isTemplateItem){//for each template item
            objProp = getObjectProperty(scope, model, item.template);
            obj     = objProp.object;
            prop    = objProp.property;
            //provide a method for element to change object property
            //can change to get: item.value() , set: item.value(value)
            if(obj && prop != undefined)(function(obj, prop, element, binding, render){
                Object.defineProperty(item, 'value', {
                    get : function(){ return obj[prop] },
                    set : function(value){//set binding.value --> set property --> property change
                        obj[prop] = value;
                    }
                });
                //object property change -> render element
                addPropertyChangeListener(obj, prop, function(){ render.call(element, binding) });
            })(obj, prop, element, binding, render)
        }
    }
    //first render has included in addPropertyChangeListener as obj[prop]   = _obj[prop];
    render.call(element, binding);
    //element attribute change -> sync data
    addAttributeChangeListener(element, function(){ syncData.call(element,binding); });
}
/*
 *  = ElementBindPrototype
 *  @param  elements        {Element Array}
 *  @param  directive       {String}
 *  @param  object          {Object}
 *  @param  template        {Template}
 * */
function ElementBindPrototype( elements, directive, object, template){
    var len,relative,isScopeDirective,element,binding,ElementBindScope,scopeElementPath,scope,elementPath,parseTemplate,model;
    //handle elements
    if(!elements.length) elements = [elements];
    //handle coreDirective
    directiveArr    = path2Array(directive);
    directiveType   = directiveArr.shift();
    //if relative
    if(!template){
        if(typeof(object) == 'string'){//ElementBind(elements(s), directive, template);
            template    = object;
            relative    = true;
        }else if(typeof(object) == 'object'){//ElementBind(element(s), directive, object);
            //scope directive will only set model
            //isScopeDirective    = true;
        }
    }

    //binding
    len = elements.length;
    while(len--){
        element             = elements[len];
        //scope elementPath
        scopeElementPath    = getScopeElementPathArray(element);
        scope               = scopeElementPath.scope,
        elementPath         = scopeElementPath.elementPath;
        //model
        model               = relative? scope.model : object;
        //bindings
        if(!element.ElementBindScope) element.ElementBindScope      = {};
        ElementBindScope    = element.ElementBindScope;
        if(!ElementBindScope.bindings) ElementBindScope.bindings    = [];
        //template
        parseTemplate = new Template(template||'');
        //binding
        binding = {
            "directiveType" : directiveType,
            "directiveInfo" : directiveArr,
            "element"       : element,
            "template"      : parseTemplate,
            "model"         : model
        }
        ElementBindScope.bindings.push(binding);
        //hang to scope element
        hang2Scope.call(element, scope, elementPath, binding);
        ElementBindCore(element, binding, scope);
    }
}
/*
 *  =ElementBind a route to userdefine bind or prototype elementBind
 *  @param  elements
 *  @param  attributePath
 *  @param  object
 *  @param  propertyPath
 * */
function ElementBind(elements, attributePath, object, propertyPath){
    var self    = this,
        args    = arguments;
    //each element has binding
    if(ElementBind.binding){
        ElementBind.binding.apply(self, args);
    }else{
        ElementBindPrototype.apply(self, args);
    }
}
/*
 * =utility
 * @about   use for custom directive
 * @usage   ElementBind.utility[function name]
 * */
ElementBind.utility = {};
var utility= ElementBind.utility;
/*
 * = tempalateArray2String
 * */
utility.templateArray2String = function(templateArray){
    var len     = templateArray.length,
        result  = '',
        item;
    while(len--){
        item    = templateArray[len];
        if(item.isTemplateItem){
            result  = item.value + result;
        }else{
            result  = item + result;
        }
    }
    return result;
}
/*
 * = matchSet
 * */
utility.matchSet    = function(binding, value){
    var data            = binding.template.parsed,
        len             = data.length,
        regexp          = '',
        index           = 0,
        templateItems   = [],
        item;
    while(len--){
        item    = data[len];
        if(item.isTemplateItem){
            regexp  = '(.*)' + regexp;
            templateItems.unshift(item);
        }else{
            regexp  = item + regexp;
        }
    }
    String(value).replace(new RegExp(regexp, 'gim'), function(match){
        if(match){
            var len = arguments.length - 3,
                i;
            while(len--){
                if(templateItems[len].value != arguments[len+1])
                    templateItems[len].value = arguments[len+1]
            }
        }
    })
}
/*
 * = bindChildren
 * */
utility.bindChildren    = function(scope, element){
    if(!scope.childBinders) return
    var childBinders= scope.childBinders,
        len         = childBinders.length,
        childBinder,elementPath,pathLen,i,child,binding;
    while(len--){
        childBinder = childBinders[len];
        //find element
        elementPath = childBinder.elementPath;
        pathLen     = elementPath.length;
        child       = element;
        for(i=0; i<pathLen; i++) child = child.children[elementPath[i]];
        if(directiveType == 'scope' || directiveType == 'repeat'){//nest children binding
        }else{
            binding = {
                "directiveType" : childBinder.directiveType,
                "directiveInfo" : childBinder.directiveInfo,
                "element"       : child,
                "template"      : childBinder.template,
                "model"         : scope.model
            }
            ElementBindCore(child, binding, scope);
        }
    }
}

/*
 * =directive
 * */
ElementBind.directives  = {}
var directives  = ElementBind.directives;


/*
 * =textContent directive
 * */
directives.textContent  = {}
var textContent = directives.textContent;
/*
 *  =textContentRender model-->view
 *  @param      binding     {Object}
 *  @this       element     {Element}
 * */
textContent.render  = function(binding){
    var element             = this,
        textContent         = ElementBind.utility.templateArray2String(binding.template.parsed);
    if(element.textContent != textContent){//only if really different value will cause textContent change, otherwise will be a circle change.
        element.textContent = textContent;
    }
}
/*
 * =addTextContentChangListener
 * @this    element
 * */
textContent.addAttributeChangeListener  = function(element, callback){
    //onpropertychange for old ie http://stackoverflow.com/questions/1218445/is-there-any-ondocumentchange-event
    //DOMSubtreeModefied for mordern browsers
    //view --> model -->view
    //textContent change --> syncData
    var textContent         = element.textContent;
    //chrome DOMSubtreeModified will trigger twice for 2 steps
    //remove the existing contents
    //insert a new textNode
    element.addEventListener("DOMSubtreeModified", function(){
        if(textContent != element.textContent){//detect textContent change
            callback.call(element);
            textContent = element.textContent;
        }
    },false);
}
/*
 * = textContentSyncData
 * @param   binding {Object}
 * @this    element {Element}
 * */
textContent.syncData    = function(binding){
    ElementBind.utility.matchSet(binding, this.textContent);
}



/*
 * =attributes directive
 * */
directives.attributes   = {}
var attributes  = directives.attributes;
/*
 * =attributes render
 * @about   render means set something to dom
 * */
attributes.render = function(binding){
    var directiveInfo   = binding.directiveInfo,
        attribute       = directiveInfo[0],
        element         = this,
        parsedTemplate  = binding.template.parsed,
        len             = parsedTemplate.length,
        item,value,l2,retainClass,i,k,style,attribute,type,v;
    while(len--){
        value   = parsedTemplate[len].value;
        if(attribute == 'id'){
            element.id  = value;
        }else if(attribute == 'class'){
            l2      = value.length;
            scope   = element.ElementBindScope;
            //retainClass is preserved for init class
            if(!scope.retainClass && scope.retainClass != "") scope.retainClass = element.className;
            type    = typeof(value);
            if(type == 'string'){
                element.className   = scope.retainClass + ' ' + value;
            }else if(type == 'object'){
                element.className   = scope.retainClass + ' ' + value.join(' ');
            }
        }else if(attribute == 'style'){
            if(directiveInfo[1]){//attributes.style.*
                l2      = directiveInfo.length;
                style   = element.style;
                //search style attribute
                for(i=1; i<l2-1; i++) style = style[directiveInfo[i]];
                style[directiveInfo[l2-1]]  = value;
            }else{//attributes.style
                if(typeof(value) == 'string'){
                    v   = value.split(';');
                    l2  = v.length;
                    while(l2--){
                        item    = v[l2].split(':');
                        element.style[item[0].replace(' ','')]  = item[1];
                    }
                }else if(typeof(value) == 'object'){
                    for(k in value) element.style[k] = value[k];
                }
            }
        }else if(attribute == 'value'){
            element.value   = value;
        }else{//custom define
            l2  = directiveInfo.length;
            attribute   = element.attributes;
            for(i=0; i<l2-1; i++){
                if(!attribute[directiveInfo[i]]) attribute[directiveInfo[i]] = {};
                attribute = attribute[directiveInfo[i]];
            }
            attribute[directiveInfo[l2-1]]    = value;
        }
    }
}



/*
 * =dataset directive
 * */
directives.dataset = {}
var dataset = directives.dataset;
/*
 * =dataset render
 * @about   render means set something to dom
 * */
dataset.render = function(binding){
    var directiveInfo   = binding.directiveInfo,
        dLen            = directiveInfo.length,
        element         = this,
        key             = directiveInfo[0],
        i;
    for(i=1; i<dLen; i++)  key += '-'+directiveInfo[i];
    element.setAttribute('data-'+key, ElementBind.utility.templateArray2String(binding.template.parsed))
}


/*
 * =event directive
 * */
directives.event = {}
var event   = directives.event;
/*
 * =scope render
 * @about   render means set something to dom,
 * */
event.render = function(binding){
    var element         = this,
        event           = binding.directiveInfo[0],
        model           = binding.model,
        parsedTemplate  = binding.template.parsed,
        len             = parsedTemplate.length,
        fn,item,len2,item2;
    if(len==0){//ElementBind(element, 'event', object)
        if(typeof(model) == 'function'){
            element.addEventListener(event, model)
        }else if( Object.prototype.toString.call(model) === '[object Array]'){
            l2  = model.length;
            while(l2--){//ElementBind(element, 'event', array)  what if array change?
                item2   = model[l2];
                if(typeof(item2) == 'function') element.addEventListener(event, item2);
            }
        }
    }else{
        while(len--){
            item    = parsedTemplate[len];
            if(item.isTemplateItem) element.addEventListener(event, item.value)
        }
    }
}


/*
 * =scope directive
 * */
directives.scope = {}
var scope   = directives.scope;
/*
 * =scope render
 * @about   render means set something to dom
 * */
scope.render    = function(binding){
    this.ElementBindScope.model = binding.model;
}

/*
 * =repeat directive
 * */
directives.repeat   = {}
var repeat  = directives.repeat;
/*
 *  = repeatRender  function
 *  @about      only the first template item will work
 *  @binding    {Object}
 * */
repeat.render   = function(binding){
    var element         = this,
        scope           = element.ElementBindScope,
        array           = binding.template.parsed[0].value,
        len             = array.length,
        scope,instances,tempElement,i,lastInstance;
    if(!scope.index) scope.index = 0;
    if(!scope.instances) scope.instances    = [];
    if(!scope.prototype) scope.prototype    = element;
    instances       = scope.instances;
    for(i=0; i<len; i++){
        if(i==0){//prototype
            lastInstance    = element;
        }else if(instances[i-1]){//exist instance
            lastInstance    = instances[i-1];
        }else{//new instance
            tempElement = element.cloneNode(true);
            tempElement.ElementBindScope = {
                "prototype"     : element,
                "index"         : i,
                "childBinders"  : scope.childBinders
            }
            element.parentNode.insertBefore(tempElement, lastInstance.nextSibling);
            instances.push(tempElement);
            lastInstance    = tempElement;
        }
        //reset model
        lastInstance.ElementBindScope.model  = array;
        //rebind for all instances
        ElementBind.utility.bindChildren( lastInstance.ElementBindScope, lastInstance );
    }
    //delete more to do
    //while(len++<instances.length){//extra instance
    //    instances[len].parentElement.removeChild(instances[len])
    //    delete instacnes[len];
    //}
}
/*
 * =addRepeatChangListener
 * @this    element
 * */
repeat.addAttributeChangeListener   = function(element, callback){
    //onpropertychange for old ie http://stackoverflow.com/questions/1218445/is-there-any-ondocumentchange-event
    //DOMSubtreeModefied for mordern browsers
    //view --> model -->view
    element.addEventListener("DOMSubtreeModified", function(){
        //console.log('subtree change')
        //callback.call(element);
    });
}
/*
 * =repeatSyncData
 * @param   binding {Object}
 * @this    element {Element}
 * */
repeat.syncData = function(binding){
    //ElementBind.ulitity.matchSet(binding, binding.element.textContent);
}







/*
 *  =bootstrap
 *
 * *
var attachEvent = 'attachEvent',
    addEventListener = 'addEventListener',
    readyEvent = 'DOMContentLoaded';
if( !document[addEventListener] )
    addEventListener =  document[attachEvent]
                        ? (readyEvent = 'onreadystatechange') && attachEvent
                            : '';
window['domReady'] = function(f) {
    /in/.test(document.readyState)
        ? !addEventListener
            ? setTimeout(function() { window['domReady'](f); }, 9)
            : document[addEventListener](readyEvent, f, false)
        : f();
};
domReady(function(){
    walkDocumentTree(function(element){
        //if element.model change
        watchElementModel(element, function(){
            //this point to element
            var element = this,
                bind    = element.bind;
            //bind.call()
        })
    });
});
*/

window.ElementBind  = ElementBind;
})(window, document);

