import { useEffect } from "react";
import GoalInput from "./components/GoalInput";
import ResultsTree from "./components/ResultsTree";
import { useAppStore } from "./store";
import "./styles/globals.css";
import { loadPlanFromURL } from "./utils/persistence";

function App() {
  const { plan, calculate } = useAppStore();

  useEffect(() => {
    const loaded = loadPlanFromURL();
    if (loaded) useAppStore.setState({ plan: loaded });
  }, []);

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-100">
          Endfield Architect
        </h1>
      </div>
      <div className="mb-4">
        <button onClick={calculate} className="btn">
          Calculate
        </button>
      </div>
      <GoalInput />

      {plan.errors.length > 0 && (
        <div className="card mb-4 text-red-400">
          {plan.errors.map((err, i) => (
            <p key={i}>{err}</p>
          ))}
        </div>
      )}
      {plan.nodes.length > 0 && <ResultsTree nodes={plan.nodes} />}
    </div>
  );
}

export default App;
