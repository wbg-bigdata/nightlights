const React = require('react');
const t = require('prop-types');
const Actions = require('../actions');
const classnames = require('classnames');
const titlecase = require('titlecase');

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

VillageDetail.propTypes = {
  villages: t.array.isRequired,
  villageNames: t.array.isRequired,
  region: t.object
};

module.exports = VillageDetail;
