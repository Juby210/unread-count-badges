const { React } = require('powercord/webpack')
const { SwitchItem } = require('powercord/components/settings')

module.exports = ({ getSetting, toggleSetting }) => <SwitchItem
    value={getSetting('ignoreMutedChannels')}
    onChange={() => toggleSetting('ignoreMutedChannels')}
>Ignore muted channels</SwitchItem>
