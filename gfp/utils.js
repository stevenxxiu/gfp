
function $X(x, t, r) {
    if (t && t.tagName) 
        var h = r, r = t, t = h;    
    var d = r ? r.ownerDocument || r : r = document, p;
    switch (t) {
    case XPathResult.NUMBER_TYPE:
        p = 'numberValue';
        break;
    case XPathResult.STRING_TYPE:
        p = 'stringValue';
        break;
    case XPathResult.BOOLEAN_TYPE:
        p = 'booleanValue';
        break;
    case XPathResult.ANY_UNORDERED_NODE_TYPE: 
    case XPathResult.FIRST_ORDERED_NODE_TYPE:
        p = 'singleNodeValue';
        break;
    default:
        return d.evaluate(x, r, null, t || XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    }
    return d.evaluate(x, r, null, t, null)[p];
}

function isInDom(element){
	while (element = element.parentNode) {
		if (element == document) {
			return true;
		}
	}
	return false;
}
