// Copyright (C) Yendis Entertainment Pty Ltd - All Rights Reserved

'use strict';

// tampermonkey
var window = new Function('return this')();

var CONFIG = {"port":443,"localhost":["localhost","127.0.0.1"],"hosts":{"http":["krunker.io","internal.krunker.io"],"mm":["matchmaker.krunker.io","matchmaker_beta.krunker.io","127.0.0.1:5050"],"api":["api.krunker.io","api_beta.krunker.io","127.0.0.1:5080"],"social":["social.krunker.io","social_beta.krunker.io","127.0.0.1:5070"],"editor":["editor.krunker.io","editor_beta.krunker.io","127.0.0.1:5090"],"assets":["assets.krunker.io"],"userAssets":["user-assets.krunker.io"]},"region":{"default":"de-fra","map":{"fra":"de-fra","sv":"us-ca-sv","syd":"au-syd","tok":"jb-hnd","mia":"us-fl","sin":"sgp","ny":"us-nj"},"reverseMap":{"de-fra":"fra","us-ca-sv":"sv","au-syd":"syd","jb-hnd":"tok","us-fl":"mia","sgp":"sin","us-nj":"ny"}},"isSSL":true,"protocol":{"http":"https:","ws":"wss:"}};

/* CHECK DOMAIN TYPE */
const isLocalhost = CONFIG.localhost.includes(location.hostname);
const isRootDomain = !isLocalhost && location.hostname.split(".").slice(-2).join(".") == location.hostname;

/* PROXY REQUEST MIDDLEWARE */
const middleware = function(url) {
	if (CONFIG.hosts.mm.includes(url.host)) {
		/* MATCHMAKER SERVER REROUTE */
		url.protocol = CONFIG.protocol.http;
		url.hostname = location.hostname;
		url.port = CONFIG.port;
		url.pathname = `/mm${url.pathname}`;
		url.search = url.search.replace(`hostname=${location.hostname}`, `hostname=${CONFIG.hosts.http[0]}`);
		if (url.search.match(/region=/)) {
			if (isLocalhost) {
				/* CHANGE LOCAL REGION TO DEFAULT */
				url.search = url.search.replace("region=local", `region=${CONFIG.region.default}`);
			} else if (!isRootDomain) {
				/* FORCE REGION */
				const region = CONFIG.region.map[location.hostname.split(".")[0]] || CONFIG.region.default;
				url.search = url.search.replace(/region=[\w-]+/g, `region=${region}`);
			}
		}
	} else if (CONFIG.hosts.api.includes(url.host)) {
		/* API SERVER REROUTE */
		url.protocol = CONFIG.protocol.http;
		url.hostname = location.hostname;
		url.port = CONFIG.port;
		url.pathname = `/api${url.pathname}`;
	}
	return url;
}

/* OVERRIDE FETCH */
const _fetch = window.fetch;
window.fetch = async function(...args) {
	try {
		const url = new URL(args[0]);
		args[0] = middleware(url).toString();
	} catch (e) {};
	return _fetch(...args);
}

/* OVERRIDE WEBSOCKET */
window.WebSocket = class WebSocket extends window.WebSocket {
	constructor(...args) {
		const url = new URL(args[0]);
		if (CONFIG.hosts.social.includes(url.host)) {
			/* SOCIAL SERVER REROUTE */
			url.protocol = CONFIG.protocol.ws;
			url.port = "";
			url.host = CONFIG.hosts.social[0];
		} else if (CONFIG.hosts.editor.includes(url.host)) {
			/* EDITOR SERVER REROUTE */
			url.protocol = CONFIG.protocol.ws;
			url.port = "";
			url.host = CONFIG.hosts.editor[0];
		}
		args[0] = `${CONFIG.protocol.ws}//${location.host}/ws?redirect=${btoa(url.toString())}`;
		super(args);
	}
}

/* OVERRIDE XMLHTTPREQUEST */
window.XMLHttpRequest = class XMLHttpRequest extends window.XMLHttpRequest {
	open(...args) {
		try {
			const url = new URL(args[1]);
			if (CONFIG.hosts.assets.includes(url.host)) {
				/* ASSETS (MODELS) REROUTE */
				url.protocol = CONFIG.protocol.http;
				url.hostname = location.hostname;
				url.port = CONFIG.port;
				url.pathname = `/assets${url.pathname}`;
				args[1] = url.toString();
			} else if (CONFIG.hosts.userAssets.includes(url.host)) {
				/* USER ASSETS (MODELS) REROUTE */
				url.protocol = CONFIG.protocol.http;
				url.hostname = location.hostname;
				url.port = CONFIG.port;
				url.pathname = `/user${url.pathname}`;
				args[1] = url.toString();
			} else {
				args[1] = middleware(url).toString();
			}
		} catch (e) {};
		super.open(...args);
	} 
}

/* OVERRIDE CREATE ELEMENT (NAMESPACE VERSION) */
document.createElementNS = new Proxy(document.createElementNS, {
	apply: function(target, prop, args) {
		const img = target.apply(prop, args);

		/* THREE ERROR HANDLER */
		let threeErrorHandler;

		/* CORS ERROR HANDLER */
		function corsErrorHandler() {
			/* REMOVES EXISTING ERROR HANDLER */
			this.removeEventListener('error', corsErrorHandler, false);

			/* ADDS BACK THREE ERROR HANDLER */
			this.addEventListener('error', threeErrorHandler, false);

			/* ASSETS (IMAGES/TEXTURES) REROUTE */
			const url = new URL(this.src);
			if (CONFIG.hosts.assets.includes(url.host)) {
				url.protocol = CONFIG.protocol.http
				url.hostname = location.hostname;
				url.port = CONFIG.port;
				url.pathname = `/assets${url.pathname}`;
			}
			this.src = url.toString();
		}

		/* ADD CORS ERROR HANDLER */
		img.addEventListener('error', corsErrorHandler, false);

		/* PROXY ADDING EVENT LISTENER */
		const _addEventListener = img.addEventListener; 
		img.addEventListener = new Proxy(_addEventListener, {
			apply: function(target, prop, args) {
				if (args[0] == 'error') {
					/* HOOK ADDING THREE ERROR HANDLER */
					threeErrorHandler = args[1];

					/* UNDO PROXY */
					img.addEventListener = _addEventListener;
				} else {
					target.apply(prop, args);
				}
			}
		})

		return img;
	}
})

/* INJECT REFRESH SETTING */
const div = document.createElement('div');
div.className = "settingsBtn";
div.style.cssText = "width: auto;font-size: 14px;padding: 5px 8px;";
div.innerText = "Find";
div.addEventListener("click", function() {
	const regionId = document.getElementById('setBod_local').childNodes[0].childNodes[2].value;
	const regionPrefix = CONFIG.region.reverseMap[regionId] || CONFIG.region.reverseMap[CONFIG.region.default];
	if (isLocalhost) {
		const url = `${CONFIG.protocol.http}//${regionPrefix}.subdomain.com`;
		alert(`REDIRECT - ${url}`);
	} else {
		const url = `${CONFIG.protocol.http}//${regionPrefix}.${location.hostname.split(".").slice(-2).join(".")}`;
		location.href = url;
	}
}, false);

const waitForSettings = setInterval(function() {
	if (!window.windows) return;
	clearInterval(waitForSettings);

	if (!window.windows[0].getSettings) return;
	window.windows[0].getSettings = new Proxy(window.windows[0].getSettings, {
		apply: function(target, prop, args) {
			setTimeout(function() {
				const localBody = document.getElementById('setBod_local');
				if (localBody) {
					const region = localBody.children[0];
					region.innerHTML = region.innerHTML.replace("Default Region", "Proxy Region");
					const select = region.children[0];
					region.insertBefore(div, select);
					[...select.children].filter(o => !CONFIG.region.reverseMap[o.value]).forEach(o => select.removeChild(o));
					select.onchange();
				}
			})
			return target.apply(prop, args);
		}
	})
}, 100);