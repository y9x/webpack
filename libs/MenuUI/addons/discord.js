'use strict';

var Addon = require('../Addon'),
	utils = require('../../Utils'),
	console = require('../../console');

class DiscordAddon extends Addon {
	invite = /([a-z0-9-]{3,25})\s*?$/i;
	async create(input){
		this.name = 'Discord Invite';
		
		input = await input + '';
		
		var match = input.match(this.invite);
		
		if(!match || !match[1])throw new Error('Invalid invite code: ' + input);
		
		var code = match[1];
		
		console.log('Discord code:', code);
		
		this.data = await(await fetch(`https://discord.com/api/v8/invites/${code}?with_counts=true`)).json();
		
		this.content = utils.crt_ele('div', {
			style: {
				'margin-bottom': '15px',
			},
		});
		
		this.shadow = this.content.attachShadow({ mode: 'closed' });
		
		this.load(this.data, this.shadow);
		
		this.ready();
		
		this.menu.window.header.prepend(this.content);
	}
	load(data, node){
		node.innerHTML = `
<div class='content'>
	<div class='icon'></div>
	<div class='name'></div>
	<div class='online status'></div>
	<div class='total status'></div>
	<a draggable='false' class='join'>Join</a>
</div>`;
		
		utils.add_ele('style', node, { textContent: require('./discord.css') });
		
		var nodes = utils.node_tree({
			container: '^ > .content',
			icon: '$ > .icon',
			name: '$ > .name',
			online: '$ > .online',
			total: '$ > .total',
			join: '$ > .join',
		}, node);
		
		if(data.code == 10006){
			nodes.container.classList.add('invalid');
			
			nodes.name.textContent = 'Invalid Invite';
		}else{
			if(data.guild.icon)nodes.icon.style['background-image'] = 'url(' + JSON.stringify('https://cdn.discordapp.com/icons/' + data.guild.id + '/' + data.guild.icon + '?size=64') + ')';
			else nodes.icon.textContent = data.guild.name.split(' ').map(word => word[0]).join('');
			
			nodes.container.classList.add('valid');
			
			nodes.name.textContent = data.guild.name;
			
			nodes.online.textContent = data.approximate_presence_count;
			nodes.total.textContent = data.approximate_member_count;
			
			nodes.join.href = 'https://discord.com/invite/' + data.code;
		}
	}
};

module.exports = DiscordAddon;