'use strict';

var add_ele = (tag, par, atr) => Object.assign(par.appendChild(document.createElement(tag)), atr),
	tree = (nodes, parent = document) => {
		var output = {
				parent: parent,
			},
			match_container = /^\$\s+>?/g,
			match_parent = /^\^\s+>?/g;
		
		for(var label in nodes){
			var value = nodes[label];
			
			if(value instanceof Node)output[label] = value;
			else if(typeof value == 'object')output[label] = tree(value, output.container);
			else if(match_container.test(nodes[label])){
				if(!output.container){
					console.warn('No container is available, could not access', value);
					continue;
				}
				
				output[label] = output.container.querySelector(nodes[label].replace(match_container, ''));
			}else if(match_parent.test(nodes[label])){
				if(!output.parent){
					console.warn('No parent is available, could not access', value);
					continue;
				}
				
				output[label] = output.parent.querySelector(nodes[label].replace(match_parent, ''));
			}else output[label] = parent.querySelector(nodes[label]);
			
			if(!output[label])console.warn('No node found, could not access', value);
		}
		
		return output;
	};

document.querySelectorAll('.discord-invite[data-invite]').forEach(async node => {
	create_invite(node, node.dataset.code);
});

class DiscordInvite extends HTMLElement {
	constructor(){
		super();
		
		this.attachShadow({ mode: 'open' });
	}
	async load(code){
		var shadow = this.shadowRoot;
		
		for(let weight of [ 400, 500, 600, 700 ])new FontFace('Whitney', `url('./whitney${weight}.woff')`, { weight: weight }).load().then(loaded => document.fonts.add(loaded));
		
		shadow.innerHTML = `<style>
.wrapper {
	width: 400px;
	height: 74px;
	background: #2f3136;
	border-radius: 4px;
	padding: 16px;
	user-select: none;
	--image-fail: url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22200%22%20height%3D%22104%22%20xmlns%3Axlink%3D%22http%3A%2F%2Fwww.w3.org%2F1999%2Fxlink%22%3E%3Cdefs%3E%3Cpath%20id%3D%22a%22%20d%3D%22M0%2086V.34h186.092V86z%22%2F%3E%3Cpath%20id%3D%22c%22%20d%3D%22M.8.998h47.02v48.524H.8V.998z%22%2F%3E%3C%2Fdefs%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cpath%20fill%3D%22%234F545C%22%20d%3D%22M92.824%2075.14c4.414-3.337%2010.597-3.36%2015.037-.06.45.33.58.983.25%201.425-.33.445-.91.566-1.36.24l-.07-.056c-3.73-2.78-8.93-2.76-12.64.04-.18.13-.39.2-.6.2-.3%200-.6-.14-.8-.4-.33-.44-.24-1.07.2-1.4M77.17%2057.4c2.882%200%205.218%202.335%205.218%205.217%200%202.88-2.336%205.215-5.217%205.215-2.88%200-5.21-2.336-5.21-5.216%200-2.883%202.34-5.22%205.22-5.22m46.96%200c2.88%200%205.22%202.337%205.22%205.22%200%202.88-2.33%205.215-5.21%205.215s-5.21-2.33-5.21-5.21%202.34-5.22%205.22-5.22m8.06%2017.53c.49-.06.98-.16%201.46-.28.54-.14%201.09.17%201.23.71.15.53-.17%201.08-.7%201.23-.56.15-1.15.27-1.73.34-.04.01-.08.01-.12.01-.49%200-.93-.37-.99-.87-.07-.54.32-1.04.87-1.11M83.06%2019.32c-2.836.682-4.57%201.29-4.963%201.43l-.063.03c-3.54%201.43-5.83%204.822-5.83%208.636%200%202.096.72%204.1%202.08%205.797.01.01.014.023.02.03.004.007.01.01.014.014.028.038%202.78%203.767%207.73%204.16.55.042.96.524.917%201.075-.04.523-.477.92-.994.92-.02%200-.05%200-.08-.002-4.65-.37-7.59-3.135-8.7-4.382l-1.13.423c-.04.02-.08.04-.12.05-6.31%202.36-10.39%207.92-10.39%2014.17%200%202.61.74%205.2%202.13%207.48.15.25.19.55.11.82-.08.28-.28.5-.54.62-7.74%203.47-12.74%2011-12.74%2019.2%200%2011.71%209.83%2021.23%2021.9%2021.23%207.97%200%2016.76-1.53%2026.13-4.56.74-.32%209.7-4.12%2022.44-3.55.55.03.98.49.96%201.05-.02.56-.47%201.01-1.04.96-8.77-.39-15.78%201.41-19.24%202.55%206.46%202.37%2015.69%203.58%2027.5%203.58%2010.68%200%2019.37-8.68%2019.37-19.37%200-4.99-1.97-9.78-5.43-13.38-.79%201.86-2.52%204.96-5.73%206.95-.16.1-.34.15-.52.15-.33%200-.66-.17-.85-.47-.29-.47-.14-1.08.33-1.37%203.99-2.46%205.35-7.07%205.42-7.29%201-4.35.59-8.76-1.22-13.11-1.02-2.46-2.5-4.68-4.37-6.6-.37-.39-.37-1%200-1.382-.91-.85-1.89-1.62-2.92-2.31-.43%201.16-2.4%205.34-8.68%206.71-.07.013-.14.02-.21.02-.46%200-.87-.32-.97-.786-.12-.54.228-1.077.768-1.19%205.89-1.28%207.2-5.34%207.28-5.59.856-3.22.57-6.5-.854-9.755-2.04-4.65-6.38-8.04-11.68-9.17-.86%201.27-3.14%203.95-7.79%205.02-.07.02-.15.025-.22.025-.457%200-.87-.318-.976-.78-.126-.54.21-1.07.75-1.2%204.96-1.14%206.693-4.335%206.832-4.61.68-1.58.702-3.36.06-5.28-1.156-3.47-3.94-4.165-7.8-5.12-4.15-1.03-9.27-2.3-13.7-7.75-3.86%202.694-7.59%208.2-7.137%2012.49.25%202.43%201.83%204.155%204.68%205.135.52.18.8.74.62%201.27-.18.52-.75.8-1.27.62-3.66-1.26-5.175-3.45-5.75-5.42-1.22.22-2.33.45-3.33.68.123.53-.205%201.07-.74%201.2%22%2F%3E%3Cpath%20fill%3D%22%23202225%22%20d%3D%22M198%2094.104h-6c-.552%200-1%20.447-1%201%200%20.553.448%201%201%201h6c.552%200%201-.447%201-1%200-.553-.448-1-1-1%22%2F%3E%3Cg%20transform%3D%22translate(0%2017.002)%22%3E%3Cmask%20id%3D%22b%22%20fill%3D%22%23fff%22%3E%3Cuse%20xlink%3Ahref%3D%22%23a%22%2F%3E%3C%2Fmask%3E%3Cpath%20fill%3D%22%23202225%22%20d%3D%22M185.092%2077.102h-29.38c-3.894%200-6.745-3.65-5.818-7.433.396-1.62.606-3.31.606-5.04%200-5.14-1.873-10.09-5.212-13.96-.9-1.04-1.33-2.39-1.188-3.75.4-3.87-.202-7.83-1.78-11.61-1.124-2.7-2.736-5.13-4.79-7.23-.386-.4-1.02-.41-1.414-.02-.01.01-.012.02-.02.03-.37.38-.373.99.004%201.38%201.876%201.92%203.348%204.14%204.375%206.6%201.813%204.35%202.224%208.75%201.224%2013.11-.07.21-1.43%204.83-5.42%207.29-.47.29-.62.9-.33%201.37.19.31.51.47.85.47.18%200%20.36-.05.52-.15%201.11-.69%202.05-1.51%202.83-2.37%201.96-2.17%205.48-1.66%206.67%201.02%201.08%202.43%201.66%205.08%201.66%207.79%200%2010.68-8.69%2019.37-19.37%2019.37-3.54%200-6.85-.11-9.92-.33-3.77-.26-3.57-5.91.21-5.84.48.01.96.02%201.45.05.56.05%201.02-.4%201.04-.96.02-.55-.4-1.02-.95-1.05-12.74-.58-21.7%203.23-22.44%203.55-9.34%203.06-18.13%204.6-26.1%204.6-12.08%200-21.9-9.52-21.9-21.23%200-8.2%204.99-15.73%2012.73-19.2.26-.12.46-.34.54-.62.08-.28.04-.58-.11-.82-1.4-2.28-2.13-4.87-2.13-7.48%200-.32.01-.63.03-.93.52-7.99%208.85-12.91%2016.4-10.24%201.27.45%202.61.8%203.91.9h.08c.52%200%20.95-.4%201-.92.05-.55-.36-1.04-.91-1.08-4.95-.39-7.7-4.12-7.73-4.16%200-.01-.01-.01-.01-.01%200-.01-.01-.02-.02-.03-1.36-1.7-2.08-3.7-2.08-5.8%200-3.82%202.29-7.21%205.83-8.64l.07-.03c.39-.15%202.13-.75%204.96-1.44.54-.13.87-.67.74-1.2-.13-.53-.67-.86-1.2-.73-3.36.81-5.21%201.51-5.29%201.54-.04.01-.07.03-.11.05-4.24%201.77-6.98%205.86-6.98%2010.46%200%202.11.6%204.14%201.73%205.94l-.7.26c-.04.01-.08.03-.12.05-7.03%202.68-11.57%208.95-11.57%2016%200%201.48.21%202.95.62%204.38.54%201.89-.21%203.89-1.81%205.03-6.09%204.32-9.84%2011.26-9.84%2018.7%200%202.32.35%204.55%201%206.66%201.18%203.82-1.8%207.66-5.8%207.66H1c-.552%200-1%20.45-1%201%200%20.552.448%201%201%201h52.866c.95%200%201.873.33%202.588.96C60.687%2083.75%2066.278%2086%2072.4%2086c8.084%200%2016.968-1.532%2026.413-4.554C105.65%2084.51%20115.573%2086%20129.13%2086c5.654%200%2010.786-2.22%2014.61-5.818.737-.694%201.71-1.08%202.724-1.08h38.628c.552%200%201-.447%201-1%200-.553-.448-1-1-1%22%20mask%3D%22url(%23b)%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(86%20.002)%22%3E%3Cmask%20id%3D%22d%22%20fill%3D%22%23fff%22%3E%3Cuse%20xlink%3Ahref%3D%22%23c%22%2F%3E%3C%2Fmask%3E%3Cpath%20fill%3D%22%23202225%22%20d%3D%22M1.123%2017.434c.577%201.977%202.092%204.162%205.748%205.42.53.177%201.1-.1%201.28-.62.18-.524-.1-1.093-.62-1.272-2.85-.98-4.43-2.708-4.68-5.132-.3-2.923%201.32-6.403%203.61-9.177%201.57-1.903%204.4-2.09%206.29-.498%203.71%203.132%207.64%204.107%2010.95%204.93%203.86.956%206.64%201.648%207.8%205.12.64%201.924.62%203.702-.06%205.284-.14.27-1.87%203.46-6.83%204.6-.53.12-.87.66-.75%201.2.11.46.52.77.98.77.08%200%20.15-.01.23-.03%201.41-.33%202.6-.8%203.6-1.34%205.78-3.1%2013.11-.63%2015.81%205.35l.06.14c1.43%203.25%201.71%206.53.85%209.75-.07.25-1.39%204.31-7.27%205.59-.54.12-.88.65-.76%201.19.1.47.52.79.98.79.07%200%20.14-.01.22-.02%206.28-1.37%208.25-5.55%208.68-6.72.06-.17.09-.27.1-.3v-.02c.97-3.62.64-7.45-.95-11.08-2.24-5.12-6.93-8.88-12.68-10.24.48-1.74.39-3.61-.27-5.59-1.51-4.52-5.25-5.45-9.22-6.43-4.23-1.05-9.03-2.24-13.15-7.75-.31-.41-.87-.52-1.31-.26C4.96%203.97.28%2010.64.85%2016.03c.046.446.133.917.275%201.4%22%20mask%3D%22url(%23d)%22%2F%3E%3C%2Fg%3E%3Cpath%20fill%3D%22%23202225%22%20d%3D%22M132.188%2074.923c-.548.07-.936.57-.867%201.117.07.506.5.875%201%20.875.04%200%20.09-.003.13-.008.59-.073%201.17-.188%201.73-.34.54-.145.85-.695.71-1.228-.14-.54-.69-.85-1.22-.71-.47.13-.96.22-1.46.28M77.17%2057.4c-2.88%200-5.217%202.336-5.217%205.218%200%202.88%202.336%205.217%205.217%205.217%202.88%200%205.217-2.336%205.217-5.217%200-2.882-2.336-5.218-5.217-5.218m41.743%205.218c0%202.88%202.336%205.217%205.218%205.217s5.22-2.336%205.22-5.217c0-2.882-2.33-5.218-5.21-5.218s-5.21%202.336-5.21%205.218M92.83%2075.14c-.44.334-.526.962-.193%201.402.195.26.495.397.797.397.21%200%20.42-.07.603-.21%203.71-2.81%208.91-2.83%2012.645-.05l.077.05c.44.32%201.03.2%201.36-.24.33-.44.2-1.1-.25-1.43-4.44-3.3-10.62-3.28-15.04.06m68.33-24.76h.51c.55%200%201%20.44%201%201v.51c0%20.55.45%201%201%201s1-.45%201-1v-.51c0-.56.45-1%201-1h.51c.55%200%201-.45%201-1%200-.56-.45-1-1-1h-.51c-.55%200-1-.45-1-1v-.51c0-.55-.45-1-1-1s-1%20.45-1%201v.51c0%20.55-.45%201-1%201h-.51c-.55%200-1%20.44-1%201%200%20.55.45%201%201%201M21.69%2043.75c.834%200%201.51.676%201.51%201.51%200%20.553.448%201%201%201%20.553%200%201-.447%201-1%200-.834.676-1.51%201.51-1.51.553%200%201-.447%201-1%200-.553-.447-1-1-1-.834%200-1.51-.676-1.51-1.51%200-.552-.447-1-1-1-.552%200-1%20.448-1%201%200%20.834-.676%201.51-1.51%201.51-.552%200-1%20.447-1%201%200%20.553.448%201%201%201M157.3%2018.52c.256%200%20.512-.1.707-.294l1.184-1.184c.39-.39.39-1.023%200-1.414-.39-.39-1.02-.39-1.41%200l-1.18%201.184c-.39.39-.39%201.023%200%201.414.2.195.45.293.71.293m-5.91%205.91c.26%200%20.51-.1.71-.3l1.19-1.19c.39-.39.39-1.03%200-1.42-.39-.39-1.02-.39-1.41%200l-1.18%201.18c-.39.39-.39%201.02%200%201.41.2.19.45.29.71.29m6.39-.3c.2.19.45.29.71.29.26%200%20.51-.1.71-.3.39-.39.39-1.02%200-1.41l-1.18-1.19c-.39-.39-1.02-.39-1.41%200-.39.39-.39%201.03%200%201.42l1.19%201.18zm-5.91-5.92c.2.2.45.29.71.29.26%200%20.51-.1.71-.3.39-.39.39-1.02%200-1.42l-1.18-1.19c-.39-.39-1.02-.39-1.41%200-.39.39-.39%201.023%200%201.413l1.19%201.18zM45.6%2020.84c.83%200%201.51.68%201.51%201.51%200%20.837-.68%201.51-1.51%201.51-.832%200-1.51-.673-1.51-1.51%200-.83.678-1.51%201.51-1.51m0%205.02c1.937%200%203.51-1.57%203.51-3.51%200-1.932-1.573-3.51-3.51-3.51-1.934%200-3.51%201.578-3.51%203.51%200%201.94%201.576%203.51%203.51%203.51%22%2F%3E%3Cpath%20d%3D%22M0%200h200v104H0z%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E');
}

.wrapper.invalid .name {
	color: #f04747;
}

.wrapper.invalid .icon {
	background: var(--image-fail) 50% / 50px 26px no-repeat;
}

.content {
	display: flex;
	flex-flow: row nowrap;
}

.info {
	flex: 1 1 auto;
	min-width: 1px;
	flex-direction: column;
	flex-wrap: nowrap;
	display: flex;
	align-items: stretch;
	justify-content: center;
	text-indent: 0;
}

.icon {
	background: #36393f center / cover;
	margin-right: 16px;
	width: 50px;
	height: 50px;
	border-radius: 16px;
	line-height: 50px;
	text-align: center;
	color: #dcddde;
	font-weight: 400;
	position: relative;
}

.description {
	font-weight: 700;
	margin: 0px;
	margin-bottom: 12px;
	white-space: nowrap;
	text-overflow: ellipsis;
	overflow: hidden;
	color: #b9bbbe;
	text-transform: uppercase;
	font-size: 12px;
	line-height: 12px;
	flex: 1;
}

.name {
	min-width: 0px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	line-height: 20px;
	align-items: center;
	display: flex;
	color: #FFF;
	font-weight: 600;
	margin-bottom: 2px;
}

.join {
	text-decoration: none;
}

.join {
	align-self: center;
	margin-left: 10px;
	white-space: nowrap;
	flex: 0 0 auto;
	position: relative;
	display: flex;
	border-radius: 3px;
	border: none;
	font-size: 14px;
	font-weight: 500;
	line-height: 40px;
	height: 40px;
	padding: 0px 20px;
	user-select: none;
	color: #FFF;
	background: #3ba55d;
	cursor: pointer;
}

.counts {
	display: flex;
    align-items: center;
	font-weight: 600;
	margin: 0;
	font-size: 14px;
	white-space: nowrap;
	text-overflow: ellipsis;
	overflow: hidden;
	color: #b9bbbe;
	line-height: 16px;
	flex-direction: row;
}

.status.online::before {
	background: #43b581;
}

.status.total::after {
	content: ' Members';
}

.status.online::after {
	content: ' Online';
}

.status.total::before {
    background: #747f8d;
}

.status {
	flex: 0 1 auto;
	margin-right: 8px;
	color: #b9bbbe;
	white-space: nowrap;
	text-overflow: ellipsis;
	overflow: hidden;
}

.status::before {
	content: '';
	display: inline-block;
	margin-right: 4px;
	width: 8px;
	height: 8px;
	border-radius: 50%;
	flex: 0 0 auto;
}

.wrapper * {
	outline: none;
	font-family: Whitney;
}

.count-message {
    display: flex;
    align-items: center;
    font-weight: 600;
    margin: 0;
    font-size: 14px;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    color: #b9bbbe;
    line-height: 16px;
}

.wrapper.invalid .counts {
	display: none;
}
</style>
<div class='wrapper'>
	<div class='description'></div>
	<div class='content'>
		<div class='icon'></div>
		<div class='info'>
			<div class='name'></div>
			<div class='count-message'></div>
			<div class='counts'>
				<div class='online status'></div>
				<div class='total status'></div>
			</div>
		</div>
		<a draggable='false' class='join'>Join</a>
	</div>
</div>`;
		
		var nodes = tree({
			container: '^ > .wrapper',
			description: '$ > .description',
			content: {
				container: '^ > .content',
				icon: '$ > .icon',
				info: {
					container: '^ > .info',
					name: '$ > .name',
					count_message: '$ > .count-message',
					counts: {
						container: '^ > .counts',
						online: '$ > .online',
						total: '$ > .total',
					},
				},
				join: '$ > .join',
			},
		}, shadow);
		
		var cache_key = 'cache-' + code,
			cache = localStorage[cache_key],
			data = JSON.parse(localStorage[cache_key] || await(await fetch(`https://discord.com/api/v8/invites/${code}?with_counts=true`)).text());
		
		if(!data.from_cache){
			data.from_cache = true;
			localStorage[cache_key] = JSON.stringify(data);
		}
		
		if(data.code == 10006){
			nodes.container.classList.add('invalid');
			
			nodes.description.textContent = 'You recevied an invite, but..';
			nodes.content.info.name.textContent = 'Invalid Invite';
			nodes.content.info.count_message.textContent = 'Ask for a new invite!';
		}else{
			if(data.guild.icon)nodes.content.icon.style['background-image'] = 'url(' + JSON.stringify('https://cdn.discordapp.com/icons/' + data.guild.id + '/' + data.guild.icon + '?size=64') + ')';
			else nodes.content.icon.textContent = data.guild.name.split(' ').map(word => word[0]).join('');
			
			nodes.container.classList.add('valid');
			
			nodes.content.info.name.textContent = data.guild.name;
			
			nodes.content.info.counts.online.textContent = data.approximate_presence_count;
			nodes.content.info.counts.total.textContent = data.approximate_member_count;
			
			nodes.description.textContent = 'You\'ve been invited to join a server';
			
			nodes.content.join.href = 'https://discord.com/invite/' + data.code;
		}
	}
	connectedCallback(){
		if(!this.hasAttribute('code'))console.warn('code property required', this);
		
		var code = this.getAttribute('code');
		
		this.removeAttribute('code');
		
		this.load(code);
	}
	static create(parent, code){
		var node = document.createElement('discord-invite');
		
		node.setAttribute('code', code);
		
		document.body.appendChild(node);
	}
};

customElements.define('discord-invite', DiscordInvite);