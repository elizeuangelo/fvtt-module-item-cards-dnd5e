import { PopoutCard } from '../card-popout.js';
import { specialMembership } from '../item-sheet.js';

Hooks.once('tidy5e-sheet.ready', (api) => {
	api.registerItemTab(
		new api.models.HandlebarsTab({
			tabId: 'item-card',
			title: 'Card',
			path: 'modules/item-cards-dnd5e/templates/item-sheet-tab.hbs',
			getData(data) {
				const specialMember = specialMembership();
				data.specialMember = specialMember;
				data.isGM = game.user.isGM;
				return data;
			},
			onRender(params) {
				const tab = $(params.tabContentsElement);
				const sheet = params.app;
				const flipped = sheet.document.getFlag('item-cards-dnd5e', 'flipped');
				tab.find('#card-preview').on('click', () =>
					PopoutCard.createFromUuid({ uuid: sheet.item.uuid, flipped, preview: true })
				);
			},
		})
	);
});
