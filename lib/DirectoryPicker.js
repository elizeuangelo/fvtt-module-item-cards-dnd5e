class DirectoryPicker extends FilePicker {
    constructor(options = {}) {
        super(options);
    }
    _onSubmit(event) {
        event.preventDefault();
        const path = event.target.target.value;
        const activeSource = this.activeSource;
        const bucket = event.target.bucket ? event.target.bucket.value : null;
        this.field.value = DirectoryPicker.format({
            activeSource,
            bucket,
            path,
        });
        this.close();
    }
    static async uploadToPath(path, file) {
        const options = DirectoryPicker.parse(path);
        return FilePicker.upload(options.activeSource, options.current, file, { bucket: options.bucket });
    }
    static Directory(val) {
        return val == null ? '' : String(val);
    }
    static format(value) {
        return value.bucket !== null ? `[${value.activeSource}:${value.bucket}] ${value.path}` : `[${value.activeSource}] ${value.path}`;
    }
    static parse(inStr) {
        const str = inStr ?? '';
        let matches = str.match(/\[(.+)\]\s*(.+)?/u);
        if (matches) {
            let [, source, current = ''] = matches;
            current = current.trim();
            const [s3, bucket] = source.split(':');
            if (bucket !== undefined) {
                return {
                    activeSource: s3,
                    bucket: bucket,
                    current: current,
                };
            }
            else {
                return {
                    activeSource: s3,
                    bucket: null,
                    current: current,
                };
            }
        }
        return {
            activeSource: 'data',
            bucket: null,
            current: str,
        };
    }
    static extractUrl(str) {
        let options = DirectoryPicker.parse(str);
        if (options.activeSource === 'data' || options.activeSource === 'public') {
            return;
        }
        else {
            return options.current;
        }
    }
    static processHtml(html) {
        $(html)
            .find(`input[data-dtype="Directory"]`)
            .each(function () {
            if (!$(this).next().length) {
                console.log('Adding Picker Button');
                let picker = new DirectoryPicker({
                    field: $(this)[0],
                    ...DirectoryPicker.parse(this.value),
                });
                let pickerButton = $('<button type="button" class="file-picker" data-type="imagevideo" data-target="img" title="Pick directory"><i class="fas fa-file-import fa-fw"></i></button>');
                pickerButton.on('click', function () {
                    picker.render(true);
                });
                $(this).parent().append(pickerButton);
            }
        });
    }
    activateListeners(html) {
        super.activateListeners(html);
        html.find('ol.files-list').remove();
        html.find('footer div').remove();
        html.find('footer button').text('Select Directory');
    }
}
Hooks.on('renderSettingsConfig', (app, html, user) => {
    DirectoryPicker.processHtml(html);
});
export default DirectoryPicker;
