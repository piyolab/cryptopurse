window.Clipboard = (function(window, document, navigator) {
    var textArea,
        copy;

    function isOS() {
        return navigator.userAgent.match(/ipad|iphone/i);
    }

    function createTextArea(text) {
        textArea = document.createElement('textArea');
        textArea.value = text;
        document.body.appendChild(textArea);
    }

    function createTextAreaOnModal(text, modal) {
        textArea = document.createElement('textArea');
        textArea.value = text;
        modal.appendChild(textArea);
    }

    function selectText() {
        var range,
            selection;

        if (isOS()) {
            range = document.createRange();
            range.selectNodeContents(textArea);
            selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
            textArea.setSelectionRange(0, 999999);
        } else {
            textArea.select();
        }
    }

    function copyToClipboard() {
        document.execCommand('copy');
        document.body.removeChild(textArea);
    }

    function copyToClipboardOnModal(modal) {
        document.execCommand('copy');
        modal.removeChild(textArea);
    }


    copy = function(text) {
        createTextArea(text);
        selectText();
        copyToClipboard();
    };

    copyOnModal = function(text, modal) {
        createTextAreaOnModal(text, modal);
        selectText();
        copyToClipboardOnModal(modal);
    };

    return {
        copy: copy,
        copyOnModal: copyOnModal
    };
})(window, document, navigator);
