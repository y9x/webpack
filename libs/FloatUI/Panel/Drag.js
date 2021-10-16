'use strict';

var { frame, panels, store } = require('../consts'),
	Panel = require('./index');

class DragPanel extends Panel {
	constructor(frame, type){
		super(frame, type);
		
		this.pos = { x: 0, y: 0 };
		
		window.addEventListener('resize', () => this.apply_bounds());
		
		window.addEventListener('mousemove', event => {
			var pos = { x: event.pageX, y: event.pageY };
			
			if(this.prev_pos && this.dragging){
				this.pos.x += (pos.x - this.prev_pos.x)/this.bounds().width*100;
				this.pos.y += (pos.y - this.prev_pos.y)/this.bounds().height*100;
				this.save_ui();
				this.apply_bounds();
			}
			
			this.prev_pos = pos;
		});
		
		window.addEventListener('mouseup', () => {
			if(!this.dragging)return;
			this.pos = this.within_bounds();
			this.apply_bounds();
			this.dragging = false;
		});
	}
	async load_ui_data(){
		var data = await this.load_ui();
		
		this.pos = data.pos;
		this.visible = data.visible;
		
		if(this.visible)this.show();
		else this.hide();
		
		this.apply_bounds();
	}
	async save_ui(only_visible){
		if(!(['editor', 'config'].includes(this.type)))return;
		
		var pos = only_visible ? (await this.load_ui().catch(err => this)).pos : this.pos;
		
		return store.set_raw(this.type + '-ui', +this.visible + ',' + this.pos.x + ',' + this.pos.y);
	}
	async load_ui(){
		var data = await store.get_raw(this.type + '-ui');
		
		if(!data)return this;
		
		var arr = data.split(',');
		
		return {
			pos: { x: +arr[1], y: +arr[2] },
			visible: !!+arr[0],
		};
	}
	listen_dragging(node){
		node.addEventListener('mousedown', () => this.dragging = true);
		
		return node;
	}
	center_side(side){
		var rect = this.node.getBoundingClientRect();
		
		return 50-rect[side]/this.bounds()[side]*50;
	}
	bounds(){
		return { width: window.innerWidth, height: window.innerHeight };
	}
	within_bounds(){
		var rect = this.node.getBoundingClientRect();
		
		return {
			x: Math.min(
				Math.max(this.pos.x, 0),
				100-(rect.width/this.bounds().width*100)
			),
			y: Math.min(
				Math.max(this.pos.y, 0),
				100-(rect.height/this.bounds().height*100)
			),
		};
	}
	apply_bounds(){
		var bounds = this.within_bounds();
		
		this.node.style.left = bounds.x.toFixed(1) + '%';
		this.node.style.top = bounds.y.toFixed(1) + '%';
	}
	show(){
		// this.focus();
		
		super.show();
		
		this.save_ui(true);
	}
	hide(){
		super.hide();
		
		this.save_ui(true);
	}
};

module.exports = DragPanel;