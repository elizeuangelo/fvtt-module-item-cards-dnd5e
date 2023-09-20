import { card_default_options, card_generate_back, card_generate_front } from '../lib/card-generator/cards.js';

const CARD_EXAMPLE = {
	count: 1,
	color: 'maroon',
	title: 'Burning Hands',
	icon: 'white-book-1',
	icon_back: 'robe',
	contents: [
		'subtitle | 1st level evocation',
		'rule',
		'property | Casting time | 1 action',
		'property | Range | Self (15ft cone)',
		'property | Components | V,S',
		'rule',
		'fill | 2',
		'text | Each creature in a 15-foot cone must make a Dexterity saving throw. A creature takes <b>3d6 fire damage</b> on a failed save, or half as much damage on a successful one.',
		"text | The fire ignites any flammable objects in the area that aren't being worn or carried.",
		'fill | 3',
		'section | At higher levels',
		'text | +1d6 damage for each slot above 1st',
	],
	tags: ['spell', 'mage'],
};

function defaultCard(item) {
	return {
		count: 1,
		color: item.getFlag('item-cards-dnd5e', 'color') || 'maroon',
		title: item.name,
		contents: [],
		tags: [],
	};
}

function firstLetterUpperCase(str) {
	return str.replace(str[0], str[0].toUpperCase());
}

function generateSpell(item) {
	const card = {};
	return { ...defaultCard(item), ...card };
}
function removeTags(str) {
	return str.replace(/^<p>(.+)<\/p>$/, '$1');
}
function generateWeapon(item) {
	const card = {
		contents: [
			`subtitle | ${firstLetterUpperCase(CONFIG.DND5E.weaponTypes[item.system.weaponType].toLowerCase())} weapon ${
				item.system.price ? `(${item.system.price.value}${item.system.price.denomination})` : ''
			}`,
			'rule',
			item.hasDamage ? `property | Damage | ${item.system.damage.parts.map(([k, v]) => `${k} ${v}`).join(' + ')}` : '',
			item.isVersatile ? `property | Versatile | ${item.system.damage.versatile}` : '',
			`property | Modifier | ${CONFIG.DND5E.abilities[item.abilityMod].label}${
				item.abilityMod === 'str' && item.system.properties.fin ? ` or Dexterity` : ''
			}`,
			`property | Properties | ${Object.entries(item.system.properties)
				.map(([k, v]) => (v ? CONFIG.DND5E.weaponProperties[k] : undefined))
				.filter(Boolean)
				.join(', ')}`,
			`property | Action | ${item.system.activatedEffectChatProperties.filter(Boolean).join(', ')}`,
			'rule',
			'fill | 2',
			`description | Description | ${removeTags(item.system.description.value)}`,
			'fill | 3',
		],
	};
	return { ...defaultCard(item), ...card };
}

export const CARD_TYPES = {
	spell: generateSpell,
	weapon: generateWeapon,
};
export function createFrontCard(item) {
	if (!(item.type in CARD_TYPES)) return;
	const options = { ...card_default_options() };
	const card = CARD_TYPES[item.type](item);
	return card_generate_front(card, options);
}
export function createBackCard(item) {
	if (!(item.type in CARD_TYPES)) return;
	const options = { ...card_default_options() };
	const card = CARD_TYPES[item.type](item);
	return card_generate_back(card, options);
}
