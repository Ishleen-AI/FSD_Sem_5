import React, { useMemo, useState } from 'react';

import Exp1 from '../FSD_Exp_1.tsx';
import Exp12 from '../FSD_Exp_1.2.tsx';
import Exp2 from '../FSD_Exp_2.tsx';
import Exp22 from '../FSD_Exp_2.2.tsx';
import Exp3 from '../FSD_Exp_3.tsx';
import Exp32 from '../FSD_Exp_3.2.tsx';
import Exp4 from '../FSD_Exp_4.tsx';
import Exp42 from '../FSD_Exp_4.2.tsx';

const experimentFiles = [
  { id: 'FSD_Exp_1', label: 'FSD Experiment 1', component: Exp1 },
  { id: 'FSD_Exp_1.2', label: 'FSD Experiment 1.2', component: Exp12 },
  { id: 'FSD_Exp_2', label: 'FSD Experiment 2', component: Exp2 },
  { id: 'FSD_Exp_2.2', label: 'FSD Experiment 2.2', component: Exp22 },
  { id: 'FSD_Exp_3', label: 'FSD Experiment 3', component: Exp3 },
  { id: 'FSD_Exp_3.2', label: 'FSD Experiment 3.2', component: Exp32 },
  { id: 'FSD_Exp_4', label: 'FSD Experiment 4', component: Exp4 },
  { id: 'FSD_Exp_4.2', label: 'FSD Experiment 4.2', component: Exp42 },
];

function ExperimentView({ component: Component }) {
  if (!Component) {
    return <div style={{ padding: 24, color: '#475569' }}>Loading experiment...</div>;
  }

  return <Component />;
}

export default function App() {
  const [selected, setSelected] = useState(experimentFiles[0]);

  const activeComponent = useMemo(() => {
    return selected ? selected.component : experimentFiles[0].component;
  }, [selected]);

  return (
    <div className="app-shell">
      <div className="topbar">
        <div>
          <small>FSD Lab</small>
          <h1>Experiment Hub</h1>
        </div>
      </div>

      <div className="experiment-grid">
        {experimentFiles.map((exp) => (
          <div
            key={exp.id}
            className={`card ${selected?.id === exp.id ? 'active' : ''}`}
            onClick={() => setSelected(exp)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSelected(exp);
              }
            }}
          >
            <div className="card-badge">{exp.id.replace('FSD_Exp_', '').replace('.', '.')}</div>
            <h3>{exp.label}</h3>
            <p>Run locally in browser</p>
          </div>
        ))}
      </div>

      <div className="preview-panel">
        <div className="preview-header">{selected?.label}</div>
        <div className="preview-body">
          <ExperimentView component={activeComponent} />
        </div>
      </div>
    </div>
  );
}
