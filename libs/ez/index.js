'use strict';

var { Select, Option } = require('./select'),
	{ Slider } = require('./slider'),
	{ Checkbox } = require('./checkbox'),
	{ Input } = require('./input');

customElements.define('ez-select', Select);
customElements.define('ez-option', Option);
customElements.define('ez-slider', Slider);
customElements.define('ez-checkbox', Checkbox);
customElements.define('ez-input', Input);

exports.Checkbox = Checkbox;
exports.Select = Select;
exports.Option = Option;
exports.Slider = Slider;
exports.Input = Input;