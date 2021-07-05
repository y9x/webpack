'use strict';

var { Select, Option } = require('./Select'),
	{ Slider } = require('./Slider'),
	{ Checkbox } = require('./Checkbox'),
	{ Switch } = require('./Switch'),
	{ Input } = require('./Input'),
	{ Button } = require('./Button');

customElements.define('ez-checkbox', Checkbox);
customElements.define('ez-select', Select);
customElements.define('ez-option', Option);
customElements.define('ez-slider', Slider);
customElements.define('ez-input', Input);
customElements.define('ez-switch', Switch);
customElements.define('ez-button', Button);