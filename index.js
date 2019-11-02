const { Plugin } = require('powercord/entities')
const { resolve } = require('path')
const { getModule, getModuleByDisplayName, React } = require('powercord/webpack')
const { inject, uninject } = require('powercord/injector')

module.exports = class UnreadCountBadges extends Plugin {
    badges = []
    lastGuildId = ""

    async startPlugin() {
        this.loadCSS(resolve(__dirname, 'style.css'))

        const { getUnreadCount } = await getModule(['getUnreadCount'])
        const dispatcher = await getModule(['dispatch'])

        const ChannelItem = await getModuleByDisplayName('ChannelItem')
        const NumberBadge = (await getModule(['NumberBadge'])).NumberBadge

        const _this = this

        inject('ucbadges', ChannelItem.prototype, 'renderIcons', function (_, res) {
            const uc = getUnreadCount(this.props.channel.id)
            if(uc > 0) {
                let i = res.props.children.length - 1
                if(res.props.children[i] &&
                    res.props.children[i].props.className == 'ucbadge') {
                        res.props.children[i] = React.createElement(
                            NumberBadge, { count: uc, className: 'ucbadge' }
                        )
                    }
                else {
                    res.props.children.push(React.createElement(
                        NumberBadge, { count: uc, className: 'ucbadge' }
                    ))
                    _this.badges.push(this)
                }
            }

            return res
        })

        dispatcher.subscribe('MESSAGE_CREATE', a => this.updateBadges(a))
        dispatcher.subscribe('CHANNEL_SELECT', a => this.switchChannel(a))
    }

    async pluginWillUnload() {
        uninject('ucbadges')
        const dispatcher = await getModule(['dispatch'])
        dispatcher.unsubscribe('MESSAGE_CREATE', a => this.updateBadges(a))
        dispatcher.unsubscribe('CHANNEL_SELECT', a => this.switchChannel(a))
    }

    updateBadges(a) {
        if(a.message.guild_id && a.message.guild_id == this.lastGuildId) {
            this.badges.filter(b => b.props.channel.id == a.message.channel_id).forEach(b => b.forceUpdate())
        }
    }

    switchChannel(a) {
        if(this.lastGuildId != a.guildId) {
            this.badges = []
            this.lastGuildId = a.guildId
        }
    }
}
