import {useEffect, useState} from 'react';

import './Panel.css';

export function Panel({side}) {
  const [expanded, setExpanded] = useState(false);

  const classNamePanel = [
    'panel',
    side ? 'panel-right' : 'panel-left',
    expanded ? 'expanded' : '',
  ].filter((className) => className.length).join(' ');
  const classNameIcon = side ? 'far fa-chart-bar' : 'fas fa-cog';

  return (
    <div className={classNamePanel}>
      <button onClick={() => setExpanded(!expanded)}>
        <i className={classNameIcon}></i>
      </button>
    </div>
  );
}
