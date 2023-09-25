export const MODULE_ID = 'item-cards-dnd5e';
export const PATH = `modules/${MODULE_ID}`;

const settings = {
	showCards: {
		name: 'Show Cards',
		hint: 'Show item cards on screen when items are played.',
		scope: 'client',
		config: true,
		type: Boolean,
		default: true,
	},
	doubleClick: {
		name: 'Flip on Double Click',
		hint: 'Flip cards only on double clicks.',
		scope: 'client',
		config: true,
		type: Boolean,
		default: true,
	},
	autoClose: {
		name: 'Automatically Close Cards',
		hint: 'Time in miliseconds for the cards to disappear. 0 to disable.',
		scope: 'client',
		config: true,
		type: Number,
		default: 6000,
	},
	showCardsPCs: {
		name: 'Show Cards PC (server)',
		hint: 'Show item cards when PCs use items.',
		scope: 'world',
		config: true,
		type: Boolean,
		default: true,
	},
	showCardsNPCs: {
		name: 'Show Cards NPC (server)',
		hint: 'Show item cards when NPCs use items.',
		scope: 'world',
		config: true,
		type: Boolean,
		default: false,
	},
};
export function getSetting(name) {
	return game.settings.get(MODULE_ID, name);
}
export function setSetting(name, value) {
	return game.settings.set(MODULE_ID, name, value);
}
Hooks.once('setup', () => {
	for (const [key, setting] of Object.entries(settings)) {
		game.settings.register(MODULE_ID, key, setting);
	}
});
