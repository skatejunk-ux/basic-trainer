import { HashRouter, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { Placeholder } from './components/Placeholder';
import { nl } from './content/nl';
import { DevMusclesPage } from './illustration/DevMusclesPage';

const p = nl.pages;

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Placeholder title={p.today.title} text={p.today.placeholder} />} />
          <Route path="historie" element={<Placeholder title={p.history.title} text={p.history.placeholder} />} />
          <Route path="schema" element={<Placeholder title={p.schema.title} text={p.schema.placeholder} />} />
          <Route path="meer" element={<Placeholder title={p.more.title} text={p.more.placeholder} />} />
          <Route path="workout" element={<Placeholder title={p.workout.title} text={p.workout.placeholder} />} />
          <Route path="oefening/:id" element={<Placeholder title={p.exercise.title} text={p.exercise.placeholder} />} />
          <Route path="dev/muscles" element={<DevMusclesPage />} />
          <Route
            path="*"
            element={<Placeholder title={p.notFound.title} text="" backTo="/" backLabel={p.notFound.back} />}
          />
        </Route>
      </Routes>
    </HashRouter>
  );
}
