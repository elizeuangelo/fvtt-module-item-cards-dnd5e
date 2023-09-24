export const MODULE_ID = 'item-cards-dnd5e';
export const PATH = `modules/${MODULE_ID}`;

const settings = {
	autoClose: {
		name: 'Automatically close cards',
		hint: 'Time in miliseconds for the cards to disappear. 0 to disable.',
		scope: 'world',
		config: true,
		type: Number,
		default: 0,
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
