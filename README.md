Element.Bind
============

##directives
###built-in directive

* textContent
* attributes
* dataset
* event
* scope
* repeat

####textContent
most usable directive, {{}} need for template parse, object is the scope of template,if it's undefined , it will search the parent element, top is window.

    ElementBind($('#textContent'), 'textContent', data, '{{textContent.path[0].to[0].value}}');
    ElementBind($('#textContent1'), 'textContent', data.textContent, '{{a}} and {{b}} is result');
    ElementBind($('#textContent2'), 'textContent', data.textContent.path[0], '{{to[0].value}}');
    ElementBind($('#textContent3'), 'textContent', data.textContent.path[0].to[0], '{{value}}');

####attributes
it will change the element's attribute,
if directive is attributes.class and template binding data is Array,Array.join(' ') will be called before.
if directive is attributes.style and template binding data is Object,Object will be rendered to "display: block;" like string.
other attribute will refer to original element.attributes
always two way binding, multi template will be the same, always match the template.

    ElementBind($('#attributesId'), 'attributes.id', data.attributes, '{{id}}');
    ElementBind($('#attributesClass'), 'attributes.class', data.attributes, '{{class.string}}');
    ElementBind($('#attributesClass1'), 'attributes.class', data.attributes, '{{class.array}}');
    ElementBind($('#attributesClass2'), 'attributes.class', data.attributes, '{{class2}}');
    ElementBind($('#attributesStyle'), 'attributes.style', data.attributes, '{{style.string}}');
    ElementBind($('#attributesStyle1'), 'attributes.style', data.attributes, '{{style.object}}');
    ElementBind($('#attributesStyleTop'), 'attributes.style.top', data.attributes.styleTop, '{{top}}');
    ElementBind($('#attributesCustom'), 'attributes.custom.define', data.attributes, '{{custom}}');
    ElementBind($('#attributesValue'), 'attributes.value', data.attributes, '{{value}}');


####dataset
dataset.data.set.content will point to attribute data-data-set-content

    ElementBind($('#dataset'), 'dataset.data.set.content', data.dataset, '{{foo}}');

####event
it will bind event and will fixed some problem on different browsers,prefix free is supported in directive.
if property is undefined, absolute event will be binded,property is relative.
target event will be {{}}.

    //ElementBind($('#event'), 'event.click', data.event.click);//not recommend
    ElementBind($('#event1'), 'event.click', data.event, '{{click}}');
    ElementBind($('#event1'), 'event.click', data.event, '{{click}}{{click2}}');
    //ElementBind($('#event'), 'event.transitionEnd', data.event, 'transitionEnd');

####scope
it will set model for element, and set element model will trigger scopeBinding,
if parent element binded a scope, child binding will inhert it.
it's a invisible directive, so no need for userdefined.
root scope is window.

    ElementBind($('#scope'), 'scope', data.scope);
    ElementBind($('#scopeItem'), 'textContent', '{{path.to.data}}');

####repeat
it will repeat the element and bind the child bindings for new element,
each repeat element will own a scope of data[$index],
$index in template will be replace with the repeat index,

    ElementBind($('.array'), 'repeat', data, '{{arr}}');
    ElementBind($('.arrayItem'), 'textContent', '{{$index}}');
    ElementBind($('.arrayItem2'), 'textContent', '{{[$index]}}');

####custom binding
all directives will turn to call this function,use for custom directive

    ElementBind.binding = function(element, directive, object, template){//custom bind for follow use
        if(directive == 'repeat'){
            console.log('hi')
            //handle
        }else ElementBind.prototype.bind.apply(this, arguments);
    }

####unbind
ElementBind will return a binding which can be use in ElementBind.unbind

    var bindId  = ElementBind($('#unbind'), 'textContent', data.textContent.path[0].to[0], 'value');
    ElementBind.unbind(bindId);
