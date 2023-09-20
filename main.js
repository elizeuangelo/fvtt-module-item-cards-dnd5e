import { renderCard } from './module/card-popout.js';
import './module/font.js';

Hooks.once('setup', () => import('./module/item-sheet.js'));
Hooks.once('setup', () => {
	window.renderCard = renderCard;
});
