'use strict';

const {head} = require('../utils');
const {openSignatureInWebURL} = require('../urls');
const {valueLabel, valueName, callSignature} = require('../kite-data-utils');
const {
  highlightChunk,
  wrapLine,
  wrapPre,
} = require('../highlighter');

function processContent(content) {
  return wrapPre(
    content.split('\n')
    .map(highlightChunk)
    .map(wrapLine)
    .join(''));
}

class KiteSignature extends HTMLElement {
  static initClass() {
    return document.registerElement('kite-signature', {
      prototype: this.prototype,
    });
  }

  detachedCallback() {
    if (this.parentNode) {
      this.parentNode.maxVisibleSuggestions = atom.config.get('autocomplete-plus.maxVisibleSuggestions');
      this.parentNode.removeChild(this);
    }
  }

  attachedCallback() {
    this.parentNode.maxVisibleSuggestions = this.compact
      ? atom.config.get('autocomplete-plus.maxVisibleSuggestions')
      : atom.config.get('kite.maxVisibleSuggestionsAlongSignature');

    this.checkWidth();
  }

  openInWeb() {
    const link = this.querySelector('kite-open-link');
    link && link.open();
  }

  setData(data, compact = false) {
    const call = head(data.calls);
    const name = valueName(call.callee);
    let extendedContent = '';

    if (!compact) {
      const patterns = call.signatures && call.signatures.length
      ? `
      <section>
      <h4>Popular Patterns</h4>
      <pre>${
        processContent(
          call.signatures
          .map(s => callSignature(s))
          .map(s => `${name}(${s})`)
          .join('\n'))
        }</pre>
        </section>`
        : '';
      extendedContent = `
      ${patterns}
      <kite-open-link data-url="${openSignatureInWebURL(call.callee.id)}"></kite-open-link>
      `;
    }

    this.innerHTML = `
    <div class="kite-signature-wrapper">
      <div class="name">${valueLabel(call.callee, call.arg_index)}</div>
      ${extendedContent}
    </div>
    `;

    this.compact = compact;
    this.currentIndex = call.arg_index;

    if (this.parentNode) {
      this.checkWidth();
    }
  }

  checkWidth() {
    const name = this.querySelector('.name');
    if (name && name.scrollWidth > name.offsetWidth) {
      const missingWidth = name.scrollWidth - name.offsetWidth;
      const signature = name.querySelector('.signature');
      const parameters = [].slice.call(name.querySelectorAll('.parameter'));
      const half = name.scrollWidth;
      const parameter = parameters[this.currentIndex];
      const middle = parameter ?
        parameter.offsetLeft - parameter.offsetWidth / 2
        : half + 1;
      const removed = [];
      let gainedWidth = 0;
      const currentIndex = this.currentIndex;

      if (middle > half) {
        truncateLeft();

        if (gainedWidth < missingWidth) { truncateRight(); }
      } else {
        truncateRight();
        if (gainedWidth < missingWidth) { truncateLeft(); }
      }

      function truncateLeft() {
        const ellipsis = document.createElement('span');
        ellipsis.className = 'parameter ellipsis';
        ellipsis.textContent = '…0 more, ';
        signature.insertBefore(ellipsis, signature.firstElementChild);

        for (let i = 0; i < currentIndex; i++) {
          const parameter = parameters[i];
          removed.push(parameter);
          gainedWidth += parameter.offsetWidth;

          if (gainedWidth - ellipsis.offsetWidth >= missingWidth) {
            gainedWidth -= ellipsis.offsetWidth;
            removed.forEach(el => el.remove());
            ellipsis.textContent = `…${removed.length} more, `;
            removed.length = 0;
            return;
          }
        }

        if (removed.length) {
          gainedWidth -= ellipsis.offsetWidth;
          removed.forEach(el => el.remove());
          ellipsis.textContent = `…${removed.length} more, `;
          removed.length = 0;
        } else {
          ellipsis.remove();
        }
      }

      function truncateRight() {
        const ellipsis = document.createElement('span');
        ellipsis.className = 'parameter ellipsis';
        ellipsis.textContent = '0 more…';
        signature.appendChild(ellipsis);

        for (let i = parameters.length - 1; i > currentIndex; i--) {
          const parameter = parameters[i];
          removed.push(parameter);
          gainedWidth += parameter.offsetWidth;

          if (gainedWidth - ellipsis.offsetWidth >= missingWidth) {
            gainedWidth -= ellipsis.offsetWidth;
            removed.forEach(el => el.remove());
            ellipsis.textContent = `${removed.length} more…`;
            removed.length = 0;
            return;
          }
        }

        if (removed.length) {
          gainedWidth -= ellipsis.offsetWidth;
          removed.forEach(el => el.remove());
          ellipsis.textContent = `${removed.length} more…`;
          removed.length = 0;
        } else {
          ellipsis.remove();
        }
      }
    }
  }
}

module.exports = KiteSignature.initClass();