import { CARD_TYPES } from './generate-card.js';

// Config
const ALLOWED_ITEM_TYPES = Object.keys(CARD_TYPES);

// Logic
const section = await getTemplate('modules/item-cards-dnd5e/templates/item-sheet-tab.hbs');
function addTab(sheet, html, data) {
	if (!ALLOWED_ITEM_TYPES.includes(sheet.item.type)) return;
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
	menu.on('click', () => sheet.setPosition({ height: 540 }));
	tab.find('input').on('change', () =>
		Hooks.once('renderItemSheet', () => sheet.element.find('nav [data-tab=item-card]')[0].click())
	);
	tab.find('button.file-picker').on('click', (ev) => sheet._activateFilePicker(ev));
	const flipped = sheet.document.getFlag('item-cards-dnd5e', 'flipped');
	tab.find('#card-preview').on('click', () => renderCard(sheet.item.uuid, flipped));
}

// -------------------------------- //
Hooks.on('renderItemSheet', addTab);
