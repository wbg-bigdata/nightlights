let React = require('react');
let Actions = require('../actions');
let classnames = require('classnames');
let titlecase = require('titlecase');

class VillageDetail extends React.Component {
  render () {
    let villages = this.props.villages || [];
    let villageNames = this.props.villageNames || [];
    let region = this.props.region;
    let emphasized = region.emphasized || [];

    if (!this.props.region.district || !villages.length) { return <div></div>; }

    let emphasize = (village) => () => Actions.emphasize(village);
    let unselect = (villages) => () => Actions.unselectVillages(villages);
    return (
      <div className='village-detail'>
        {villages.length > 0
          ? [
            <h1>Selected Villages</h1>,
            <ul>
              {villages.map((village, i) =>
                <li key={village} onMouseEnter={emphasize(village)}
                  className={classnames({active: emphasized.indexOf(village) >= 0})}
                >
                  {titlecase(villageNames[i].toLowerCase())}
                  <a className='bttn-cancel'
                    onClick={unselect([village])} >
                    <span>Remove Village</span>
                  </a>
                </li>
              )}
            </ul>,
            <a className='bttn-clear-selection'
              onClick={unselect(villages)}>Clear Selection</a>
          ]
          : ''
        }
      </div>
    );
  }
}

VillageDetail.displayName = 'VillageDetail';
VillageDetail.propTypes = {
  villages: React.PropTypes.array.isRequired,
  villageNames: React.PropTypes.array.isRequired,
  region: React.PropTypes.object
};

module.exports = VillageDetail;
