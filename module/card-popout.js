import { createBackCard, createFrontCard } from './generate-card.js';
import { getSetting, setSetting } from './settings.js';
import DirectoryPicker from '../lib/DirectoryPicker.js';

export class PopoutCard {
	static template = 'modules/item-cards-dnd5e/templates/card-popout.hbs';
	static sound = new Audio('modules/item-cards-dnd5e/sounds/pageturn.mp3');
	static calcSize(el) {
		return {
			width: el.clientWidth,
			height: el.clientHeight,
		};
	}
	static imageRendering(img) {
		if (img.complete) return;
		return new Promise((resolve) => {
			img.addEventListener('load', () => resolve(), false);
		});
	}
	static items = {};
	static async createFromUuid({ uuid, flipped = false, preview = false }) {
		if (uuid in PopoutCard.items) return PopoutCard.items[uuid].render({ flipped, preview });
		const item = await fromUuid(uuid);
		const card = new this(item);
		card.render({ flipped, preview });
		return card;
	}
	static createFromItem({ item, flipped = false, preview = false }) {
		if (item.uuid in PopoutCard.items) return PopoutCard.items[item.uuid].render({ flipped, preview });
		const card = new this(item);
		card.render({ flipped, preview });
		return card;
	}
	static _folderImages;
	static async getFolderImages(target = DirectoryPicker.parse(getSetting('matchCardFolder')).current) {
		if (this._folderImages?.target === target) return this._folderImages.files;
		const data = await FilePicker.browse('data', target, {
			extensions: ['.apng', '.avif', '.bmp', '.gif', '.jpg', '.jpeg', '.png', '.svg', '.tiff', '.webp'],
		});
		const files = data.files;

		// Recursevely search in subfolders as well
		for (const dir of data.dirs) {
			for (const file of await this.getFolderImages(dir)) files.push(file);
		}

		this._folderImages = { target, files };

		return files;
	}
	constructor(item) {
		this.item = item;
		const defaultPos = getSetting('defaultPosition') || getSetting('defaultPositionServer');
		this.position = defaultPos
			? JSON.parse(defaultPos)
			: {
					left: ~~(window.innerWidth / 2),
					top: ~~(window.innerHeight / 2),
			  };
		this.closeTimeout = 0;
	}
	_getHeaderButtons() {
		const buttons = [
			{
				tooltip: 'Set Position',
				class: 'set-position',
				icon: 'fas fa-plus',
				onclick: () => {
					this.savePosition().then(() => ui.notifications.info('Position saved!'));
				},
			},
			{
				tooltip: 'Close',
				class: 'close',
				icon: 'fas fa-times',
				onclick: () => this.close(),
			},
		];
		if (game.user.isGM) {
			buttons.unshift({
				tooltip: 'JOURNAL.ActionShow',
				class: 'share-image',
				icon: 'fas fa-eye',
				onclick: () =>
					this.shareImage({
						uuid: this.element[0].dataset.uuid,
						title: this.element[0].dataset.title,
						flipped: this.element[0].classList.contains('flipped'),
						preview: true,
					}),
			});
		}
		return buttons;
	}
	setPosition({ left, top } = this.position) {
		if (!this.element) return;
		const el = this.element[0],
			currentPosition = this.position,
			scale = 0.5,
			width = el.clientWidth,
			height = el.clientHeight;

		// Update Left
		if (!el.style.left || Number.isFinite(left)) {
			const scaledWidth = width * scale;
			const tarL = Number.isFinite(left) ? left : (window.innerWidth - scaledWidth) / 2;
			const maxL = Math.max(window.innerWidth - scaledWidth, 0);
			currentPosition.left = left = Math.clamped(tarL, width / 2, maxL);
			el.style.left = `${left}px`;
		}

		// Update Top
		if (!el.style.top || Number.isFinite(top)) {
			const scaledHeight = height * scale;
			const tarT = Number.isFinite(top) ? top : (window.innerHeight - scaledHeight) / 2;
			const maxT = Math.max(window.innerHeight - scaledHeight, 0);
			currentPosition.top = Math.clamped(tarT, height / 2, maxT);
			el.style.top = `${currentPosition.top}px`;
		}
	}
	bringToTop() {
		const z = document.defaultView.getComputedStyle(this.element[0]).zIndex;
		if (z < _maxZ) {
			this.position.zIndex = Math.min(++_maxZ, 99999);
			this.element[0].style.zIndex = this.position.zIndex;
		}
	}
	savePosition({ left, top } = this.position) {
		return setSetting('defaultPosition', JSON.stringify({ left, top }));
	}
	async renderFrontCard() {
		const customImage =
			this.item.getFlag('item-cards-dnd5e', 'memberFrontImage') || this.item.getFlag('item-cards-dnd5e', 'frontImage');
		if (customImage) return { type: 'img', el: /*html*/ `<img src="${customImage}">` };
		return { type: 'gen', el: await createFrontCard(this.item) };
	}
	async renderBackCard() {
		let autoMatch = this.item.getFlag('item-cards-dnd5e', 'matchCard');
		if (!['true', 'false'].includes(autoMatch)) autoMatch = getSetting('matchCard');
		let matchImage;
		if ([true, 'true'].includes(autoMatch)) {
			const images = await PopoutCard.getFolderImages();
			const rgx = /^(?:.*\/|)(.+?)\.[a-zA-Z0-9]+$/;
			const replaceRgx = /[-_ 0-9]+/g;
			const itemName = this.item.name.trim().toLowerCase().replace(replaceRgx, '');
			for (const file of images) {
				const match = file.match(rgx);
				if (!match) continue;
				const fileName = decodeURI(match[1]).trim().toLowerCase().replace(replaceRgx, '');
				if (fileName === itemName) {
					matchImage = file;
					break;
				}
			}
		}
		const customImage =
			matchImage ||
			this.item.getFlag('item-cards-dnd5e', 'memberBackImage') ||
			this.item.getFlag('item-cards-dnd5e', 'backImage');
		if (customImage) return { type: 'img', el: /*html*/ `<img src="${customImage}">` };
		return { type: 'gen', el: await createBackCard(this.item) };
	}
	async render({ flipped = false, preview = false } = {}) {
		if (!getSetting('showCards')) return;
		if (this.element) this.element.remove();
		const target = this.item;
		const frontCardData = await this.renderFrontCard();
		const backCardData = await this.renderBackCard();
		const windowData = {
			target,
			uuid: target.uuid,
			headerButtons: this._getHeaderButtons(),
			front: frontCardData.el,
			back: backCardData.el,
		};
		const html = $(await renderTemplate(PopoutCard.template, windowData));
		const frontCard = html[0].querySelector('.flip-card-front');
		const backCard = html[0].querySelector('.flip-card-back');

		// Append Header
		if (frontCardData.type === 'gen') frontCard.querySelector('.card-header').append(frontCard.querySelector('header'));

		// Custom Header
		const customHeader = target.getFlag('item-cards-dnd5e', 'headerCSS');
		if (customHeader)
			html.find('header')
				.toArray()
				.forEach((el) => (el.style = customHeader));

		// Flipped?
		html[0].classList.toggle('flipped', flipped);

		// Await images to render
		const imgs = html.find('img').toArray();
		for (const img of imgs) {
			await PopoutCard.imageRendering(img);
		}

		// Render
		document.body.appendChild(html[0]);
		this.element = html;

		// Changes sizes
		const resizeEls = html.find('.card').add(html);
		const frontCardSize = PopoutCard.calcSize(frontCard);
		const backCardSize = PopoutCard.calcSize(backCard);
		frontCardSize.img = +(frontCardData.type === 'img');
		backCardSize.img = +(backCardData.type === 'img');
		const height = Math.max(frontCardSize.height * frontCardSize.img, backCardSize.height * backCardSize.img);
		const width = Math.max(frontCardSize.width * frontCardSize.img, backCardSize.width * backCardSize.img);
		if (height) resizeEls.height(height);
		if (width) resizeEls.width(width);

		// Border radius
		const borderRadius = target.getFlag('item-cards-dnd5e', 'borderRadius') || '15px';
		imgs.forEach((img) => (img.style.borderRadius = borderRadius));
		html.find('.card')
			.toArray()
			.forEach((el) => (el.style.borderRadius = borderRadius));

		// Position
		this.setPosition();
		this.bringToTop();

		// Insert Icon Image
		if (backCardData.type === 'gen' && target.img) {
			const icon = backCard.querySelector('.card-back-icon');
			icon.style.width = icon.style.height = '87.5px';
			icon.insertAdjacentHTML('beforeend', `<img src="${target.img}">`);
			if (target.getFlag('item-cards-dnd5e', 'iconBorder')) icon.style.border = 'none';
		}

		// Draggable
		new Draggable(this, html);

		// Activate header button click listeners after a slight timeout to prevent immediate interaction
		setTimeout(() => {
			html.find('.header-button').click((event) => {
				event.preventDefault();
				event.stopPropagation();
				const button = windowData.headerButtons.find((b) => event.currentTarget.classList.contains(b.class));
				button.onclick(event);
			});
			let pos_start;
			html.on('pointerdown', () => {
				pos_start = deepClone(this.position);
				clearTimeout(this.closeTimeout);
			});
			html.on(getSetting('doubleClick') ? 'dblclick' : 'click', (event) => {
				if (!objectsEqual(this.position, pos_start)) return;
				event.preventDefault();
				event.stopPropagation();
				this.flipCard();
			});
			html.on('contextmenu', (event) => {
				if (!objectsEqual(this.position, pos_start)) return;
				event.preventDefault();
				event.stopPropagation();
				this.close();
			});
		}, 500);

		setTimeout(() => html.css('opacity', '1'), 0);

		PopoutCard.items[target.uuid] = this;

		// Auto Close
		const autoClose = getSetting('autoClose');
		if (autoClose && !preview) {
			clearTimeout(this.closeTimeout);
			this.closeTimeout = setTimeout(() => this.close(), autoClose);
		}
	}
	close() {
		if (!this.element) return;
		delete PopoutCard.items[this.item.uuid];
		clearTimeout(this.closeTimeout);
		this.element[0].style.opacity = '0';
		this.element[0].classList.toggle('flipped');
		return new Promise((resolve) => {
			setTimeout(() => {
				this.element[0].remove();
				this.element = null;
				resolve();
			}, 200);
		});
	}

	shareImage({ flipped, preview } = { flipped: this.item.getFlag('item-cards-dnd5e', 'flipped'), preview: false }) {
		const viewers = game.users.contents.filter((u) => u.viewedScene === game.user.viewedScene).map((u) => u.id);
		game.socket.emit('module.item-cards-dnd5e', {
			uuid: this.item.uuid,
			flipped,
			preview,
			viewers,
		});
		ui.notifications.info(
			game.i18n.format('JOURNAL.ActionShowSuccess', {
				mode: 'image',
				title: this.item.name,
				which: 'some',
			})
		);
	}

	_flipSound() {
		PopoutCard.sound.play();
	}
	flipCard() {
		if (!this.element) return;
		this.element[0].classList.toggle('flipped');
		this._flipSound();
	}
}

// -------------------------------- //
Hooks.once('ready', () => {
	PopoutCard.getFolderImages();
	game.socket.on('module.item-cards-dnd5e', ({ uuid, flipped, preview, viewers }) => {
		if (!viewers.includes(game.userId)) return;
		PopoutCard.createFromUuid({ uuid, flipped, preview });
	});
});
