// Settings system (data-driven). To add a new option: add one entry to DEFS and read it with DS.Settings.get('key').
// Values are saved in the browser (localStorage) and applied instantly.
(function (DS) {
  const DEFS = [
    { group: 'Guide & HUD' },
    { key: 'cues', label: 'Move cue icons', type: 'toggle', def: true },
    { key: 'guide', label: 'Guide text size', type: 'choice', def: 'small', options: [['off', 'Off'], ['small', 'Small'], ['medium', 'Medium'], ['large', 'Large']] },
    { key: 'guidePos', label: 'Guide text position', type: 'choice', def: 'bottom', options: [['bottom', 'Bottom'], ['center', 'Center']] },
    { key: 'progress', label: 'Level progress bar', type: 'toggle', def: true },
    { key: 'speedlines', label: 'Speed lines', type: 'toggle', def: true },
    { key: 'touch', label: 'Touch buttons', type: 'choice', def: 'auto', options: [['auto', 'Auto'], ['on', 'On'], ['off', 'Off']] },

    { group: 'Gameplay' },
    { key: 'speed', label: 'Game speed', type: 'choice', def: 1, options: [[0.8, 'Slow'], [1, 'Normal'], [1.2, 'Fast']] },
    { key: 'autoPose', label: 'Pose walls break automatically', type: 'toggle', def: false },

    { group: 'Camera' },
    { key: 'fov', label: 'Field of view', type: 'choice', def: 72, options: [[64, 'Narrow'], [72, 'Normal'], [80, 'Wide']] },
    { key: 'shake', label: 'Camera shake', type: 'choice', def: 1, options: [[0, 'Off'], [0.5, 'Low'], [1, 'Normal']] },
    { key: 'bob', label: 'Head bob', type: 'toggle', def: true },

    { group: 'Sound' },
    { key: 'master', label: 'Master volume', type: 'range', def: 0.9, min: 0, max: 1, step: 0.05 },
    { key: 'voice', label: 'Voice cues', type: 'range', def: 1, min: 0, max: 1, step: 0.05 },
    { key: 'sfx', label: 'Sound effects', type: 'range', def: 0.7, min: 0, max: 1, step: 0.05 },

    { group: 'Graphics' },
    { key: 'quality', label: 'Quality', type: 'choice', def: 'high', options: [['high', 'High'], ['low', 'Low (faster)']] }
  ];

  const KEY = 'ds_infinity_run_settings_v1';
  const S = { defs: DEFS, values: {}, listeners: [] };
  DEFS.forEach(d => { if (d.key) S.values[d.key] = d.def; });
  try { const saved = JSON.parse(localStorage.getItem(KEY) || '{}'); Object.assign(S.values, saved); } catch (e) { }

  S.get = (k) => S.values[k];
  S.set = function (k, v) { S.values[k] = v; try { localStorage.setItem(KEY, JSON.stringify(S.values)); } catch (e) { } S.apply(); };
  S.onChange = (fn) => S.listeners.push(fn);
  S.reset = function () { DEFS.forEach(d => { if (d.key) S.values[d.key] = d.def; }); try { localStorage.removeItem(KEY); } catch (e) { } S.apply(); S.render(S._root); };

  // apply CSS-level settings; JS-level ones are read by main/ui/audio via listeners/get()
  S.apply = function () {
    const b = document.body, v = S.values;
    b.classList.toggle('no-cues', !v.cues);
    b.classList.toggle('no-guide', v.guide === 'off');
    b.classList.toggle('guide-center', v.guidePos === 'center');
    b.classList.toggle('no-progress', !v.progress);
    b.classList.toggle('touch-on', v.touch === 'on');
    b.classList.toggle('touch-off', v.touch === 'off');
    const gs = { small: 0.7, medium: 0.9, large: 1.15, off: 0.7 }[v.guide] || 0.7;
    document.documentElement.style.setProperty('--gs', gs);
    S.listeners.forEach(fn => { try { fn(v); } catch (e) { console.error(e); } });
  };

  // build the settings UI into a container element
  S.render = function (root) {
    if (!root) return; S._root = root;
    root.innerHTML = '';
    DEFS.forEach(d => {
      if (d.group) { const h = document.createElement('div'); h.className = 'set-group'; h.textContent = d.group; root.appendChild(h); return; }
      const row = document.createElement('div'); row.className = 'set-row';
      const lab = document.createElement('span'); lab.textContent = d.label; row.appendChild(lab);
      const ctl = document.createElement('div'); ctl.className = 'set-ctl';
      if (d.type === 'toggle') {
        const b = document.createElement('button'); b.className = 'set-toggle' + (S.values[d.key] ? ' on' : '');
        b.textContent = S.values[d.key] ? 'ON' : 'OFF';
        b.onclick = () => { S.set(d.key, !S.values[d.key]); b.classList.toggle('on', S.values[d.key]); b.textContent = S.values[d.key] ? 'ON' : 'OFF'; };
        ctl.appendChild(b);
      } else if (d.type === 'choice') {
        d.options.forEach(([val, txt]) => {
          const b = document.createElement('button'); b.className = 'set-opt' + (S.values[d.key] === val ? ' on' : ''); b.textContent = txt;
          b.onclick = () => { S.set(d.key, val); ctl.querySelectorAll('.set-opt').forEach(x => x.classList.remove('on')); b.classList.add('on'); };
          ctl.appendChild(b);
        });
      } else if (d.type === 'range') {
        const r = document.createElement('input'); r.type = 'range'; r.min = d.min; r.max = d.max; r.step = d.step; r.value = S.values[d.key];
        const out = document.createElement('b'); out.textContent = Math.round(S.values[d.key] * 100) + '%';
        r.oninput = () => { S.set(d.key, parseFloat(r.value)); out.textContent = Math.round(r.value * 100) + '%'; };
        ctl.appendChild(r); ctl.appendChild(out);
      }
      row.appendChild(ctl); root.appendChild(row);
    });
  };

  DS.Settings = S;
})(window.DS);
