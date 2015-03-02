(function(window) {
'use strict';

var proto = Object.create(HTMLElement.prototype);

var template =
`<style>
@import '../components/gaia-icons/gaia-icons-embedded.css';

gaia-dom-tree {
  width: 100%;
  height: 100%;
}

.pin {
  position: absolute;
  top: 0;
  right: 0;
  margin: 1rem !important;

  opacity: 1;

  transition: opacity 0.5s ease-in-out;
}

.pin.scrolling {
  pointer-events: none;

  opacity: 0;
}
</style>
<gaia-button circular class="pin" data-action="settings">
  <i data-icon="settings"></i>
</gaia-button>
<gaia-dom-tree></gaia-dom-tree>
<gaia-css-inspector></gaia-css-inspector>
<gaia-modal>
  <p>lorem ipsum...</p>
</gaia-modal>`;

proto.createdCallback = function() {
  this.shadow = this.createShadowRoot();
  this.shadow.innerHTML = template;

  this.settingsButton = this.shadow.querySelector('[data-action="settings"]');
  this.gaiaDomTree = this.shadow.querySelector('gaia-dom-tree');
  this.gaiaCssInspector = this.shadow.querySelector('gaia-css-inspector');
  this.gaiaModal = this.shadow.querySelector('gaia-modal');

  this.settingsButton.addEventListener(
    'click', this._handleMenuAction.bind(this));
  this.gaiaDomTree.addEventListener(
    'click', this._handleSelected.bind(this));
  this.gaiaDomTree.addEventListener(
    'longpressed', this._handleLongPressed.bind(this));

  this._watchScrolling();

  this.gaiaDomTree.addEventListener('contextmenu', (evt) => {
    evt.stopPropagation();
  });
};

proto.setRootNode = function(rootNode) {
  this._root = rootNode;

  rootNode.addEventListener('click', this._handleClick.bind(this));

  this.gaiaDomTree.setRoot(rootNode);
  this.gaiaDomTree.render();

  this.watchChanges();
};

proto._watchScrolling = function() {
  this.gaiaDomTree.shadowRoot.addEventListener('scroll',
  (evt) => {
    if (this._scrollTimeout) {
      clearTimeout(this._scrollTimeout);
    }

    this._scrollTimeout = setTimeout(() => {
      this.settingsButton.classList.remove('scrolling');
    }, 500);

    this.settingsButton.classList.add('scrolling');
  }, true);
};

/**
 * Helper to walk the entire DOM, resolving shadow roots to their shadow hosts
 * along the way.
 */
proto._walkShadowTree = function(el, cb) {
  if (!el || el == document.documentElement) {
    return null;
  } else if (cb(el)) {
    return el;
  }

  return this._walkShadowTree(el.parentNode || el.host, cb);
};

/**
 * Checks if an element is attached anywhere to the DOM, including inside a
 * shadow DOM.
 */
proto._shadowContains = function(el) {
  return this._walkShadowTree(el, (node) => node == document.body);
};

/**
 * Checks if an element is attached anywhere to the Customizer, including inside
 * a shadow DOM.
 */
proto._customizerContains = function(el) {
  var customizerRootView =
    document.body.querySelector('.fxos-customizer-main-view');

  return this._walkShadowTree(el, (node) => node == customizerRootView);
};

/**
 * Selects the currently selected element, or if it was deleted/detached, its
 * nearest parent.
 */
proto._selectNearest = function() {
  if (!this._selected || !this._selectionTree || !this._selectionTree.length) {
    return;
  }

  var selection;
  for (var i = 0; i < this._selectionTree.length; i++) {
    selection = this._selectionTree[i];
    if (this._shadowContains(selection)) {
      this.select(selection);
      return;
    }
  }
};

proto.watchChanges = function() {
  const OBSERVER_CONFIG = {
    childList: true,
    attributes: true,
    characterData: true,
    subtree: true
  };

  this._observer = new MutationObserver((mutations) => {
    // Only re-render if a mutation occurred outside of the <fxos-customizer>
    // shadow root.
    for (var i = mutations.length - 1; i >= 0; i--) {
      if (!this._customizerContains(mutations[i].target)) {
        this.gaiaDomTree.render();
        // Restore selection, or set it to the closest remaining parent.
        this._selectNearest();
        return;
      }
    }
  });

  this._observer.observe(this._root, OBSERVER_CONFIG);
};

proto.unwatchChanges = function() {
  this._observer.disconnect();
};

/**
 * Builds a flattened version of the path from a selection node up to the
 * document root, resolving shadow roots to shadow hosts along the way.
 */
proto._buildSelectionTree = function(el) {
  this._selected = el;
  this._selectionTree = [];
  this._walkShadowTree(el, (node) => {
    this._selectionTree.push(node);
    return false;
  });
};

proto.select = function(el) {
  this.gaiaDomTree.select(el);
  this._buildSelectionTree(el);
};

proto._handleMenuAction = function(e) {
  var action = e.target.dataset.action;
  if (action) {
    console.log(action);
    this.dispatchEvent(new CustomEvent('menu', {
      detail: action
    }));
  }
};

proto._handleSelected = function(e) {
  e.stopPropagation();

  var selectedNode = this.gaiaDomTree.selectedNode;
  if (selectedNode.nodeType === Node.TEXT_NODE) {
    selectedNode = selectedNode.parentNode;
  }
  this._buildSelectionTree(selectedNode);

  this.dispatchEvent(new CustomEvent('selected', {
    detail: selectedNode
  }));
};

proto._handleLongPressed = function(e) {
  this._handleSelected(e);

  this.dispatchEvent(new CustomEvent('action', {
    detail: this._selected
  }));
};

proto._handleClick = function(e) {
  if (e.target === this.gaiaDomTree) {
    return;
  }

  this.select(e.target);
};

document.registerElement('fxos-customizer', {
  prototype: proto
});

})(window);
