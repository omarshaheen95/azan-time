// Updates a screen in place from its new HTML, changing only the text and attributes that differ. Home and Today
// redraw every second; replacing their nodes would lose a click pressed across the redraw and the keyboard focus.

export function morph(root: HTMLElement, html: string) {
  const next = document.createElement(root.tagName);
  next.innerHTML = html;
  patchChildren(root, next);
}

function patchChildren(cur: Node, next: Node) {
  const a = Array.from(cur.childNodes), b = Array.from(next.childNodes);
  for (let i = 0; i < b.length; i++) {
    if (i >= a.length) cur.appendChild(b[i]);
    else patch(a[i], b[i]);
  }
  for (let i = b.length; i < a.length; i++) cur.removeChild(a[i]);
}

function patch(cur: Node, next: Node) {
  if (cur.nodeType !== next.nodeType || cur.nodeName !== next.nodeName) {
    cur.parentNode!.replaceChild(next, cur);
    return;
  }
  if (cur.nodeType === Node.TEXT_NODE) {
    if (cur.nodeValue !== next.nodeValue) cur.nodeValue = next.nodeValue;
    return;
  }
  if (cur instanceof Element && next instanceof Element) {
    for (const { name } of Array.from(cur.attributes)) if (!next.hasAttribute(name)) cur.removeAttribute(name);
    for (const { name, value } of Array.from(next.attributes)) if (cur.getAttribute(name) !== value) cur.setAttribute(name, value);
  }
  patchChildren(cur, next);
}
