import {
  activateTabContentListeners,
  specialMembership,
} from '../../module/item-sheet.js';

Hooks.once('tidy5e-sheet.ready', (api) => {
  (async () => {
    const section = await getTemplate(
      'modules/item-cards-dnd5e/templates/item-sheet-tab.hbs'
    );

    api.registerItemTab(
      new api.models.HtmlTab({
        title: 'Card',
        tabId: 'item-cards-dnd5e-item-tab',
        // ideally, we would register a HandlebarsTab here, but the additional options allowProtoMethodsByDefault and allowProtoPropertiesByDefault prevent this.
        // Instead, this registers an empty tab, and we'll put the template in after the empty tab renders.
        html: '',
        onRender({ app, data, element, tabContentsElement }) {
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
          $(tabContentsElement).append(tab);
          activateTabContentListeners(app, $(tabContentsElement));
        },
      })
    );
  })();
});
