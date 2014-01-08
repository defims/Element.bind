;(function(window, document, undefined){
/*
 * =hang2Scope
 * @about   scope chain is base on dom tree
 * */
function hangToParentScope(element, binding){
    //get scope elementPath
    var scopeAndPath    = ElementBind.utility.getParentScopeAndElementPath(element),
        parentScope     = scopeAndPath.parentScope,
        elementPath     = scopeAndPath.elementPath,
        isNewBinder     = true,
        childBinders,childBinder,len;
    parentScope.childBinders    = parentScope.childBinders || [];
    childBinders                = parentScope.childBinders;
    while(len--){
        childBinder = childBinders[len];
        if( childBinder.elementPath.join('#') == elementPath.join('#')
            && childBinder.directive
            && childBinder.directive.type == binding.directive.type
            && childBinder.directive.detail.join('#') == binding.directive.detail.join('#')
        ){
            childBinder.template    = binding.template;
            isNewBinder               = false;
        }
    }
    if(isNewBinder)
        childBinders.push({
            "elementPath"   : elementPath,
            "template"      : binding.template,
            "directive"     : binding.directive
        });
}
/*
 * =twoWayBind
 * */
function twoWayBind(){

}
/*
 * =compile
 * @about ElementBind(element, 'directive', model, 'template') will compile to a scope
 * */
function compile(elements, directive, model, template){
    if(!elements.length) elements   = [elements];
    if(!template && typeof(model) == 'string'){//ElementBind(element(s), 'directive', template);
        template    = model;
        model       = undefined;
        //scope directive will only set model
    }
    var scope,bindings,binding,eleLen,element,directiveArr;
    eleLen  = elements.length
    while(eleLen--){
        element = elements[eleLen];
        //scope
        element.ElementBindScope    = element.ElementBindScope || {};
        scope                       = element.ElementBindScope;
        //absolute model
        if(model) scope.model       = model;
        //bindings
        scope.bindings              = scope.bindings || [];
        directiveArr                = ElementBind.utility.path2Array(directive);
        binding                     = {
            "directive" : {
                "type"   : directiveArr.shift(),
                "detail" : directiveArr
            },
            "template"  : new ElementBind.utility.Template(template || '')
        }
        scope.bindings.push(binding);
        //hang to parent scope
        hangToParentScope(element, binding);
        //two way bind
        twoWayBind(element, scope);
    }
}
/*
 * =ElementBind
 * */
function ElementBind(){
    compile.apply(this, arguments);
}
window.ElementBind  = ElementBind;
/*
 * =utility
 * */
ElementBind.utility = {};
var utility = ElementBind.utility;
/*
 *  =utility.path2Array
 *  @param  path        {String}
 *  @return pathArray   {Array}
 * */
utility.path2Array  = function(path){
    return path.replace(/^\[/g,'').replace(/\[/g,'.').replace(/\]/g,'').split('.');
}
/*
 *  = getParentScopeAndElementPath get scope and element path array
 *  @param  element            {Element}
 *  @return scopeElementPath   {Object}
 * */
utility.getParentScopeAndElementPath = function(element){//search dom tree then search scope or search scope then search dom tree? or use dom to storage scope
    var pathArr = [],
        win     = window,
        ElementBindScope,scope,children,parent;
    element = element.parentElement;
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
        parentScope : scope,
        elementPath : pathArr
    }
}
/*
* =utility.Template Constructor
* @param   str     {String}
* @member  origin  {String}
* @member  data    {Array}
* */
utility.Template    = function(str){
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
            if(item) parsed.unshift({
                isTemplateItem  : true,
                template        : '{{'+item+'}}',
                path            : utility.path2Array(item)
            });
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
})(window, document, undefined)
