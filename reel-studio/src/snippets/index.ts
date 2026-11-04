// real flutter source, trimmed (asserts removed). keep the file label honest.
export type Snippet = {file: string; code: string};
export const SNIPPETS: Record<string, Snippet> = {
  counter_widget: {
    file: 'lib/counter.dart',
    code: `class Counter extends StatefulWidget {
  const Counter({super.key});

  @override
  State<Counter> createState() => _CounterState();
}

class _CounterState extends State<Counter> {
  int count = 41;

  @override
  Widget build(BuildContext context) {
    return TextButton(
      onPressed: () => setState(() => count++),
      child: Text('$count'),
    );
  }
}`,
  },
  stateful_immutable: {
    file: 'flutter/lib/src/widgets/framework.dart',
    code: `@immutable
abstract class Widget extends DiagnosticableTree {
  const Widget({this.key});
  final Key? key;
}

abstract class StatefulWidget extends Widget {
  const StatefulWidget({super.key});

  @protected
  @factory
  State createState();
}`,
  },
  stateful_element_ctor: {
    file: 'flutter/lib/src/widgets/framework.dart',
    code: `class StatefulElement extends ComponentElement {
  StatefulElement(StatefulWidget widget)
      : _state = widget.createState(),
        super(widget) {
    state._element = this;
    state._widget = widget;
  }

  State<StatefulWidget> get state => _state!;
  State<StatefulWidget>? _state;
}`,
  },
  set_state: {
    file: 'flutter/lib/src/widgets/framework.dart',
    code: `@protected
void setState(VoidCallback fn) {
  final Object? result = fn() as dynamic;
  _element!.markNeedsBuild();
}

void markNeedsBuild() {
  if (dirty) return;
  _dirty = true;
  owner!.scheduleBuildFor(this);
}`,
  },
  update_child: {
    file: 'flutter/lib/src/widgets/framework.dart',
    code: `// Element.updateChild (simplified)
Element? updateChild(Element? child, Widget newWidget) {
  if (child != null) {
    if (child.widget == newWidget) {
      return child;              // same instance (const): skip
    }
    if (Widget.canUpdate(child.widget, newWidget)) {
      child.update(newWidget);   // reuse the element
      return child;
    }
    deactivateChild(child);      // type or key changed
  }
  return inflateWidget(newWidget);
}`,
  },
  bloc_builder: {
    file: 'flutter_bloc/lib/src/bloc_builder.dart',
    code: `class BlocBuilder<B, S> extends BlocBuilderBase<B, S> {
  const BlocBuilder({required this.builder, ...});
  final BlocWidgetBuilder<S> builder;
}

abstract class BlocBuilderBase<B, S>
    extends StatefulWidget {
  ...
}`,
  },
  bloc_builder_state: {
    file: 'flutter_bloc/lib/src/bloc_builder.dart',
    code: `class _BlocBuilderBaseState<B, S> extends State<BlocBuilderBase<B, S>> {
  late S _state;

  @override
  Widget build(BuildContext context) {
    return BlocListener<B, S>(
      bloc: _bloc,
      listenWhen: widget.buildWhen,
      listener: (context, state) => setState(() => _state = state),
      child: widget.build(context, _state),
    );
  }
}`,
  },
  can_update: {
    file: 'flutter/lib/src/widgets/framework.dart',
    code: `static bool canUpdate(Widget oldWidget, Widget newWidget) {
  return oldWidget.runtimeType == newWidget.runtimeType
      && oldWidget.key == newWidget.key;
}`,
  },
};
