import './module/font.js';
import './module/settings.js';
import './module/card-popout.js';
Hooks.once('setup', () => import('./module/item-sheet.js'));
