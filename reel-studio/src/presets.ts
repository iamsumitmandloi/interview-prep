// named graphics. a reel json just says {"do":"tree","preset":"three_trees","step":"rebuild"}
// ops per step: destroy (shatter + replace), reuse (green ring), update (text change), focus (dim others), pin (glow)
export type GNode = {id: string; label: string; sub?: string; tag?: string; col: number; row: number};
export type GOps = {
  destroy?: Record<string, {label?: string; sub?: string}>;
  reuse?: string[]; update?: Record<string, {label?: string; sub?: string}>;
  focus?: string[]; pin?: string[]; note?: string;
};
export type GPreset = {
  layout: 'columns' | 'cards';
  columns?: {title: string; color: string}[];
  nodes: GNode[];
  links?: [string, string][];   // vertical parent->child (same column) or across columns
  steps: Record<string, GOps>;
};

export const GRAPHS: Record<string, GPreset> = {
  three_trees: {
    layout: 'columns',
    columns: [{title: 'WIDGET', color: 'blue'}, {title: 'ELEMENT', color: 'cyan'}, {title: 'RENDER', color: 'yellow'}],
    nodes: [
      {id: 'w1', label: 'Counter', sub: '#a1f3', col: 0, row: 0},
      {id: 'w2', label: 'TextButton', sub: '#c3d9', col: 0, row: 1},
      {id: 'w3', label: "Text('41')", sub: '#5b20', col: 0, row: 2},
      {id: 'e1', label: 'StatefulElement', sub: 'State#77 · count 41', col: 1, row: 0},
      {id: 'e2', label: 'StatefulElement', sub: 'TextButton', col: 1, row: 1},
      {id: 'e3', label: 'StatelessElement', sub: 'Text', col: 1, row: 2},
      {id: 'r3', label: 'RenderParagraph', sub: "'41'", col: 2, row: 2},
    ],
    links: [['w1', 'w2'], ['w2', 'w3'], ['e1', 'e2'], ['e2', 'e3'], ['w1', 'e1'], ['w2', 'e2'], ['w3', 'e3'], ['e3', 'r3']],
    steps: {
      build: {},
      rebuild: {
        destroy: {w2: {sub: '#e81a'}, w3: {label: "Text('42')", sub: '#f04c'}},
        reuse: ['e1', 'e2', 'e3'],
        update: {e1: {sub: 'State#77 · count 42'}, r3: {sub: "'42'"}},
        note: 'new widgets, same elements',
      },
      state: {focus: ['e1'], pin: ['e1'], note: 'State lives here. it survives.'},
    },
  },
  rebuild_cost: {
    layout: 'cards',
    nodes: [
      {id: 'w', label: "Text('42')", sub: 'Widget', tag: 'a few fields · cheap', col: 0, row: 0},
      {id: 'e', label: 'StatelessElement', sub: 'Element', tag: 'long-lived · compares', col: 0, row: 1},
      {id: 'r', label: 'RenderParagraph', sub: 'RenderObject', tag: 'layout + paint · expensive', col: 0, row: 2},
    ],
    steps: {
      widget: {focus: ['w'], pin: ['w']},
      render: {focus: ['r'], pin: ['r']},
      compare: {destroy: {w: {label: "Text('43')"}}, reuse: ['e', 'r'], update: {r: {tag: 'repaints only what changed'}}, note: 'widget thrown away. the rest reused.'},
    },
  },
  bloc_parent: {
    layout: 'cards',
    nodes: [
      {id: 'p', label: 'BlocBuilder', sub: 'parent · has a State', tag: '_state: count 41', col: 0, row: 0},
      {id: 'c', label: 'CounterText', sub: 'StatelessWidget #a1f3', tag: 'count: 41', col: 0, row: 1},
    ],
    steps: {
      show: {},
      emit: {update: {p: {tag: '_state: count 42'}}, destroy: {c: {sub: 'StatelessWidget #b7e2', tag: 'count: 42'}}, note: 'parent hands it new data'},
    },
  },
  widget_vs_state: {
    layout: 'cards',
    nodes: [
      {id: 'w', label: 'Counter', sub: '#a1f3', tag: '@immutable · blueprint', col: 0, row: 0},
      {id: 's', label: 'State<Counter>', sub: '#77', tag: 'count: 41', col: 0, row: 1},
    ],
    steps: {
      show: {},
      replace: {destroy: {w: {sub: '#b7e2'}}, reuse: ['s'], update: {s: {tag: 'count: 42'}}, note: 'widget replaced. State kept.'},
    },
  },
};

export const LIFECYCLES: Record<string, string[]> = {
  bloc_flow: ['add(event)', 'emit(state)', 'bloc.stream', 'BlocListener', 'setState', 'markNeedsBuild', 'build', 'builder(context, state)'],
  stateful: ['createState', 'initState', 'didChangeDependencies', 'build', 'didUpdateWidget', 'setState', 'deactivate', 'dispose'],
};
