import { card_generate_back, card_generate_front } from '../lib/card-generator/cards.js';

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
		color: item.getFlag('item-cards-dnd5e', 'color') || 'dimgray',
		title: item.name,
		contents: [],
		tags: [],
	};
}
function defaultOptions(item) {
	const smallFonts = item.getFlag('item-cards-dnd5e', 'smallerFonts');
	const titleSize = '' + ~~Math.clamped(24 - item.name.length / 2, 10, 13);
	return {
		foreground_color: 'white',
		background_color: 'white',
		default_color: 'black',
		default_icon_front: '',
		default_icon_back: '',
		default_title_size: titleSize,
		default_card_font_size: smallFonts ? '10' : 'inherit',
		page_size: '210mm,297mm',
		page_rows: '3',
		page_columns: '3',
		page_zoom: '100',
		card_arrangement: 'doublesided',
		card_size: '2.5in,3.5in',
		card_width: '2.5in',
		card_height: '3.5in',
		card_count: null,
		icon_inline: true,
		rounded_corners: true,
	};
}

function firstLetterUpperCase(str) {
	return str.replace(str[0], str[0].toUpperCase());
}
async function removeTags(str) {
	return await TextEditor.enrichHTML(str.replace(/^<p>(.*)<\/p>$/s, '$1'));
}

async function generateSpell(item) {
	const card = {
		color: 'saddlebrown',
		contents: [
			`subtitle | ${`${item.labels.level} ${item.labels.school || ''}`.toLocaleLowerCase()}`,
			'rule',
			`property | Casting time | ${item.labels.activation}`,
			`property | Range | ${item.labels.range}${item.labels.range === 'Self' ? ` (${item.labels.target})` : ''}`,
			`property | Components | ${item.labels.components.vsm}${
				item.labels.materials ? ` (${item.labels.materials.toLowerCase()})` : ''
			}`,
			item.labels.duration
				? `property | Duration | ${item.system.components.concentration ? `Concentration, up to ` : ''}${
						item.labels.duration || 'Instantaneous'
				  }`
				: '',
			'rule',
			'fill | 2',
			item.system.description.value ? `text | ${await removeTags(item.system.description.value)}` : '',
			'fill | 3',
		],
	};
	return { ...defaultCard(item), ...card };
}
async function generateWeapon(item) {
	const isRanged = item.system.actionType === 'rwak' || item.system.properties.thr;
	const properties = Object.entries(item.system.properties)
		.map(([k, v]) => (v ? CONFIG.DND5E.weaponProperties[k] : undefined))
		.filter(Boolean)
		.join(', ');
	const card = {
		contents: [
			`subtitle | ${firstLetterUpperCase(CONFIG.DND5E.weaponTypes[item.system.weaponType].toLowerCase())} weapon ${
				item.system.price?.value ? `(${item.system.price.value.toLocaleString()}${item.system.price.denomination})` : ''
			}`,
			'rule',
			item.hasDamage ? `property | Damage | ${item.system.damage.parts.map(([k, v]) => `${k} ${v}`).join(' + ')}` : '',
			item.isVersatile ? `property | Versatile | ${item.system.damage.versatile}` : '',
			item.abilityMod
				? `property | Modifier | ${CONFIG.DND5E.abilities[item.abilityMod].label}${
						item.abilityMod === 'str' && item.system.properties.fin ? ` or Dexterity` : ''
				  }`
				: '',
			properties ? `property | Properties | ${properties}` : '',
			item.labels.range && isRanged ? `property | Range | ${item.labels.range}` : '',
			'rule',
			'fill | 2',
			item.system.description.value ? `text | ${await removeTags(item.system.description.value)}` : '',
			'fill | 3',
		],
	};
	return { ...defaultCard(item), ...card };
}
async function generateArmor(item) {
	const card = {
		contents: [
			`subtitle | ${firstLetterUpperCase(item.system.armor.type)} armor ${
				item.system.price ? `(${item.system.price.value.toLocaleString()}${item.system.price.denomination})` : ''
			}`,
			'rule',
			`property | AC | ${item.system.armor.value}${item.system.armor.dex ? ` + Dex (max ${item.system.armor.dex})` : ''}`,
			item.system.strength ? `property | Strenght required | ${item.system.strength}` : '',
			item.system.stealth ? `property | Stealth| Disadvantage` : '',
			'rule',
			'fill | 2',
			item.system.description.value ? `text | ${await removeTags(item.system.description.value)}` : '',
			'fill | 3',
		],
	};
	return { ...defaultCard(item), ...card };
}
async function generateBasic(item, color = 'dimgray') {
	const charged = item.system.uses.max > 1;
	const prop = charged;
	const card = {
		color,
		contents: [
			`subtitle | ${firstLetterUpperCase(
				item.system.armor?.type ||
					('rarity' in item.system ? item.consumableType || item.type : item.consumableType || item.type)
			)} ${
				item.system.price?.value ? `(${item.system.price.value.toLocaleString()}${item.system.price.denomination})` : ''
			}`,
			'rule',
			charged ? `property | Maximum charges | ${item.system.uses.max}` : '',
			item.system.uses.recovery ? `property | Recovery | ${item.system.uses.recovery}` : '',
			prop ? 'rule' : '',
			'fill | 2',
			item.system.description.value ? `text | ${await removeTags(item.system.description.value)}` : '',
			'fill | 3',
		],
	};
	return { ...defaultCard(item), ...card };
}
function contentCard(item, contents) {
	return { ...defaultCard(item), ...{ contents } };
}

export const CARD_TYPES = {
	equipment: (item) => {
		if (item.isArmor) return generateArmor(item);
		return generateBasic(item);
	},
	spell: generateSpell,
	weapon: generateWeapon,
	consumable: generateBasic,
	feat: (item) => generateBasic(item, 'indigo'),
};
export async function createFrontCard(item) {
	const options = { ...defaultOptions(item) };
	const contents = item.getFlag('item-cards-dnd5e', 'contents');
	const card = contents
		? contentCard(item, contents.split('\n'))
		: await (CARD_TYPES[item.type]?.(item) ?? generateBasic(item));
	return card_generate_front(card, options);
}
export async function createBackCard(item) {
	const options = { ...defaultOptions(item) };
	const contents = item.getFlag('item-cards-dnd5e', 'contents');
	const card = contents
		? contentCard(item, contents.split('\n'))
		: await (CARD_TYPES[item.type]?.(item) ?? generateBasic(item));
	return card_generate_back(card, options);
}
