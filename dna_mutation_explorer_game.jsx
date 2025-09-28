import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Bird } from "lucide-react";

// Natural Selection Simulator — Birds Edition
// Organisms represented as animated birds with beak size traits.
// Gameplay overview:
// - Bird population has different beak sizes: small, medium, large.
// - Environment favors certain beak sizes (seed size, predation).
// - Player adjusts environment and watches bird population evolve.

const TRAITS = ["Small", "Medium", "Large"];

function randomPopulation(size) {
  return Array.from({ length: size }, () => ({
    id: Math.random().toString(36).slice(2, 9),
    trait: TRAITS[Math.floor(Math.random() * TRAITS.length)],
    energy: 0,
  }));
}

function fitnessForTrait(trait, env) {
  let base = 1;
  if (env.seed === "small") {
    base = trait === "Small" ? 1.2 : trait === "Medium" ? 1.0 : 0.8;
  } else if (env.seed === "mixed") {
    base = trait === "Small" ? 1.05 : trait === "Medium" ? 1.1 : 1.0;
  } else {
    base = trait === "Small" ? 0.7 : trait === "Medium" ? 1.0 : 1.25;
  }

  const predatorPenalty = env.predatorStrength * (trait === "Large" ? 0.3 : trait === "Small" ? 0.05 : 0.15);
  return Math.max(0.1, base - predatorPenalty);
}

export default function NaturalSelectionBirds() {
  const [generation, setGeneration] = useState(1);
  const [populationSize, setPopulationSize] = useState(20);
  const [population, setPopulation] = useState(() => randomPopulation(populationSize));
  const [env, setEnv] = useState({ seed: "mixed", predatorStrength: 0.2 });
  const [foodPerGen, setFoodPerGen] = useState(18);
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState("");
  const [running, setRunning] = useState(false);

  useEffect(() => {
    setPopulation((prev) => {
      if (prev.length === populationSize) return prev;
      return randomPopulation(populationSize);
    });
  }, [populationSize]);

  const traitCounts = useMemo(() => {
    const counts = { Small: 0, Medium: 0, Large: 0 };
    population.forEach((p) => (counts[p.trait]++));
    return counts;
  }, [population]);

  function simulateGeneration() {
    setRunning(true);
    setMessage("Simulating generation...");

    const scored = population.map((org) => {
      const fit = fitnessForTrait(org.trait, env);
      const randomNoise = 0.7 + Math.random() * 0.6;
      const score = fit * randomNoise;
      return { ...org, score };
    });

    scored.sort((a, b) => b.score - a.score);

    let foodLeft = foodPerGen;
    const survivors = [];
    for (let i = 0; i < scored.length; i++) {
      if (foodLeft > 0) {
        foodLeft--;
        survivors.push(scored[i]);
      }
    }

    const afterPredation = survivors.filter(() => Math.random() > env.predatorStrength * 0.5);

    const offspring = [];
    while (offspring.length < populationSize) {
      if (afterPredation.length === 0) break;
      const totalScore = afterPredation.reduce((s, p) => s + p.score, 0);
      const pick = Math.random() * totalScore;
      let acc = 0;
      let parent = afterPredation[0];
      for (const p of afterPredation) {
        acc += p.score;
        if (pick <= acc) {
          parent = p;
          break;
        }
      }

      const mutate = Math.random() < 0.06;
      let trait = parent.trait;
      if (mutate) {
        if (trait === "Small") trait = Math.random() < 0.5 ? "Small" : "Medium";
        else if (trait === "Medium") trait = ["Small", "Medium", "Large"][Math.floor(Math.random() * 3)];
        else trait = Math.random() < 0.5 ? "Medium" : "Large";
      }

      offspring.push({ id: Math.random().toString(36).slice(2, 9), trait, energy: 0 });
    }

    let newPop = offspring;
    if (newPop.length < populationSize) {
      newPop = [...newPop, ...randomPopulation(populationSize - newPop.length)];
      setMessage((m) => m + " Population weakened; random immigrants arrived.");
    }

    setHistory((h) => [
      ...h,
      {
        generation,
        counts: { ...traitCounts },
        env: { ...env },
      },
    ]);

    setPopulation(newPop);
    setGeneration((g) => g + 1);
    setTimeout(() => {
      setRunning(false);
      setMessage("Generation complete. Observe the changes and adjust environment.");
    }, 700);
  }

  function resetSimulation() {
    setGeneration(1);
    setPopulation(randomPopulation(populationSize));
    setHistory([]);
    setMessage("");
  }

  function quickScenario(name) {
    if (name === "Drought (small seeds)") setEnv({ seed: "small", predatorStrength: 0.2 });
    if (name === "Abundant large seeds") setEnv({ seed: "large", predatorStrength: 0.1 });
    if (name === "High predators") setEnv({ seed: "mixed", predatorStrength: 0.6 });
    if (name === "Mixed stable") setEnv({ seed: "mixed", predatorStrength: 0.15 });
    setMessage(`Scenario set: ${name}`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-sky-900 to-indigo-900 text-white">
      <div className="max-w-4xl w-full rounded-2xl shadow-2xl bg-[rgba(255,255,255,0.05)] p-6">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Natural Selection — Birds</h1>
            <p className="text-sm text-gray-300">Watch how bird beak sizes evolve under different conditions.</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-300">Gen {generation}</div>
            <div className="text-xl font-bold">Pop: {population.length}</div>
          </div>
        </header>

        <main>
          <section className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="col-span-2 bg-white/5 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-300">Bird Population</div>
                <div className="text-sm text-gray-300">Food per gen: {foodPerGen}</div>
              </div>

              <div className="flex gap-2 flex-wrap">
                {population.slice(0, 80).map((org) => (
                  <motion.div
                    key={org.id}
                    animate={{ y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, delay: Math.random() }}
                    className={`w-12 h-12 rounded-full flex items-center justify-center shadow bg-white/10`}
                    title={`Beak: ${org.trait}`}
                  >
                    <Bird
                      size={28}
                      className={
                        org.trait === "Small"
                          ? "text-green-400"
                          : org.trait === "Medium"
                          ? "text-yellow-300"
                          : "text-red-400"
                      }
                    />
                  </motion.div>
                ))}
                {population.length > 80 && (
                  <div className="text-sm text-gray-400">... (+{population.length - 80} more)</div>
                )}
              </div>

              <div className="mt-3 text-sm text-gray-300">Small-beak: {traitCounts.Small} · Medium-beak: {traitCounts.Medium} · Large-beak: {traitCounts.Large}</div>
            </div>

            <aside className="bg-white/5 p-4 rounded-lg">
              <div className="mb-3">
                <div className="text-sm text-gray-300">Environment</div>
                <div className="text-sm mt-1">Seed size: <span className="font-semibold">{env.seed}</span></div>
                <div className="text-sm">Predator pressure: <span className="font-semibold">{Math.round(env.predatorStrength * 100)}%</span></div>
              </div>

              <div className="flex flex-col gap-2">
                <button onClick={() => quickScenario('Drought (small seeds)')} className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm">Drought (small seeds)</button>
                <button onClick={() => quickScenario('Abundant large seeds')} className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm">Abundant large seeds</button>
                <button onClick={() => quickScenario('High predators')} className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm">High predators</button>
                <button onClick={() => quickScenario('Mixed stable')} className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm">Mixed stable</button>
              </div>
            </aside>
          </section>

          <section className="mb-6 flex gap-2 items-center">
            <button onClick={simulateGeneration} disabled={running} className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-400 shadow">Simulate Gen</button>
            <button onClick={() => setFoodPerGen((f) => Math.max(1, f - 1))} className="px-3 py-2 rounded-lg bg-white/10">- Food</button>
            <button onClick={() => setFoodPerGen((f) => f + 1)} className="px-3 py-2 rounded-lg bg-white/10">+ Food</button>
            <div className="ml-auto flex items-center gap-2">
              <label className="text-sm text-gray-300">Pop size:</label>
              <input type="range" min="6" max="60" value={populationSize} onChange={(e) => setPopulationSize(Number(e.target.value))} className="w-40" />
              <div className="text-sm text-gray-300">{populationSize}</div>
            </div>
          </section>

          <section className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/5 p-4 rounded-lg">
              <div className="text-sm text-gray-300 mb-2">History</div>
              <div className="space-y-2 max-h-40 overflow-auto">
                {history.slice(-8).reverse().map((h, i) => (
                  <div key={i} className="text-sm text-gray-300 bg-white/3 p-2 rounded">
                    Gen {h.generation} — Small: {h.counts.Small} · Medium: {h.counts.Medium} · Large: {h.counts.Large} · Seed: {h.env.seed} · Pred: {Math.round(h.env.predatorStrength * 100)}%
                  </div>
                ))}
                {history.length === 0 && <div className="text-sm text-gray-400">No history yet — run a generation.</div>}
              </div>
            </div>

            <div className="bg-white/5 p-4 rounded-lg">
              <div className="text-sm text-gray-300 mb-2">Explanation</div>
              <div className="text-sm text-gray-400">
                Natural selection increases the frequency of traits that help birds survive and reproduce. Change seed size or predator pressure, run multiple generations, and watch beak sizes evolve.
              </div>
            </div>
          </section>

          <footer className="mt-4 flex items-center justify-between text-sm text-gray-300">
            <div>{message}</div>
            <div className="flex gap-2">
              <button onClick={resetSimulation} className="px-3 py-2 rounded-lg bg-white/10">Reset</button>
              <button onClick={() => { setHistory([]); setMessage('History cleared.'); }} className="px-3 py-2 rounded-lg bg-white/10">Clear History</button>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
