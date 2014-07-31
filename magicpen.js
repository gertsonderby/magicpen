(function (global, factory) {
    if (typeof exports === 'object') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define(factory);
    } else {
        global.weknowhow = global.weknowhow || {};
        global.weknowhow.magicpen = factory();
    }
}(this, function () {
    var global = this;
    function getKeys(obj) {
        var result = [];

        for (var i in obj) {
            if (obj.hasOwnProperty(i)) {
                result.push(i);
            }
        }

        return result;
    }

    function forEach(arr, callback, that) {
        for (var i = 0, n = arr.length; i < n; i += 1)
            callback.call(that, arr[i], i, arr);
    }

    function map(arr, callback, that) {
        var result = [];
        for (var i = 0, n = arr.length; i < n; i += 1)
            result.push(callback.call(that, arr[i], i, arr));
        return result;
    }

    function filter(arr, callback, that) {
        var result = [];
        for (var i = 0, n = arr.length; i < n; i += 1)
            if (callback.call(that, arr[i], i, arr))
                result.push(arr[i]);
        return result;
    }

    function extend(target) {
        var sources = Array.prototype.slice.call(arguments, 1);
        forEach(sources, function (source) {
            forEach(getKeys(source), function (key) {
                target[key] = source[key];
            });
        });
        return target;
    }

    function isOutputEntry(obj) {
        return typeof obj === 'object' && 'style' in obj && 'args' in obj;
    }

    function duplicateText(content, times) {
        var result = '';
        for (var i = 0; i < times; i += 1) {
            result += content;
        }
        return result;
    }

    // copied from https://github.com/sindresorhus/ansi-regex
    // License https://raw.githubusercontent.com/sindresorhus/ansi-regex/master/license
    var ansiRegex = /\u001b\[(?:[0-9]{1,3}(?:;[0-9]{1,3})*)?[m|K]/g;

    function TextSerializer() {}

    TextSerializer.prototype.serialize = function (lines) {
        return map(lines, this.serializeLine, this).join('\n');
    };

    TextSerializer.prototype.serializeLine = function (line) {
        var serializedLines = [''];

        forEach(line, function (outputEntry, blockIndex) {
            var inlineBlock = this[outputEntry.style] ?
                this[outputEntry.style].apply(this, outputEntry.args) :
                '';

            var blockLines = map(String(inlineBlock).split('\n'), function (serializedBlockLine) {
                return {
                    content: serializedBlockLine,
                    length: serializedBlockLine.replace(ansiRegex, '').length
                };
            });
            var longestBlockLine = 0;
            forEach(blockLines, function (blockLine) {
                longestBlockLine = Math.max(longestBlockLine, blockLine.length);
            });

            var blockStartIndex = serializedLines[0].replace(ansiRegex, '').length;
            serializedLines[0] += blockLines[0].content;
            if (blockLines.length > 1 && blockIndex < line.length - 1) {
                serializedLines[0] += duplicateText(' ', longestBlockLine - blockLines[0].length);
            }

            forEach(blockLines.slice(1), function (blockLine, index) {
                var lineIndex = index + 1;
                serializedLines[lineIndex] = serializedLines[lineIndex] || '';
                var padding = duplicateText(' ', blockStartIndex - serializedLines[lineIndex].replace(ansiRegex, '').length);
                serializedLines[lineIndex] += padding + blockLine.content;
            });
        }, this);

        return serializedLines.join('\n');
    };

    TextSerializer.prototype.text = function (content) {
        return content;
    };

    TextSerializer.prototype.block = function (content) {
        return content;
    };

    var ansiStyles = (function () {
        // Copied from https://github.com/sindresorhus/ansi-styles/
        // License: raw.githubusercontent.com/sindresorhus/ansi-styles/master/license
        var styles = {};

        var codes = {
            bold: [1, 22], // 21 isn't widely supported and 22 does the same thing
            dim: [2, 22],
            italic: [3, 23],
            underline: [4, 24],
            inverse: [7, 27],
            hidden: [8, 28],
            strikeThrough: [9, 29],

            black: [30, 39],
            red: [31, 39],
            green: [32, 39],
            yellow: [33, 39],
            blue: [34, 39],
            magenta: [35, 39],
            cyan: [36, 39],
            white: [37, 39],
            gray: [90, 39],

            bgBlack: [40, 49],
            bgRed: [41, 49],
            bgGreen: [42, 49],
            bgYellow: [43, 49],
            bgBlue: [44, 49],
            bgMagenta: [45, 49],
            bgCyan: [46, 49],
            bgWhite: [47, 49]
        };

        Object.keys(codes).forEach(function (key) {
            var val = codes[key];
            var style = styles[key] = {};
            style.open = '\x1B[' + val[0] + 'm';
            style.close = '\x1B[' + val[1] + 'm';
        });

        return styles;
    }());

    function AnsiSerializer() {}
    AnsiSerializer.prototype = new TextSerializer();

    AnsiSerializer.prototype.text = function (content) {
        if (arguments.length > 1) {
            var stylesString = Array.prototype.slice.call(arguments, 1).join(',');
            var styles = stylesString.split(/\s*,\s*/);
            forEach(styles, function (style) {
                if (ansiStyles[style]) {
                    content = ansiStyles[style].open + content + ansiStyles[style].close;
                }
            });
        }

        return content;
    };

    var htmlStyles = {
        bold: 'font-weight: bold',
        dim: 'opacity: 0.7',
        italic: 'font-style: italic',
        underline: 'text-decoration: underline',
        inverse: '-webkit-filter: invert(%100); filter: invert(100%)',
        hidden: 'visibility: hidden',
        strikeThrough: 'text-decoration: line-through',

        black: 'color: black',
        red: 'color: red',
        green: 'color: green',
        yellow: 'color: yellow',
        blue: 'color: blue',
        magenta: 'color: magenta',
        cyan: 'color: cyan',
        white: 'color: white',
        gray: 'color: gray',

        bgBlack: 'background-color: black',
        bgRed: 'background-color: red',
        bgGreen: 'background-color: green',
        bgYellow: 'background-color: yellow',
        bgBlue: 'background-color: blue',
        bgMagenta: 'background-color: magenta',
        bgCyan: 'background-color: cyan',
        bgWhite: 'background-color: white'
    };

    function HtmlSerializer() {}

    HtmlSerializer.prototype.serialize = function (lines) {
        return '<code>\n' + this.serializeLines(lines) + '\n</code>';
    };

    HtmlSerializer.prototype.serializeLines = function (lines) {
        return map(lines, function (line) {
            return '  <div>' + this.serializeLine(line).join('') + '</div>';
        }, this).join('\n');
    };

    HtmlSerializer.prototype.serializeLine = function (line) {
        return map(line, function (outputEntry) {
            return this[outputEntry.style] ?
                this[outputEntry.style].apply(this, outputEntry.args) :
                '';
        }, this);
    };

    HtmlSerializer.prototype.block = function (content) {
        return '<div style="display: inline-block; vertical-align: top">' + content + '</div>';
    };

    HtmlSerializer.prototype.text = function (content) {
        content = String(content)
            .replace(/&/g, '&amp;')
            .replace(/ /g, '&nbsp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');

        if (arguments.length > 1) {
            var stylesString = Array.prototype.slice.call(arguments, 1).join(',');
            var styles = filter(stylesString.split(/\s*,\s*/), function (styleName) {
                return htmlStyles[styleName];
            });

            content = '<span style="' + map(styles, function (styleName) {
                return htmlStyles[styleName];
            }).join('; ') + '">' + content + '</span>';
        }
        return content;
    };

    function MagicPen(mode) {
        if (this === global) {
            return new MagicPen(mode);
        }

        this.indentationLevel = 0;
        this.output = [];
        this.styles = {};

        this.mode = mode || 'text';
        this.serializer = new MagicPen.serializers[this.mode]();
    }

    MagicPen.prototype.newline = MagicPen.prototype.nl = function (count) {
        if (typeof count === 'undefined') {
            count = 1;
        }

        if (count === 0) {
            return this;
        }

        this.output[0] = this.output[0] || [];

        for (var i = 0; i < count; i += 1) {
            this.output.push([]);
        }
        return this;
    };

    MagicPen.serializers = {
        text: TextSerializer,
        ansi: AnsiSerializer,
        html: HtmlSerializer
    };

    MagicPen.prototype.write = function () {
        if (arguments.length === 1 && isOutputEntry(arguments[0])) {
            var options = arguments[0];
            if (this.styles[options.style]) {
                this.styles[options.style].apply(this, options.args);
                return this;
            }
            this.output[0] = this.output[0] || [];
            this.output[this.output.length - 1].push(options);
            return this;
        } else {
            var args = Array.prototype.slice.call(arguments, 1);
            return this.write({ style: arguments[0], args: args });
        }
    };

    MagicPen.prototype.indentLines = function () {
        this.indentationLevel += 1;
        return this;
    };

    MagicPen.prototype.indent = MagicPen.prototype.i = function () {
        for (var i = 0; i < this.indentationLevel; i += 1) {
            this.space(2);
        }
        return this;
    };

    MagicPen.prototype.outdentLines = function () {
        this.indentationLevel = Math.max(0, this.indentationLevel - 1);
        return this;
    };

    MagicPen.prototype.addStyle = function (style, handler) {
        if (this[style]) {
            throw new Error('"' + style + '" style is already defined');
        }
        this.styles[style] = handler;
        this[style] = function () {
            handler.apply(this, arguments);
            return this;
        };
        return this;
    };

    MagicPen.prototype.toString = function () {
        return this.serializer.serialize(this.output);
    };

    MagicPen.prototype.ensurePenWithSameMode = function (pen) {
        if (!(pen instanceof MagicPen) || pen.mode !== this.mode) {
            throw new Error('Expected an instance of a MagicPen in ' + this.mode + ' mode');
        }
    };

    MagicPen.prototype.text = function () {
        var args = Array.prototype.slice.call(arguments);
        return this.write({ style: 'text', args: args });
    };

    MagicPen.prototype.block = function (pen) {
        this.ensurePenWithSameMode(pen);
        return this.write('block', pen.toString());
    };

    MagicPen.prototype.append = function (pen) {
        this.ensurePenWithSameMode(pen);
        if (pen.output.length === 0) {
            return this;
        }

        this.output[0] = this.output[0] || [];
        var lastLine = this.output[this.output.length - 1];
        Array.prototype.push.apply(lastLine, pen.output[0]);

        this.output.push.apply(this.output, pen.output.slice(1));

        return this;
    };

    MagicPen.prototype.prependLinesWith = function (pen) {
        this.ensurePenWithSameMode(pen);
        if (pen.output.length === 0 || this.output.length === 0) {
            return this;
        }

        if (pen.output.length > 1) {
            throw new Error('PrependLinesWith only supports a pen with single line content');
        }

        var outputToPrepend = [].concat(pen.output[0]);

        this.output = map(this.output, function (line) {
            return outputToPrepend.concat(line);
        });

        return this;
    };

    MagicPen.prototype.space = MagicPen.prototype.sp = function (count) {
        if (count === 0) {
            return this;
        }

        if (typeof count === 'undefined') {
            count = 1;
        }

        this.text(duplicateText(' ', count));
        return this;
    };

    forEach([
        'bold', 'dim', 'italic', 'underline', 'inverse', 'hidden',
        'strikeThrough', 'black', 'red', 'green', 'yellow', 'blue',
        'magenta', 'cyan', 'white', 'gray', 'bgBlack', 'bgRed',
        'bgGreen', 'bgYellow', 'bgBlue', 'bgMagenta', 'bgCyan',
        'bgWhite'
    ], function (textStyle) {
        MagicPen.prototype[textStyle] = function (content) {
            return this.text.call(this, content, textStyle);
        };
    });

    MagicPen.prototype.clone = function () {
        function MagicPenClone() {}
        MagicPenClone.prototype = this;
        var clonedPen = new MagicPenClone();
        clonedPen.serializer = new MagicPen.serializers[this.mode]();
        clonedPen.styles = extend({}, this.styles);
        clonedPen.indentationLevel = 0;
        clonedPen.output = [];
        return clonedPen;
    };

    return MagicPen;
}));
