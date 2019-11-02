const { React } = require('powercord/webpack')
const { SwitchItem } = require('powercord/components/settings')

module.exports = class Settings extends React.Component {
    render() {
        return (<div>
            <SwitchItem value={this.props.getSetting('ignoreMutedChannels')}
            onChange={() => this.props.toggleSetting('ignoreMutedChannels')}>
                Ignore muted channels
            </SwitchItem>
        </div>)
    }
}
