import { shareImage } from './card-popout.js';

// Logic
const section = await getTemplate('modules/item-cards-dnd5e/templates/item-sheet-tab.hbs');
function addTab(sheet, html, data) {
	if (!game.user.isGM) return;
	const tab = $(
		section(data, {
			allowProtoMethodsByDefault: true,
			allowProtoPropertiesByDefault: true,
		})
	);
	const body = html.find('.sheet-body');
	body.append(tab);
	if (html[0].classList.contains('app')) {
		const width = sheet.options.width + 80;
		html[0].style.width = `${width}px`;
		sheet.position.width = width;
	}

	// Tab
	const menu = $(`<a class="item" data-tab="item-card">Card</a>`);
	sheet._tabs[0]._nav.appendChild(menu[0]);

	// Tidysheet Fixes
	if (sheet.constructor.name === 'Tidy5eItemSheet') {
		tab[0].style.paddingRight = '0.75rem';
	}

	// Listeners
	menu.on('click', () => setTimeout(() => sheet.setPosition({ height: 'auto' }), 0));
	tab.find('input').on('change', () =>
		Hooks.once('renderItemSheet', () => sheet.element.find('nav [data-tab=item-card]')[0].click())
	);
	tab.find('button.file-picker').on('click', (ev) => sheet._activateFilePicker(ev));
	const flipped = sheet.document.getFlag('item-cards-dnd5e', 'flipped');
	tab.find('#card-preview').on('click', () => renderCard(sheet.item.uuid, flipped, true));
}

// -------------------------------- //
Hooks.on('renderItemSheet', addTab);
Hooks.on('dnd5e.displayCard', (item) => {
	const uuid = item.uuid,
		flipped = item.getFlag('item-cards-dnd5e', 'flipped'),
		preview = false;
	renderCard(uuid, flipped, preview);
	shareImage({ uuid, flipped, preview });
});
