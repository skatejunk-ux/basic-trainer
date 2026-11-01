import { HashRouter, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { Placeholder } from './components/Placeholder';
import { nl } from './content/nl';
import { DevMusclesPage } from './illustration/DevMusclesPage';
import { TodayPage } from './features/today/TodayPage';
import { WorkoutPage } from './features/workout/WorkoutPage';

const p = nl.pages;

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="workout" element={<WorkoutPage />} />
        <Route element={<AppShell />}>
          <Route index element={<TodayPage />} />
          <Route path="historie" element={<Placeholder title={p.history.title} text={p.history.placeholder} />} />
          <Route path="schema" element={<Placeholder title={p.schema.title} text={p.schema.placeholder} />} />
          <Route path="meer" element={<Placeholder title={p.more.title} text={p.more.placeholder} />} />
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
