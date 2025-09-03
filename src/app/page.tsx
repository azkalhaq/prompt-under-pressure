"use client"

export default function Home() {
  return (
    <main className="flex flex-col items-center p-10 pb-24">
      <div className="w-full max-w-3xl mx-auto px-6">
        <h1 className="text-3xl font-semibold mb-2 text-center">🧠 Prompting Under Pressure: <br /> Research Overview</h1>
        <section className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Research Focus</h2>
          <p className="text-gray-700">
            This project investigates how cognitive load and stress affect user interactions with Large Language Models (LLMs),
            particularly the length, specificity, and quality of prompts.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Research Questions</h2>
          <ul className="list-disc pl-6 space-y-1 text-gray-700">
            <li>How does stress/cognitive load affect the quality of prompt formulation?</li>
            <li>To what extent does it influence reliance on prompting strategies and perceived task success?</li>
            <li>Are there measurable differences in LLM performance across baseline, stress, and overload conditions?</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Motivation</h2>
          <p className="text-gray-700">
            LLMs are increasingly used in high-pressure scenarios, yet little is known about how stress shapes prompting behaviour and task outcomes.
            This research addresses that gap from a human-centered perspective.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Methodology</h2>
          <div className="space-y-3 text-gray-700">
            <p><span className="font-medium">Participants:</span> 30+, aged 18–45, fluent in English, with prior LLM experience</p>
            <div>
              <p className="font-medium">Data Collection:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Surveys (demographics, anxiety levels)</li>
                <li>Experimental tasks (baseline, cognitive load, acute stress)</li>
                <li>Analysis of prompt history (length, specificity, strategy)</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Expected Contributions</h2>
          <ul className="list-disc pl-6 space-y-1 text-gray-700">
            <li>Empirical evidence on the relationship between stress and LLM prompt quality</li>
            <li>Design insights for stress-resilient LLM interfaces</li>
            <li>Recommendations for inclusive AI systems supporting diverse real-world conditions</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
