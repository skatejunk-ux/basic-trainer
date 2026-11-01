import { HashRouter, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { Placeholder } from './components/Placeholder';
import { nl } from './content/nl';
import { DevMusclesPage } from './illustration/DevMusclesPage';
import { ExerciseDetail } from './features/exercise/ExerciseDetail';
import { NewExercise } from './features/exercise/NewExercise';
import { HistoryPage } from './features/history/HistoryPage';
import { SessionDetail } from './features/history/SessionDetail';
import { SchemaPage } from './features/schema/SchemaPage';
import { TemplateEditor } from './features/schema/TemplateEditor';
import { MorePage } from './features/settings/MorePage';
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
          <Route path="historie" element={<HistoryPage />} />
          <Route path="historie/:id" element={<SessionDetail />} />
          <Route path="schema" element={<SchemaPage />} />
          <Route path="schema/:id" element={<TemplateEditor />} />
          <Route path="meer" element={<MorePage />} />
          <Route path="oefening/nieuw" element={<NewExercise />} />
          <Route path="oefening/:id" element={<ExerciseDetail />} />
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
