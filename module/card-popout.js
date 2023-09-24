import { createBackCard, createFrontCard } from './generate-card.js';
import { getSetting } from './settings.js';

function renderFrontCard(item) {
	const customImage = item.getFlag('item-cards-dnd5e', 'frontImage');
	if (customImage) return /*html*/ `<img src="${customImage}">`;
	return createFrontCard(item);
}

function renderBackCard(item) {
	const customImage = item.getFlag('item-cards-dnd5e', 'backImage');
	if (customImage) return /*html*/ `<img src="${customImage}">`;
	return createBackCard(item);
}

const template = 'modules/item-cards-dnd5e/templates/card-popout.hbs';
let element,
	position = {
		left: ~~(window.innerWidth / 2),
		top: ~~(window.innerHeight / 2),
	},
	closeTimeout = 0;

export async function renderCard(uuid, flipped = false, preview = false) {
	const target = await fromUuid(uuid);
	if (!target) return ui.notifications.error(`Could not find ${uuid}`);
	if (element) element.remove();

	const windowData = {
		uuid,
		target,
		headerButtons: _getHeaderButtons(),
		front: renderFrontCard(target),
		back: renderBackCard(target),
	};
	const html = $(await renderTemplate(template, windowData));
	const frontCard = html[0].querySelector('.flip-card-front');
	const backCard = html[0].querySelector('.flip-card-back');

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
		await imageRendering(img);
	}

	// Render
	document.body.appendChild(html[0]);
	element = html;

	// Changes sizes
	const frontCardSize = elSize(frontCard);
	const backCardSize = elSize(backCard);
	const height = Math.max(frontCardSize.height, backCardSize.height);
	const width = Math.max(frontCardSize.width, backCardSize.width);
	html.height(height);
	html.width(width);

	// Border radius
	const borderRadius = target.getFlag('item-cards-dnd5e', 'borderRadius') || '15px';
	imgs.forEach((img) => (img.style.borderRadius = borderRadius));
	html.find('.card')
		.toArray()
		.forEach((el) => (el.style.borderRadius = borderRadius));

	// Position
	setPosition();
	bringToTop();

	// Insert Icon Image
	if (!target.getFlag('item-cards-dnd5e', 'backImage') && target.img) {
		const icon = backCard.querySelector('.card-back-icon');
		icon.style.width = icon.style.height = '87.5px';
		icon.insertAdjacentHTML('beforeend', `<img src="${target.img}">`);
	}

	// Draggable
	new Draggable({ setPosition, position, bringToTop }, html);

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
			pos_start = deepClone(position);
			clearTimeout(closeTimeout);
		});
		html.on('click', (event) => {
			if (!objectsEqual(position, pos_start)) return;
			event.preventDefault();
			event.stopPropagation();
			flipCard();
		});
		html.on('contextmenu', (event) => {
			if (!objectsEqual(position, pos_start)) return;
			event.preventDefault();
			event.stopPropagation();
			closeCard();
		});
	}, 500);

	setTimeout(() => html.css('opacity', '1'), 0);

	// Auto Close
	const autoClose = getSetting('autoClose');
	if (autoClose && !preview) {
		clearTimeout(closeTimeout);
		closeTimeout = setTimeout(() => closeCard(), autoClose);
	}
}

function setPosition({ left, top } = position) {
	if (!element) return;
	const el = element[0],
		currentPosition = position,
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

function _getHeaderButtons() {
	const buttons = [
		{
			tooltip: 'Close',
			class: 'close',
			icon: 'fas fa-times',
			onclick: () => closeCard(),
		},
	];
	if (game.user.isGM) {
		buttons.unshift({
			tooltip: 'JOURNAL.ActionShow',
			class: 'share-image',
			icon: 'fas fa-eye',
			onclick: () =>
				shareImage({
					uuid: element[0].dataset.uuid,
					title: element[0].dataset.title,
					flipped: element[0].classList.contains('flipped'),
					preview: true,
				}),
		});
	}
	return buttons;
}

async function closeCard() {
	if (!element) return;
	clearTimeout(closeTimeout);
	element[0].style.opacity = '0';
	element[0].classList.toggle('flipped');
	return new Promise((resolve) => {
		setTimeout(() => {
			element[0].remove();
			element = null;
			resolve();
		}, 200);
	});
}

/**
 * Share the displayed image with other connected Users
 * @param {ShareImageConfig} [options]
 */
function shareImage(options = {}) {
	game.socket.emit('module.item-cards-dnd5e', {
		uuid: options.uuid,
		flipped: options.flipped,
		preview: options.preview,
	});
	ui.notifications.info(
		game.i18n.format('JOURNAL.ActionShowSuccess', {
			mode: 'image',
			title: options.title,
			which: 'all',
		})
	);
}
Hooks.on('ready', () =>
	game.socket.on('module.item-cards-dnd5e', ({ uuid, flipped, preview }) => renderCard(uuid, flipped, preview))
);

function flipCard() {
	if (!element) return;
	element[0].classList.toggle('flipped');
	playSound();
}

function elSize(el) {
	return {
		width: el.clientWidth,
		height: el.clientHeight,
	};
}

function imageRendering(img) {
	if (img.complete) return;
	return new Promise((resolve) => {
		img.addEventListener('load', () => resolve(), false);
	});
}

const sound = new Audio('modules/item-cards-dnd5e/sounds/pageturn.mp3');
export function playSound() {
	sound.play();
}

function bringToTop() {
	const z = document.defaultView.getComputedStyle(element[0]).zIndex;
	if (z < _maxZ) {
		position.zIndex = Math.min(++_maxZ, 99999);
		element[0].style.zIndex = position.zIndex;
	}
}
