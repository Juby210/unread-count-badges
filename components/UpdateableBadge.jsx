const { React, getModule } = require('powercord/webpack')

const m = getModule(['NumberBadge'], false)

module.exports = class UpdateableBadge extends React.PureComponent {
    constructor(props) {
        super(props)

        props._this.badges.push(this)
    }

    componentWillUnmount() {
        const i = this.props._this.badges.indexOf(this)
        if (i != -1) this.props._this.badges.splice(i, 1)
    }

    render() {
        return <m.NumberBadge count={this.props.getUnreadCount(this.props.channelId)} className={this.props.className} />
    }
}
