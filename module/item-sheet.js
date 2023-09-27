import { PopoutCard } from './card-popout.js';
import { getSetting } from './settings.js';

// Logic
const section = await getTemplate('modules/item-cards-dnd5e/templates/item-sheet-tab.hbs');
function addTab(sheet, html, data) {
	if (!sheet._tabs?.[0]?._nav) return;
	const specialMember = specialMembership();
	const tab = $(
		section(
			{ ...data, specialMember, isGM: game.user.isGM },
			{
				allowProtoMethodsByDefault: true,
				allowProtoPropertiesByDefault: true,
			}
		)
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
	tab.find('input,select,textarea').on('change', () =>
		Hooks.once('renderItemSheet', () => sheet.element.find('nav [data-tab=item-card]')[0].click())
	);
	tab.find('button.file-picker').on('click', (ev) => sheet._activateFilePicker(ev));
	const flipped = sheet.document.getFlag('item-cards-dnd5e', 'flipped');
	tab.find('#card-preview').on('click', () => PopoutCard.createFromUuid({ uuid: sheet.item.uuid, flipped, preview: true }));
}

function specialMembership() {
	const membership = getSetting('specialMembership');
	return Boolean(membership && game.membership?.hasPermissionSync(membership));
}

// -------------------------------- //
Hooks.on('renderItemSheet', addTab);
Hooks.on('dnd5e.displayCard', (item) => {
	const activeFlag = item.getFlag('item-cards-dnd5e', 'active');
	if (activeFlag === 'false') return;
	if (!activeFlag) {
		if (game.user.isGM) {
			if (!getSetting('showCardsGMs')) return;
		} else {
			if (!getSetting('showCardsPlayers')) return;
		}
	}
	const options = { uuid: item.uuid, flipped: item.getFlag('item-cards-dnd5e', 'flipped'), preview: false, item };
	const card = PopoutCard.createFromItem(options);
	card.shareImage(options);
});
