import type { ComponentProps } from 'react';
import { TodoEditor } from './TodoEditor';
import { TodoHistory } from './TodoHistory';

export function Todos(props: ComponentProps<typeof TodoEditor>) {
  return <section className="todos-workspace" aria-label="누적 TODO 관리">
    <TodoEditor {...props} />
    <TodoHistory todos={props.todos} todayKey={props.todayKey} />
  </section>;
}
