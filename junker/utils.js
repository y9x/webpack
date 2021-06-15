'use strict';

class Utils {
	get head(){
		return document.head || document.getElementsByTagName("head")[0] || document.documentElement;
	}
	isType(item, type){
		return typeof item === type;
	}
	isDefined(object){
		return !this.isType(object, "undefined") && object !== null;
	}
	isURL(str){
		return /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/gm.test(str);
	}
	objectHas(obj, arr){
		return arr.some(prop => obj.hasOwnProperty(prop));
	}
	genHash(sz){
		return [...Array(sz)].map(_ => 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'[~~(Math.random()*52)]).join('');
	}
	loadScript(data){
		try {
			var script = null;
			if (this.isType(data, 'string')) {
				if (this.isURL(data)) {
					this.request(data, "text", {cache: "no-store"}).then((str)=>this.loadScript(str));
				} else {
					script = document.createElement("script");
					script.appendChild(document.createTextNode(data));
				}
			} else if (this.isType(data, 'function')) {
				script = document.createElement("script");
				script.textContent = `try {(${data})()}catch(e){console.error(e)}`;
			}
			if (script) this.head.appendChild(script);
		} catch (ex) {console.error(ex)}
		if (script && script.parentNode) script.parentNode.removeChild(script);
		if (script && script.hasAttribute("textContent")) script.removeAttribute("textContent");
	}
	loadStyle(url){
		let link = document.createElement('link');
		link.rel = "stylesheet";
		link.type = "text/css";
		link.href = url;
		return this.head.appendChild(link);
	}
	loadFrame(attributes){
		let frame = document.createElement('iframe');
		Object.entries(attributes).forEach(([type, rules], index) => {
			frame.setAttribute(type, ...rules);
		})
		return this.head.appendChild(frame);
	}
	patchData(data, patches){
		for(let name in patches) {
			let object = patches[name];
			let found = object.regex.exec(data);
			if (found) {
				data = data.replace(object.regex, object.patch);
				console.info("Patched ", name);
			} else alert("Failed to Patch " + name);
		}
		return data;
	}
	getData(data, mangled){
		let returnObj = {};
		for(let name in mangled) {
			let object = mangled[name];
			let found = object.regex.exec(data);
			if (object.hasOwnProperty('index')) {
				if (found) {
					object.val = found[object.index];
					console.info("Found ", name, ":", object);
				} else {
					object.val = null;
					alert("Failed to Find " + name);
				}
				Object.defineProperty(returnObj, name, {
					configurable: false,
					value: object.val
				});
			}
		}
		return returnObj;
	}
	saveData(name, data){
		let blob = new Blob([data], {type: 'text/plain'});
		let el = window.document.createElement("a");
		el.href = window.URL.createObjectURL(blob);
		el.download = name;
		window.document.body.appendChild(el);
		el.click();
		window.document.body.removeChild(el);
	}
	createObserver(elm, check, callback, onshow = true){
		return new MutationObserver((mutationsList, observer) => {
			if (check == 'src' || onshow && mutationsList[0].target.style.display == 'block' || !onshow) {
				callback(mutationsList[0].target);
			}
		}).observe(elm, check == 'childList' ? {childList: true} : {attributes: true, attributeFilter: [check]});
	}
	createElement(element, attribute, inner){
		if (!this.isDefined(element)) {
			return null;
		}
		if (!this.isDefined(inner)) {
			inner = "";
		}
		let el = document.createElement(element);
		if (this.isType(attribute, 'object')) {
			for (let key in attribute) {
				el.setAttribute(key, attribute[key]);
			}
		}
		if (!Array.isArray(inner)) {
			inner = [inner];
		}
		for (let i = 0; i < inner.length; i++) {
			if (inner[i].tagName) {
				el.appendChild(inner[i]);
			} else {
				el.appendChild(document.createTextNode(inner[i]));
			}
		}
		return el;
	}
	createButton(name, iconURL, fn, visible){
		visible = visible ? "inherit":"none";
		this.waitFor(_=>document.querySelector("#menuItemContainer")).then(menu => {
			let icon = this.createElement("div",{"class":"menuItemIcon", "style":`background-image:url("${iconURL}");display:inherit;`});
			let title= this.createElement("div",{"class":"menuItemTitle", "style":`display:inherit;`}, name);
			let host = this.createElement("div",{"id":"mainButton", "class":"menuItem", "onmouseenter":"playTick()", "onclick":"showWindow(12)", "style":`display:${visible};`},[icon, title]);
			if (menu) menu.append(host)
		})
	}
	async request(url, type, opt = {}){
		const res = await fetch(url, opt);
		
		if(res.ok)return await res[type]();
		
		console.error('Could not fetch', url);
		
		return '';
		// return this.nin.request(url, type, opt);
	}
	async waitFor(test, timeout_ms = Infinity, doWhile = null){
		let sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
		return new Promise(async (resolve, reject) => {
			if (typeof timeout_ms != "number") reject("Timeout argument not a number in waitFor(selector, timeout_ms)");
			let result, freq = 100;
			while (result === undefined || result === false || result === null || result.length === 0) {
				if (doWhile && doWhile instanceof Function) doWhile();
				if (timeout_ms % 1e4 < freq) console.log("waiting for: ", test);
				if ((timeout_ms -= freq) < 0) {
					console.error( "Timeout : ", test );
					resolve(false);
					return;
				}
				await sleep(freq);
				result = typeof test === "string" ? Function(test)() : test();
			}
			console.info("Passed : ", test);
			resolve(result);
		});
	}
}

module.exports = Utils;