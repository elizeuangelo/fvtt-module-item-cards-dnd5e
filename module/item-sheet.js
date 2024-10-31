import { PopoutCard } from './card-popout.js';
import { getSetting } from './settings.js';

export function specialMembership() {
	try {
		const membership = getSetting('specialMembership');
		return Boolean(membership && game.membership?.hasPermissionSync(membership));
	} catch {
		return false;
	}
}

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

	// Listeners
	menu.on('click', () => setTimeout(() => sheet.setPosition({ height: 'auto' }), 0));

	// Adds onSubmit Wrapper
	if (sheet._cardSubmitWrapper !== true) {
		sheet._cardSubmitWrapper = true;
		const onSubmit = sheet._onSubmit;
		sheet._onSubmit = async function _onSubmitWrapper(event) {
			const isActiveTab = sheet._tabs[0].active === 'item-card';
			if (isActiveTab) {
				Hooks.once('renderItemSheet', () => sheet.element.find('nav [data-tab=item-card]')[0].click());
			}
			await onSubmit.call(this, event);
		};
	}

	const flipped = sheet.document.getFlag('item-cards-dnd5e', 'flipped');
	tab.find('#card-preview').on('click', () => PopoutCard.createFromUuid({ uuid: sheet.item.uuid, flipped, preview: true }));
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
