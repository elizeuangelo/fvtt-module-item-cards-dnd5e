import './module/font.js';
import './module/settings.js';
import './module/card-popout.js';
Hooks.once('setup', () => {
	import('./module/item-sheet.js');
	if (game.modules.get('tidy5e-sheet')?.active) {
		import('./module/integrations/tidy-sheet.js');
	}
});
